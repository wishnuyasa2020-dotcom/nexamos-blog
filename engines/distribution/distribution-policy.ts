/**
 * NexaMOS Unified Distribution Policy
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5D specifications.
 * Menegakkan aturan kelayakan distribusi terpadu:
 * STATUS + BLOCKERS + MINIMUM THRESHOLDS
 *
 * Arithmetic averaging dilarang keras menjadi otoritas publikasi.
 */

import type { ReviewStatus } from '../editorial/review/editorial-review.ts';
import type { SEOClassification, SEOValidationResult } from '../seo-validator/seo-validation.ts';
import type { DiscoverClassification, DiscoverValidationResult } from '../discover-validator/discover-validation.ts';
import type { AIVisibilityClassification, AIVisibilityValidationResult } from '../ai-visibility/ai-visibility-validation.ts';
import type { DistributionIssue, UnifiedDistributionStatus } from './distribution-readiness.ts';

export const UNIFIED_DISTRIBUTION_POLICY_VERSION = 'UNIFIED_DISTRIBUTION_POLICY_V1';

export interface MinimumDistributionReadinessPolicy {
  policyVersion: string;
  editorial: {
    acceptedStatuses: ReviewStatus[];
  };
  seo: {
    acceptedClassifications: SEOClassification[];
    revisionClassifications: SEOClassification[];
    blockingClassifications: SEOClassification[];
  };
  discover: {
    acceptedClassifications: DiscoverClassification[];
    revisionClassifications: DiscoverClassification[];
    blockingClassifications: DiscoverClassification[];
  };
  aiVisibility: {
    acceptedClassifications: AIVisibilityClassification[];
    revisionClassifications: AIVisibilityClassification[];
    blockingClassifications: AIVisibilityClassification[];
  };
}

export const CANONICAL_DISTRIBUTION_POLICY: MinimumDistributionReadinessPolicy = {
  policyVersion: UNIFIED_DISTRIBUTION_POLICY_VERSION,
  editorial: {
    acceptedStatuses: ['PASS']
  },
  seo: {
    acceptedClassifications: ['EXCELLENT', 'READY', 'READY_WITH_WARNINGS'],
    revisionClassifications: ['REVISION_REQUIRED'],
    blockingClassifications: ['BLOCKED']
  },
  discover: {
    acceptedClassifications: ['STRONG', 'READY', 'READY_WITH_WARNINGS'],
    revisionClassifications: ['REVISION_REQUIRED'],
    blockingClassifications: ['INELIGIBLE']
  },
  aiVisibility: {
    acceptedClassifications: ['STRONG', 'READY', 'READY_WITH_WARNINGS'],
    revisionClassifications: ['REVISION_REQUIRED'],
    blockingClassifications: ['BLOCKED']
  }
};

/**
 * Mengevaluasi status kelayakan terpadu (Overall Status) berdasarkan doktrin:
 * STATUS + BLOCKERS + MINIMUM THRESHOLDS
 */
export function determineOverallDistributionStatus(params: {
  editorialStatus: ReviewStatus;
  seoClassification: SEOClassification;
  discoverClassification: DiscoverClassification;
  aiClassification: AIVisibilityClassification;
  blockers: DistributionIssue[];
  warnings: DistributionIssue[];
}): UnifiedDistributionStatus {
  const {
    editorialStatus,
    seoClassification,
    discoverClassification,
    aiClassification,
    blockers,
    warnings
  } = params;

  // 1. HARD BLOCKER CHECK:
  // Editorial bukan PASS, salah satu validator blocking, atau terdapat blocker aktif
  const isEditorialBlocked = !CANONICAL_DISTRIBUTION_POLICY.editorial.acceptedStatuses.includes(editorialStatus);
  const isSEOBlocked = CANONICAL_DISTRIBUTION_POLICY.seo.blockingClassifications.includes(seoClassification);
  const isDiscoverBlocked = CANONICAL_DISTRIBUTION_POLICY.discover.blockingClassifications.includes(discoverClassification);
  const isAIBlocked = CANONICAL_DISTRIBUTION_POLICY.aiVisibility.blockingClassifications.includes(aiClassification);
  const hasActiveBlockers = blockers.length > 0;

  if (isEditorialBlocked || isSEOBlocked || isDiscoverBlocked || isAIBlocked || hasActiveBlockers) {
    return 'BLOCKED';
  }

  // 2. REVISION CHECK:
  // Tidak ada blocker, namun salah satu validator menuntut revisi substantif
  const isSEORevision = CANONICAL_DISTRIBUTION_POLICY.seo.revisionClassifications.includes(seoClassification);
  const isDiscoverRevision = CANONICAL_DISTRIBUTION_POLICY.discover.revisionClassifications.includes(discoverClassification);
  const isAIRevision = CANONICAL_DISTRIBUTION_POLICY.aiVisibility.revisionClassifications.includes(aiClassification);
  const hasRevisionIssues = blockers.some((b) => b.severity === 'REVISION');

  if (isSEORevision || isDiscoverRevision || isAIRevision || hasRevisionIssues) {
    return 'RETURN_FOR_REVISION';
  }

  // 3. WARNING CHECK:
  // Validator berstatus READY_WITH_WARNINGS atau terdapat warning terpadu
  const isSEOWarning = seoClassification === 'READY_WITH_WARNINGS';
  const isDiscoverWarning = discoverClassification === 'READY_WITH_WARNINGS';
  const isAIWarning = aiClassification === 'READY_WITH_WARNINGS';
  const hasWarnings = warnings.length > 0;

  if (isSEOWarning || isDiscoverWarning || isAIWarning || hasWarnings) {
    return 'READY_WITH_WARNINGS';
  }

  // 4. FULL READINESS:
  // Lolos semua kriteria minimum tanpa blocker ataupun warning
  return 'READY_TO_PUBLISH';
}

/**
 * Menghitung skor diagnostik agregat untuk observabilitas sistem.
 * DILARANG KERAS digunakan sebagai otoritas penerbitan!
 */
export function calculateAggregateDiagnosticScore(
  seoResult: SEOValidationResult,
  discoverResult: DiscoverValidationResult,
  aiResult: AIVisibilityValidationResult
): number {
  const seoScore = Number.isFinite(seoResult.score) ? seoResult.score : 0;
  const discoverScore = Number.isFinite(discoverResult.score) ? discoverResult.score : 0;
  const aiScore = Number.isFinite(aiResult.score) ? aiResult.score : 0;

  // Bobot berimbang 35% SEO, 35% Discover, 30% AI Visibility untuk metrik diagnostik
  const rawAggregate = seoScore * 0.35 + discoverScore * 0.35 + aiScore * 0.3;
  return Math.round(rawAggregate * 10) / 10;
}
