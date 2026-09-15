/**
 * NexaMOS Mock AI Visibility Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Mock deterministik untuk pengujian unit dan lingkungan CI tanpa panggilan API eksternal.
 */

import type {
  AIVisibilityReviewProvider,
  AIVisibilityReviewRequest,
  AIVisibilityReviewResponse
} from '../ai-visibility-provider.ts';

export class MockAIVisibilityProvider implements AIVisibilityReviewProvider {
  public async reviewVisibilityReadiness(
    request: AIVisibilityReviewRequest
  ): Promise<AIVisibilityReviewResponse> {
    const hasVagueAnswer = !request.problem && !request.thesis;
    const overclaimed: string[] = [];

    if (request.claims) {
      for (const claim of request.claims) {
        if (/pasti hancur total|dijamin 100%/i.test(claim)) {
          overclaimed.push(claim);
        }
      }
    }

    return {
      answerabilityAssessment: hasVagueAnswer ? 'WEAK' : 'STRONG',
      answerabilityNotes: hasVagueAnswer
        ? 'Tesis atau masalah pembaca belum didefinisikan dengan tegas.'
        : 'Naskah menyajikan jawaban terstruktur yang mudah dipetakan.',
      unclearEntities: [],
      overclaimedStatements: overclaimed,
      suggestedClarifications: overclaimed.length > 0
        ? ['Perlunak generalisasi absolut dengan batas lingkup empiris.']
        : []
    };
  }
}
