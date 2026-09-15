/**
 * NexaMOS AI Visibility Readiness Score Calculator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Bobot Skor Dimensi (Total 100):
 * - GOOGLE_AI_ELIGIBILITY: 10
 * - RETRIEVAL_READINESS: 12
 * - ANSWERABILITY: 12
 * - ENTITY_CLARITY: 10
 * - CLAIM_CLARITY: 10
 * - CITATION_READINESS: 12
 * - SOURCE_TRANSPARENCY: 8
 * - INFORMATION_GAIN: 16
 * - CONTENT_ACCESSIBILITY: 7
 * - MULTIMODAL_READINESS: 3
 *
 * Klasifikasi Kesiapan:
 * - 90 - 100: STRONG
 * - 80 - 89: READY
 * - 70 - 79: READY_WITH_WARNINGS
 * - < 70: REVISION_REQUIRED
 * - Critical Block: BLOCKED
 *
 * DOKTRIN DOKUMENTASI:
 * THIS SCORE IS NOT AN AI RANKING OR CITATION PROBABILITY MODEL
 */

import type {
  AIVisibilityDimension,
  AIVisibilityClassification,
  GoogleAIEligibilityStatus,
  AIVisibilityIssue
} from './ai-visibility-validation.ts';

export const AI_VISIBILITY_DIMENSION_WEIGHTS: Record<AIVisibilityDimension, number> = {
  GOOGLE_AI_ELIGIBILITY: 10,
  RETRIEVAL_READINESS: 12,
  ANSWERABILITY: 12,
  ENTITY_CLARITY: 10,
  CLAIM_CLARITY: 10,
  CITATION_READINESS: 12,
  SOURCE_TRANSPARENCY: 8,
  INFORMATION_GAIN: 16,
  CONTENT_ACCESSIBILITY: 7,
  MULTIMODAL_READINESS: 3
} as const;

export class AIVisibilityScoreCalculator {
  public calculateTotalScore(dimensions: Record<AIVisibilityDimension, number>): number {
    let total = 0;
    for (const [dim, maxWeight] of Object.entries(AI_VISIBILITY_DIMENSION_WEIGHTS)) {
      const score = dimensions[dim as AIVisibilityDimension] ?? 0;
      const clamped = Math.max(0, Math.min(maxWeight, score));
      total += clamped;
    }
    return Math.round(total * 10) / 10;
  }

  public determineClassification(
    score: number,
    googleEligibility: GoogleAIEligibilityStatus,
    issues: AIVisibilityIssue[]
  ): AIVisibilityClassification {
    const hasCriticalBlock =
      googleEligibility === 'BLOCKED_BY_SITE_CONTROL' ||
      googleEligibility === 'INELIGIBLE' ||
      issues.some((issue) => issue.severity === 'CRITICAL');

    if (hasCriticalBlock) {
      return 'BLOCKED';
    }

    if (score >= 90) {
      return 'STRONG';
    } else if (score >= 80) {
      return 'READY';
    } else if (score >= 70) {
      return 'READY_WITH_WARNINGS';
    } else {
      return 'REVISION_REQUIRED';
    }
  }
}
