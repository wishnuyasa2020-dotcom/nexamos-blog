/**
 * NexaMOS Google Discover Readiness Score Calculator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Bobot Skor Dimensi (Total 100):
 * - ORIGINALITY: 15
 * - DEPTH: 15
 * - TIMELINESS: 10
 * - TOPICAL_EXPERTISE: 15
 * - INTEREST_FIT: 10
 * - TITLE_INTEGRITY: 10
 * - VISUAL_READINESS: 15
 * - PAGE_EXPERIENCE: 5
 * - LOCAL_RELEVANCE: 2
 * - POLICY_SAFETY: 3
 *
 * Klasifikasi:
 * - 90 - 100: STRONG
 * - 80 - 89: READY
 * - 70 - 79: READY_WITH_WARNINGS
 * - < 70: REVISION_REQUIRED
 * - Hard Fail / Critical Block: INELIGIBLE
 */

import type {
  DiscoverDimension,
  DiscoverClassification,
  DiscoverEligibilityStatus,
  DiscoverIssue
} from './discover-validation.ts';

export const DISCOVER_DIMENSION_WEIGHTS: Record<DiscoverDimension, number> = {
  ORIGINALITY: 15,
  DEPTH: 15,
  TIMELINESS: 10,
  TOPICAL_EXPERTISE: 15,
  INTEREST_FIT: 10,
  TITLE_INTEGRITY: 10,
  VISUAL_READINESS: 15,
  PAGE_EXPERIENCE: 5,
  LOCAL_RELEVANCE: 2,
  POLICY_SAFETY: 3
} as const;

export class DiscoverReadinessScoreCalculator {
  public calculateTotalScore(dimensions: Record<DiscoverDimension, number>): number {
    let total = 0;
    for (const [dim, weight] of Object.entries(DISCOVER_DIMENSION_WEIGHTS)) {
      const score = dimensions[dim as DiscoverDimension] ?? 0;
      // Clamp between 0 and max weight
      const clamped = Math.max(0, Math.min(weight, score));
      total += clamped;
    }
    return Math.round(total * 10) / 10;
  }

  public determineClassification(
    score: number,
    eligibility: DiscoverEligibilityStatus,
    issues: DiscoverIssue[]
  ): DiscoverClassification {
    const hasCriticalFail =
      eligibility === 'INELIGIBLE' ||
      issues.some((issue) => issue.severity === 'CRITICAL');

    if (hasCriticalFail) {
      return 'INELIGIBLE';
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
