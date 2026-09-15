/**
 * NexaMOS Mock AI Discover Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Mock deterministik untuk pengujian unit dan CI tanpa ketergantungan API eksternal.
 */

import type {
  AIDiscoverProvider,
  AIDiscoverReviewRequest,
  AIDiscoverReviewResponse
} from '../ai-discover-provider.ts';

export class MockAIDiscoverProvider implements AIDiscoverProvider {
  public async reviewDiscoverReadiness(
    request: AIDiscoverReviewRequest
  ): Promise<AIDiscoverReviewResponse> {
    const isClickbait = /bikin syok|rahasia gila|kamu tidak akan percaya/i.test(request.title);

    return {
      isClickbait,
      clickbaitExplanation: isClickbait
        ? 'Judul menggunakan formula sensasionalisme emosional yang dilarang pada Google Discover.'
        : undefined,
      suggestedTitleImprovements: isClickbait
        ? ['Gunakan judul deskriptif yang berfokus pada analisis arsitektur atau framework solusi.']
        : [],
      perceivedInterestAppeal: request.editorialAngle ? 'HIGH' : 'MEDIUM',
      audienceResonanceNotes: 'Konten memiliki argumen struktural yang jelas untuk pembaca teknis/manajemen.'
    };
  }
}
