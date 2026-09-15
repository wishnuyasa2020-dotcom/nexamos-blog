/**
 * NexaMOS Topic Classifier Contract
 *
 * Mengklasifikasikan kandidat ide/topik ke dalam salah satu Knowledge Territory:
 * - INTELLIGENCE: "Apa yang sebenarnya sedang terjadi di pasar?"
 * - STRATEGY: "Pilihan apa yang harus dibuat untuk menang?"
 * - TACTICAL: "Bagaimana pilihan strategi dieksekusi dan diukur?"
 */

import { Territory } from './domain/territory';

export interface TopicClassificationInput {
  title: string;
  problem: string;
  intent: {
    primary: string;
    secondary?: string[];
  };
  contextSummary?: string;
  suggestedTerritory?: Territory;
}

export type TopicClassificationStatus = 'SUCCESS' | 'NOT_IMPLEMENTED' | 'FAILED';

export interface TopicClassificationResult {
  status: TopicClassificationStatus;
  territory?: Territory;
  confidence?: number; // 0.0 - 1.0
  reasoningSummary: string;
  secondaryTerritory?: Territory;
  error?: string;
}

export interface ITopicClassifier {
  classify(input: TopicClassificationInput): Promise<TopicClassificationResult>;
}

/**
 * Pure contract function for topic classification.
 *
 * NOTE: Phase 1A provides the type-safe contract stub.
 * Actual automated rule-based or AI classification will be implemented in subsequent phases.
 */
export async function classifyTopic(
  input: TopicClassificationInput
): Promise<TopicClassificationResult> {
  if (!input.title || !input.problem) {
    return {
      status: 'FAILED',
      reasoningSummary: 'Input must provide at least title and problem definition.',
      error: 'INVALID_INPUT'
    };
  }

  return {
    status: 'NOT_IMPLEMENTED',
    reasoningSummary:
      'Topic classifier execution is not implemented in Phase 1A. Domain contract is established.'
  };
}
