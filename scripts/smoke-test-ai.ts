/**
 * NexaMOS AI Live Smoke Test Script
 *
 * Sourced from NexaMOS Blog Production Pilot 01 Qwen Provider Activation specifications.
 * Menguji konektivitas nyata dan respon JSON terstruktur ke provider LLM (Qwen / OpenAI / Gemini).
 *
 * Aturan:
 * 1. Jika AI_PROVIDER_API_KEY belum dikonfigurasi: cetak WAITING_FOR_LOCAL_CREDENTIAL tanpa error.
 * 2. DILARANG KERAS mencetak API key atau Authorization header.
 * 3. Memverifikasi:
 *    - Provider = Qwen
 *    - Model = qwen3.8-flash
 *    - Region = Singapore
 *    - Authentication: configured
 *    - Endpoint: reachable
 *    - Chat Completions: PASS
 *    - JSON response: PASS
 *    - Local schema validation: PASS
 * 4. Jika gagal: laporkan HTTP Status, Canonical Error Code, Provider Error Category, Retry Count.
 */

import {
  loadAIProviderConfig,
  validateAIProviderConfig,
  isAIConfigured,
  AIConfigError
} from '../infrastructure/ai/ai-provider-config.ts';
import { AIHttpClient, AIClientError } from '../infrastructure/ai/ai-http-client.ts';
import { StructuredOutputValidator } from '../infrastructure/ai/structured-output-validator.ts';

async function runSmokeTest(): Promise<void> {
  const config = loadAIProviderConfig();

  console.log('====================================================');
  console.log('NexaMOS AI Provider Smoke Test');
  console.log('====================================================');

  const displayProvider = config.provider.toLowerCase() === 'qwen'
    ? 'Qwen'
    : config.provider.toLowerCase() === 'gemini'
      ? 'Gemini'
      : config.provider;

  const displayRegion = config.baseUrl.includes('.ap-southeast-1.maas.aliyuncs.com')
    ? 'Singapore'
    : 'Custom / Other';

  if (!isAIConfigured(config)) {
    console.log(`Provider:       ${displayProvider}`);
    console.log(`Model:          ${config.model}`);
    console.log(`Region:         ${displayRegion}`);
    console.log('Authentication: not configured (API key missing or placeholder)');
    console.log('\nStatus:         SMOKE TEST: WAITING_FOR_LOCAL_CREDENTIAL');
    console.log('Catatan:        AI_PROVIDER_API_KEY belum disetel di .env atau .env.local.');
    console.log('====================================================\n');
    process.exit(0);
  }

  // Lakukan validasi konfigurasi lokal terlebih dahulu (termasuk Region Safety)
  try {
    validateAIProviderConfig(config);
  } catch (err: any) {
    console.log(`Provider:       ${displayProvider}`);
    console.log(`Model:          ${config.model}`);
    console.log(`Region:         ${displayRegion}`);
    console.log('Authentication: configured');
    console.log('Endpoint:       FAILED (Configuration / Region Check)');
    console.log(`CANONICAL ERROR CODE:    ${err.code || 'AI_CONFIG_INVALID'}`);
    console.log(`PROVIDER ERROR CATEGORY: ${err.name || 'AIConfigError'}`);
    console.log(`ERROR DETAILS:           ${err.message}`);
    console.log('====================================================');
    console.log('Status:         FAIL');
    console.log('====================================================\n');
    process.exit(1);
  }

  console.log(`Provider:       ${displayProvider}`);
  console.log(`Model:          ${config.model}`);
  console.log(`Region:         ${displayRegion}`);
  console.log('Authentication: configured');

  const client = new AIHttpClient(config);

  const testPayload = {
    messages: [
      {
        role: 'system' as const,
        content: 'Anda adalah sistem verifikasi konektivitas NexaMOS. Respon HANYA dalam format JSON valid dengan kunci "status" bernilai "ok" dan "message" bernilai "pong". Dilarang menyertakan teks lain di luar JSON.'
      },
      {
        role: 'user' as const,
        content: '{"ping": true}'
      }
    ],
    responseFormat: 'json_object' as const,
    temperature: 0.1
  };

  try {
    const startTime = Date.now();
    const result = await client.complete(testPayload);
    const elapsed = Date.now() - startTime;

    console.log(`Endpoint:       reachable (${elapsed}ms)`);
    console.log('Chat Completions: PASS');

    const parsed = StructuredOutputValidator.parseJson(result.content);

    if (!parsed || typeof parsed !== 'object' || parsed.status !== 'ok') {
      throw new AIClientError(
        'AI_OUTPUT_INVALID',
        `Respon terstruktur tidak sesuai schema yang diharapkan: ${result.content}`
      );
    }

    console.log('JSON response:  PASS');
    console.log('Local schema validation: PASS');

    if (result.usage) {
      console.log(`Token usage:    prompt=${result.usage.inputTokens || 0}, completion=${result.usage.outputTokens || 0}, total=${result.usage.totalTokens || 0}`);
    }

    console.log('====================================================');
    console.log('Status:         PASS');
    console.log('====================================================\n');
  } catch (error: any) {
    const httpStatus = error.statusCode || (error.message?.match(/HTTP (\d{3})/)?.[1]) || 'N/A';
    const canonicalCode = error.code || 'AI_REQUEST_FAILED';
    const errorCategory = error.name || 'AIClientError';
    const retryCount = error.attempt ?? config.maxRetries;

    console.log('Endpoint:       FAILED');
    console.log(`HTTP STATUS:             ${httpStatus}`);
    console.log(`CANONICAL ERROR CODE:    ${canonicalCode}`);
    console.log(`PROVIDER ERROR CATEGORY: ${errorCategory}`);
    console.log(`RETRY COUNT:             ${retryCount}`);
    console.log(`ERROR DETAILS:           ${error.message || String(error)}`);
    console.log('====================================================');
    console.log('Status:         FAIL');
    console.log('====================================================\n');
    process.exit(1);
  }
}

runSmokeTest();
