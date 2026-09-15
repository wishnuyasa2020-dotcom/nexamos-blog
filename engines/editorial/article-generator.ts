/**
 * NexaMOS Grounded Article Generator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3A specifications
 * Facade publik untuk memproses generasi draf artikel ter-grounding.
 */

import { EditorialGenerationService } from './editorial-generation-service.ts';
import type { EditorialGenerationRequest } from './editorial-generation-request.ts';
import type { EditorialGenerationResult } from './editorial-generation-result.ts';
import type { AIEditorialProvider } from './ai-editorial-provider.ts';
import { GroundingGuard } from './grounding-guard.ts';

export class ArticleGenerator {
  private readonly service: EditorialGenerationService;

  constructor(aiProvider: AIEditorialProvider, groundingGuard?: GroundingGuard) {
    this.service = new EditorialGenerationService({
      aiProvider,
      groundingGuard
    });
  }

  public async generate(request: EditorialGenerationRequest): Promise<EditorialGenerationResult> {
    return this.service.generateDraft(request);
  }
}
