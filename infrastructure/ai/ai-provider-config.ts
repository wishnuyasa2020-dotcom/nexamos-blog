/**
 * NexaMOS AI Provider Configuration
 *
 * Sourced from NexaMOS Blog Production Pilot 01 Step 3 specifications & Gemini Activation.
 * Mengelola konfigurasi provider LLM nyata (Gemini / OpenAI / OpenAI-Compatible)
 * secara aman dari process.env dengan validasi ketat.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

export const GEMINI_CONFIG_DEFAULTS = {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/'
};

export const OPENAI_CONFIG_DEFAULTS = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1'
};

export const QWEN_CONFIG_DEFAULTS = {
  provider: 'qwen',
  model: 'qwen3.8-flash',
  baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  timeoutMs: 90000,
  maxRetries: 2
};

export const DEFAULT_AI_CONFIG: Readonly<Omit<AIProviderConfig, 'apiKey'>> = {
  provider: 'qwen',
  model: 'qwen3.8-flash',
  baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  timeoutMs: 90000,
  maxRetries: 2
};

export class AIConfigError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'AIConfigError';
    this.code = code;
  }
}

/**
 * Memuat file .env atau .env.local ke process.env secara native jika belum terpasang
 */
function loadEnvFile(filepath: string, overrideExisting = false): void {
  try {
    if (!fs.existsSync(filepath)) return;
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (overrideExisting || !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // Abaikan kegagalan baca file env lokal
  }
}

let envLoaded = false;

export function ensureEnvLoaded(): void {
  if (envLoaded) return;
  loadEnvFile(path.resolve('.env'), false);
  loadEnvFile(path.resolve('.env.local'), true);
  envLoaded = true;
}

/**
 * Reset status cache env loader (digunakan untuk pengujian)
 */
export function resetEnvLoader(): void {
  envLoaded = false;
}

/**
 * Membaca konfigurasi AI dari process.env dengan opsi override
 */
export function loadAIProviderConfig(overrides: Partial<AIProviderConfig> = {}): AIProviderConfig {
  ensureEnvLoaded();

  const provider = (overrides.provider || process.env.AI_PROVIDER || DEFAULT_AI_CONFIG.provider).trim().toLowerCase();
  const apiKey = (overrides.apiKey ?? process.env.AI_PROVIDER_API_KEY ?? '').trim();

  // Resolusi model & baseUrl default berdasarkan provider
  let defaultModel = DEFAULT_AI_CONFIG.model;
  let defaultBaseUrl = DEFAULT_AI_CONFIG.baseUrl;

  if (provider === 'openai') {
    defaultModel = OPENAI_CONFIG_DEFAULTS.model;
    defaultBaseUrl = OPENAI_CONFIG_DEFAULTS.baseUrl;
  } else if (provider === 'gemini') {
    defaultModel = GEMINI_CONFIG_DEFAULTS.model;
    defaultBaseUrl = GEMINI_CONFIG_DEFAULTS.baseUrl;
  } else if (provider === 'qwen') {
    defaultModel = QWEN_CONFIG_DEFAULTS.model;
    defaultBaseUrl = QWEN_CONFIG_DEFAULTS.baseUrl;
  }

  const model = (overrides.model || process.env.AI_PROVIDER_MODEL || defaultModel).trim();

  let baseUrl = (overrides.baseUrl || process.env.AI_PROVIDER_BASE_URL || defaultBaseUrl).trim();
  baseUrl = baseUrl.replace(/\/+$/, '');

  const rawTimeout = overrides.timeoutMs ?? (process.env.AI_REQUEST_TIMEOUT_MS ? parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) : undefined);
  const timeoutMs = typeof rawTimeout === 'number' && !isNaN(rawTimeout) ? rawTimeout : DEFAULT_AI_CONFIG.timeoutMs;

  const rawRetries = overrides.maxRetries ?? (process.env.AI_MAX_RETRIES ? parseInt(process.env.AI_MAX_RETRIES, 10) : undefined);
  const maxRetries = typeof rawRetries === 'number' && !isNaN(rawRetries) ? rawRetries : DEFAULT_AI_CONFIG.maxRetries;

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    timeoutMs,
    maxRetries
  };
}

/**
 * Memeriksa apakah API provider telah dikonfigurasi dengan credential yang ada
 */
export function isAIConfigured(config?: Partial<AIProviderConfig>): boolean {
  const resolved = config ? loadAIProviderConfig(config) : loadAIProviderConfig();
  const placeholders = new Set([
    'your_secret_api_key_here',
    'your_secret_gemini_api_key_here',
    'your_secret_qwen_api_key_here'
  ]);
  return resolved.apiKey.length > 0 && !placeholders.has(resolved.apiKey);
}

/**
 * Validasi ketat konfigurasi AI untuk penggunaan produksi
 */
export function validateAIProviderConfig(config: AIProviderConfig): void {
  if (!config.provider) {
    throw new AIConfigError('AI_PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER tidak disetel.');
  }

  const supportedProviders = new Set(['openai', 'openai-compatible', 'gemini', 'qwen']);
  if (!supportedProviders.has(config.provider)) {
    throw new AIConfigError(
      'AI_PROVIDER_NOT_CONFIGURED',
      `Provider '${config.provider}' belum didukung. Pilot 01 mendukung provider 'qwen', 'gemini', 'openai', atau 'openai-compatible'.`
    );
  }

  const placeholders = new Set([
    'your_secret_api_key_here',
    'your_secret_gemini_api_key_here',
    'your_secret_qwen_api_key_here'
  ]);
  if (!config.apiKey || placeholders.has(config.apiKey)) {
    throw new AIConfigError(
      'AI_PROVIDER_NOT_CONFIGURED',
      'AI_PROVIDER_API_KEY tidak ditemukan atau masih bernilai placeholder. Silakan isi API key yang valid di environment.'
    );
  }

  if (!config.model) {
    throw new AIConfigError('AI_CONFIG_INVALID', 'AI_PROVIDER_MODEL tidak boleh kosong.');
  }

  if (!config.baseUrl || (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://'))) {
    throw new AIConfigError('AI_CONFIG_INVALID', `AI_PROVIDER_BASE_URL '${config.baseUrl}' tidak valid (harus diawali http:// atau https://).`);
  }

  // Qwen Region Safety: Pilot 01 wajib menggunakan region Singapore (.ap-southeast-1.maas.aliyuncs.com)
  if (config.provider === 'qwen') {
    if (!config.baseUrl.includes('.ap-southeast-1.maas.aliyuncs.com')) {
      throw new AIConfigError(
        'AI_PROVIDER_REGION_MISMATCH',
        `Qwen provider Pilot 01 wajib menggunakan endpoint Singapore (.ap-southeast-1.maas.aliyuncs.com). Ditemukan: '${config.baseUrl}'.`
      );
    }
  }

  if (config.timeoutMs <= 0 || config.timeoutMs > 300000) {
    throw new AIConfigError('AI_CONFIG_INVALID', `AI_REQUEST_TIMEOUT_MS (${config.timeoutMs}ms) harus di antara 1ms dan 300000ms.`);
  }

  if (config.maxRetries < 0 || config.maxRetries > 5) {
    throw new AIConfigError('AI_CONFIG_INVALID', `AI_MAX_RETRIES (${config.maxRetries}) harus di antara 0 dan 5.`);
  }
}
