/**
 * NexaMOS Shared AI HTTP Client (Infrastructure Boundary)
 *
 * Sourced from NexaMOS Production Pilot 01 Step 3 specifications.
 * Menjalankan komunikasi HTTP dengan provider LLM menggunakan native fetch.
 *
 * Fitur:
 * 1. Autentikasi aman tanpa logging rahasia.
 * 2. Timeout terpusat menggunakan AbortController.
 * 3. Retry transien terikat (429, 5xx, network failure) dengan bounded exponential backoff.
 * 4. Tanpa retry untuk 400, 401, 403.
 * 5. Normalisasi error menjadi kode kanonikal.
 * 6. Observabilitas penggunaan token (AIUsageMetadata).
 */

import type { AIProviderConfig } from './ai-provider-config.ts';
import { validateAIProviderConfig } from './ai-provider-config.ts';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIUsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  providerRequestId?: string;
  durationMs: number;
}

export interface AICompletionResult {
  content: string;
  usage: AIUsageMetadata;
  model: string;
  provider: string;
}

export interface AICompletionOptions {
  messages: ChatMessage[];
  responseFormat?: 'json_object' | 'text';
  temperature?: number;
  maxTokens?: number;
  fetchFn?: typeof fetch; // Injection point untuk unit testing offline
  retryDelayMs?: number;  // Overridable untuk test cepat
}

export class AIClientError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(code: string, message: string, options: { statusCode?: number; retryable?: boolean } = {}) {
    super(`[${code}] ${message}`);
    this.name = 'AIClientError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
  }
}

export class AIHttpClient {
  private readonly config: AIProviderConfig;
  private readonly customFetch?: typeof fetch;

  constructor(config: AIProviderConfig, customFetch?: typeof fetch) {
    this.config = config;
    this.customFetch = customFetch;
  }

  /**
   * Menjalankan completion ke endpoint chat completions
   */
  public async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    validateAIProviderConfig(this.config);

    const fetchImpl = options.fetchFn || this.customFetch || globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new AIClientError('AI_REQUEST_FAILED', 'Runtime fetch tidak tersedia.');
    }

    const cleanBaseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBaseUrl}/chat/completions`;
    const payload = {
      model: this.config.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens,
      response_format: options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined
    };

    const maxRetries = this.config.maxRetries;
    let attempt = 0;
    const startTime = Date.now();

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timer);

        // Evaluasi respon sukses
        if (response.ok) {
          const data: any = await response.json();
          const choice = data?.choices?.[0];
          const text = choice?.message?.content;

          if (!text || text.trim().length === 0) {
            throw new AIClientError('AI_RESPONSE_EMPTY', 'Respon model kosong (empty response content).');
          }

          const durationMs = Date.now() - startTime;
          const usage: AIUsageMetadata = {
            inputTokens: data?.usage?.prompt_tokens,
            outputTokens: data?.usage?.completion_tokens,
            totalTokens: data?.usage?.total_tokens,
            providerRequestId: typeof data?.id === 'string' ? data.id : undefined,
            durationMs
          };

          return {
            content: text,
            usage,
            model: data?.model || this.config.model,
            provider: this.config.provider
          };
        }

        // Tangani status error HTTP
        const statusCode = response.status;
        const errorBody = await response.text().catch(() => '');
        const sanitizedBody = this.sanitizeLog(errorBody);

        // Pemeriksaan kuota gratis/unpurchased khusus Alibaba Cloud MaaS / Qwen
        if (
          sanitizedBody.includes('AllocationQuota.FreeTierOnly') ||
          sanitizedBody.includes('AccessDenied.Unpurchased') ||
          sanitizedBody.includes('FreeQuotaExhausted')
        ) {
          throw new AIClientError(
            'AI_FREE_QUOTA_EXHAUSTED',
            `Kuota gratis model provider telah habis atau model belum diaktifkan di Alibaba Cloud Model Studio console. ${sanitizedBody}`,
            { statusCode, retryable: false }
          );
        }

        if (statusCode === 401 || statusCode === 403) {
          throw new AIClientError(
            'AI_AUTHENTICATION_FAILED',
            `Autentikasi gagal (HTTP ${statusCode}). Periksa kembali API key.`,
            { statusCode, retryable: false }
          );
        }

        if (statusCode === 429) {
          const isLastAttempt = attempt > maxRetries;
          if (isLastAttempt) {
            throw new AIClientError(
              'AI_RATE_LIMITED',
              `Batas kuota / rate limit tercapai (HTTP 429). ${sanitizedBody}`,
              { statusCode, retryable: true }
            );
          }
          // Ekstrak rekomendasi retryDelay dari provider jika ada
          let retryDelayMs = options.retryDelayMs;
          if (retryDelayMs === undefined) {
            const retryHeader = response.headers?.get?.('retry-after');
            if (retryHeader) {
              const sec = parseFloat(retryHeader);
              if (!isNaN(sec) && sec > 0) {
                retryDelayMs = Math.ceil(sec * 1000) + 1500;
              }
            }
          }
          if (retryDelayMs === undefined) {
            try {
              const parsed = JSON.parse(errorBody);
              const details = parsed?.error?.details || parsed?.[0]?.error?.details;
              const retryInfo = Array.isArray(details) ? details.find((d: any) => d?.['@type']?.includes('RetryInfo')) : undefined;
              if (retryInfo?.retryDelay) {
                const match = String(retryInfo.retryDelay).match(/([\d.]+)s/);
                if (match) {
                  retryDelayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500;
                }
              }
              if (!retryDelayMs) {
                const msg = parsed?.error?.message || parsed?.[0]?.error?.message || '';
                const match = msg.match(/Please retry in ([\d.]+)s/i);
                if (match) {
                  retryDelayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500;
                }
              }
            } catch {
              // Abaikan kegagalan parsing JSON error body
            }
          }
          // Lanjut retry dengan backoff
          await this.delayBackoff(attempt, retryDelayMs, true);
          continue;
        }

        if (statusCode >= 500 && statusCode < 600) {
          const isLastAttempt = attempt > maxRetries;
          if (isLastAttempt) {
            throw new AIClientError(
              'AI_PROVIDER_UNAVAILABLE',
              `Provider mengalami gangguan internal (HTTP ${statusCode}). ${sanitizedBody}`,
              { statusCode, retryable: true }
            );
          }
          // Lanjut retry dengan backoff (503 temporary demand spike menggunakan jeda lebih panjang)
          await this.delayBackoff(attempt, options.retryDelayMs, statusCode === 503);
          continue;
        }

        // Error non-retryable lainnya (misal 400 Bad Request)
        throw new AIClientError(
          'AI_REQUEST_FAILED',
          `Permintaan gagal dengan HTTP ${statusCode}. ${sanitizedBody}`,
          { statusCode, retryable: false }
        );
      } catch (err: any) {
        clearTimeout(timer);

        // Jika err sudah berupa AIClientError dan tidak retryable, langsung lempar
        if (err instanceof AIClientError && !err.retryable) {
          throw err;
        }

        // Tangani AbortError (Timeout)
        if (err.name === 'AbortError' || err.code === 20) {
          throw new AIClientError(
            'AI_REQUEST_TIMEOUT',
            `Permintaan AI melampaui batas waktu ${this.config.timeoutMs}ms.`,
            { retryable: false }
          );
        }

        // Tangani kegagalan jaringan / network failure (transient)
        const isLastAttempt = attempt > maxRetries;
        if (isLastAttempt) {
          if (err instanceof AIClientError) throw err;
          throw new AIClientError(
            'AI_REQUEST_FAILED',
            `Gagal menghubungi provider: ${this.sanitizeLog(err.message || String(err))}`,
            { retryable: true }
          );
        }

        await this.delayBackoff(attempt, options.retryDelayMs);
      }
    }

    throw new AIClientError('AI_REQUEST_FAILED', 'Gagal memproses permintaan setelah batas retry terlampaui.');
  }

  /**
   * Menghitung jeda backoff eksponensial sederhana
   */
  private async delayBackoff(attempt: number, overrideMs?: number, isHighDemand = false): Promise<void> {
    if (overrideMs !== undefined) {
      console.log(`  [INFO] AI Provider rate-limit. Menunggu jeda ${overrideMs}ms sesuai rekomendasi provider (percobaan ${attempt})...`);
      await new Promise((res) => setTimeout(res, overrideMs));
      return;
    }
    const base = isHighDemand ? 4000 : 1000;
    const ms = Math.min(base * Math.pow(2, attempt - 1), 25000);
    console.log(`  [INFO] AI Provider sibuk/rate-limit. Menunggu jeda retry ${ms}ms (percobaan ${attempt})...`);
    await new Promise((res) => setTimeout(res, ms));
  }

  /**
   * Mencegah bocornya credential dalam pesan error
   */
  private sanitizeLog(text: string): string {
    if (!text) return '';
    let sanitized = text;
    if (this.config.apiKey && this.config.apiKey.length > 4) {
      sanitized = sanitized.replace(new RegExp(this.config.apiKey, 'g'), '[REDACTED_API_KEY]');
    }
    return sanitized.slice(0, 300); // Batasi panjang error string
  }
}
