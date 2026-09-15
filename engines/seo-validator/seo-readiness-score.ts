/**
 * NexaMOS SEO Readiness Score Engine
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Mengimplementasikan SEO_VALIDATION_POLICY_V1 dengan pembobotan 10 dimensi:
 * - Intent Alignment: 15
 * - Topic Clarity: 15
 * - Title Quality: 10
 * - Metadata Quality: 10
 * - Heading Structure: 10
 * - Internal Linking: 10
 * - Indexability: 10
 * - Canonical Integrity: 5
 * - Structured Data: 5
 * - Content Differentiation: 10
 * Total = 100
 *
 * Klasifikasi:
 * 90–100: EXCELLENT
 * 80–89:  READY
 * 70–79:  READY_WITH_WARNINGS
 * < 70:   REVISION_REQUIRED
 * Critical Errors (NOINDEX_ON_PUBLISHED_ARTICLE, INVALID_CANONICAL, CANONICAL_LOOP,
 * STRUCTURED_DATA_FABRICATION, MISSING_PRIMARY_ARTICLE_CONTENT) menghasilkan: BLOCKED.
 */

import type {
  SEODimension,
  SEOCheckResult,
  SEOIssue,
  SEOClassification
} from './seo-validation.ts';

export const SEO_VALIDATION_POLICY_VERSION = 'SEO_VALIDATION_POLICY_V1';

export const SEO_DIMENSION_MAX_SCORES: Record<SEODimension, number> = {
  INTENT_ALIGNMENT: 15,
  TOPIC_CLARITY: 15,
  TITLE_QUALITY: 10,
  METADATA_QUALITY: 10,
  HEADING_STRUCTURE: 10,
  INTERNAL_LINKING: 10,
  INDEXABILITY: 10,
  CANONICAL_INTEGRITY: 5,
  STRUCTURED_DATA: 5,
  CONTENT_DIFFERENTIATION: 10
};

export const CRITICAL_BLOCKING_ERROR_CODES = new Set([
  'NOINDEX_ON_PUBLISHED_ARTICLE',
  'INVALID_CANONICAL',
  'CANONICAL_LOOP',
  'STRUCTURED_DATA_FABRICATION',
  'MISSING_PRIMARY_ARTICLE_CONTENT'
]);

export interface ComputedSEOScore {
  score: number; // 0 - 100
  dimensionScores: Record<SEODimension, number>;
  classification: SEOClassification;
  criticalErrors: string[];
}

export class SEOReadinessScorer {
  public compute(checks: SEOCheckResult[], issues: SEOIssue[]): ComputedSEOScore {
    const dimensionScores: Record<SEODimension, number> = {
      INTENT_ALIGNMENT: 0,
      TOPIC_CLARITY: 0,
      TITLE_QUALITY: 0,
      METADATA_QUALITY: 0,
      HEADING_STRUCTURE: 0,
      INTERNAL_LINKING: 0,
      INDEXABILITY: 0,
      CANONICAL_INTEGRITY: 0,
      STRUCTURED_DATA: 0,
      CONTENT_DIFFERENTIATION: 0
    };

    // Agregasi kontribusi skor per dimensi
    for (const check of checks) {
      dimensionScores[check.dimension] = Math.min(
        SEO_DIMENSION_MAX_SCORES[check.dimension],
        (dimensionScores[check.dimension] || 0) + check.scoreContribution
      );
    }

    // Hitung total skor (0 - 100)
    let totalScore = 0;
    for (const dim of Object.keys(dimensionScores) as SEODimension[]) {
      totalScore += dimensionScores[dim];
    }
    totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    // Deteksi Critical Blocking Errors
    const criticalErrors: string[] = [];
    for (const issue of issues) {
      if (CRITICAL_BLOCKING_ERROR_CODES.has(issue.code) || (issue.severity === 'CRITICAL' && CRITICAL_BLOCKING_ERROR_CODES.has(issue.code))) {
        criticalErrors.push(`${issue.code}: ${issue.message}`);
      }
    }

    // Tentukan Klasifikasi
    let classification: SEOClassification;
    if (criticalErrors.length > 0) {
      classification = 'BLOCKED';
    } else if (totalScore >= 90) {
      classification = 'EXCELLENT';
    } else if (totalScore >= 80) {
      classification = 'READY';
    } else if (totalScore >= 70) {
      classification = 'READY_WITH_WARNINGS';
    } else {
      classification = 'REVISION_REQUIRED';
    }

    return {
      score: totalScore,
      dimensionScores,
      classification,
      criticalErrors
    };
  }
}
