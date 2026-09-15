/**
 * NexaMOS AI Provider Factory
 *
 * Sourced from NexaMOS Blog Production Pilot 01 Step 3 specifications.
 * Titik masuk pembuatan instance provider AI untuk Research Orchestrator dan Editorial Engine.
 *
 * HARD GUARD:
 * Dilarang keras melakukan silent fallback ke Mock Provider pada mode produksi.
 * Jika provider nyata tidak dikonfigurasi, lemparkan error AI_PROVIDER_NOT_CONFIGURED.
 */

import type { AIResearchProvider } from '../../engines/research/orchestrator/ai-research-provider.ts';
import type { AIEditorialProvider } from '../../engines/editorial/ai-editorial-provider.ts';
import { RealAIResearchProvider } from './real-ai-research-provider.ts';
import { RealAIEditorialProvider } from './real-ai-editorial-provider.ts';
import { AIHttpClient } from './ai-http-client.ts';
import {
  loadAIProviderConfig,
  validateAIProviderConfig,
  isAIConfigured,
  type AIProviderConfig
} from './ai-provider-config.ts';

export interface AIProviderPair {
  researchProvider: AIResearchProvider;
  editorialProvider: AIEditorialProvider;
  httpClient: AIHttpClient;
  config: AIProviderConfig;
}

export class AIProviderFactory {
  /**
   * Membuat pasangan Real AI Provider untuk lingkungan produksi
   * Melempar AIConfigError jika environment belum lengkap.
   */
  public static createProductionProviders(overrides: Partial<AIProviderConfig> = {}): AIProviderPair {
    const config = loadAIProviderConfig(overrides);

    // Hard check: validasi kredensial dan konfigurasi
    validateAIProviderConfig(config);

    const httpClient = new AIHttpClient(config);
    const researchProvider = new RealAIResearchProvider(config, httpClient);
    const editorialProvider = new RealAIEditorialProvider(config, httpClient);

    return {
      researchProvider,
      editorialProvider,
      httpClient,
      config
    };
  }

  /**
   * Memeriksa kesiapan provider AI di lingkungan saat ini
   */
  public static checkReadiness(): { ready: boolean; reason?: string } {
    const config = loadAIProviderConfig();
    try {
      validateAIProviderConfig(config);
      return { ready: true };
    } catch (err: any) {
      return { ready: false, reason: err.message || String(err) };
    }
  }
}
