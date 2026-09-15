/**
 * NexaMOS AI Discover Provider Interface & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Opsional: Menyediakan kapabilitas AI untuk meninjau integritas headline dan daya tarik minat audiens.
 */

export interface AIDiscoverReviewRequest {
  title: string;
  thesis?: string;
  editorialAngle?: string;
  summary?: string;
  sections?: Array<{ heading: string; content: string }>;
  visualAssetAlt?: string | null;
}

export interface AIDiscoverReviewResponse {
  isClickbait: boolean;
  clickbaitExplanation?: string;
  suggestedTitleImprovements?: string[];
  perceivedInterestAppeal?: 'HIGH' | 'MEDIUM' | 'LOW';
  audienceResonanceNotes?: string;
}

export interface AIDiscoverProvider {
  reviewDiscoverReadiness(request: AIDiscoverReviewRequest): Promise<AIDiscoverReviewResponse>;
}
