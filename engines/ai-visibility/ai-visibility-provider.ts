/**
 * NexaMOS AI Visibility Review Provider Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Kontrak reviewer AI opsional untuk meninjau kecukupan jawaban dan kejelasan entitas.
 *
 * DOKTRIN KERAS:
 * AI reviewer dilarang memprediksi sitasi, memprediksi trafik AI, mengklaim LLM tertentu pasti mengutip,
 * atau mengarang faktor peringkat yang tidak berdasar.
 */

export interface AIVisibilityReviewRequest {
  title: string;
  thesis?: string;
  problem?: string;
  sections?: Array<{ heading: string; content: string }>;
  entities?: string[];
  claims?: string[];
}

export interface AIVisibilityReviewResponse {
  answerabilityAssessment: 'STRONG' | 'ADEQUATE' | 'WEAK';
  answerabilityNotes?: string;
  unclearEntities?: string[];
  overclaimedStatements?: string[];
  suggestedClarifications?: string[];
}

export interface AIVisibilityReviewProvider {
  reviewVisibilityReadiness(request: AIVisibilityReviewRequest): Promise<AIVisibilityReviewResponse>;
}
