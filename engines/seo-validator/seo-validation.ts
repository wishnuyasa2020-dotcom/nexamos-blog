/**
 * NexaMOS SEO Validation Types and Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Menegakkan doktrin: EDITORIAL QUALITY > SEO MECHANICS
 * SEO adalah distribution validation layer, bukan authority editorial.
 */

export type SEODimension =
  | 'INTENT_ALIGNMENT'
  | 'TOPIC_CLARITY'
  | 'TITLE_QUALITY'
  | 'METADATA_QUALITY'
  | 'HEADING_STRUCTURE'
  | 'INTERNAL_LINKING'
  | 'INDEXABILITY'
  | 'CANONICAL_INTEGRITY'
  | 'STRUCTURED_DATA'
  | 'CONTENT_DIFFERENTIATION';

export const SEO_DIMENSIONS: readonly SEODimension[] = [
  'INTENT_ALIGNMENT',
  'TOPIC_CLARITY',
  'TITLE_QUALITY',
  'METADATA_QUALITY',
  'HEADING_STRUCTURE',
  'INTERNAL_LINKING',
  'INDEXABILITY',
  'CANONICAL_INTEGRITY',
  'STRUCTURED_DATA',
  'CONTENT_DIFFERENTIATION'
] as const;

export type SEOCheckStatus = 'PASS' | 'WARNING' | 'FAIL';

export type SEOSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type SEOClassification =
  | 'EXCELLENT'          // 90 - 100
  | 'READY'              // 80 - 89
  | 'READY_WITH_WARNINGS'// 70 - 79
  | 'REVISION_REQUIRED'  // < 70
  | 'BLOCKED';           // Mengandung critical technical errors apapun nilai skornya

export type SEOCheckId =
  | 'SEARCH_INTENT_ALIGNMENT'
  | 'TOPIC_FOCUS_AND_CLARITY'
  | 'TITLE_QUALITY'
  | 'META_DESCRIPTION_QUALITY'
  | 'HEADING_STRUCTURE'
  | 'INTERNAL_LINK_OPPORTUNITY'
  | 'INDEXABILITY'
  | 'CANONICAL_INTEGRITY'
  | 'STRUCTURED_DATA_VALIDITY'
  | 'CONTENT_DIFFERENTIATION'
  | 'IMAGE_SEO_QUALITY';

export type SEOIssueCode =
  | 'SEARCH_INTENT_MISMATCH'
  | 'TOPIC_FOCUS_WEAK'
  | 'TOPIC_DRIFT'
  | 'TITLE_MISLEADING'
  | 'TITLE_LENGTH_RISK'
  | 'TITLE_CLICKBAIT_RISK'
  | 'TITLE_DUPLICATION_RISK'
  | 'META_DESCRIPTION_MISLEADING'
  | 'META_DESCRIPTION_KEYWORD_STUFFING'
  | 'META_DESCRIPTION_DUPLICATE_TITLE'
  | 'META_DESCRIPTION_LENGTH_RISK'
  | 'HEADING_STRUCTURE_INVALID'
  | 'GENERIC_HEADING_EXCESS'
  | 'ORPHAN_ARTICLE_RISK'
  | 'DUPLICATE_ANCHOR_ISSUE'
  | 'INVALID_URL_SLUG'
  | 'INVALID_CANONICAL'
  | 'CANONICAL_LOOP'
  | 'INDEXABILITY_CONFLICT'
  | 'NOINDEX_ON_PUBLISHED_ARTICLE'
  | 'STRUCTURED_DATA_FABRICATION'
  | 'STRUCTURED_DATA_SCHEMA_MISMATCH'
  | 'MISSING_PRIMARY_ARTICLE_CONTENT'
  | 'LOW_SEARCH_DIFFERENTIATION'
  | 'IMAGE_ALT_TEXT_MISSING'
  | 'IMAGE_KEYWORD_STUFFING';

export interface SEOIssue {
  code: SEOIssueCode;
  checkId: SEOCheckId;
  dimension: SEODimension;
  severity: SEOSeverity;
  message: string;
  location?: string;
  recommendation?: string;
}

export type SafeSEORecommendationType =
  | 'TECHNICAL_FIX'
  | 'CONTENT_CLARIFICATION'
  | 'METADATA_IMPROVEMENT'
  | 'INTERNAL_LINK_OPPORTUNITY'
  | 'STRUCTURED_DATA_FIX';

export interface SafeSEORecommendation {
  type: SafeSEORecommendationType;
  title: string;
  description: string;
  suggestedAction: string;
  requiresEditorialReturn: boolean; // Jika memerlukan penulisan ulang substantif makna faktual
}

export interface SEOCheckResult {
  checkId: SEOCheckId;
  dimension: SEODimension;
  status: SEOCheckStatus;
  scoreContribution: number;
  summary: string;
  details?: Record<string, any>;
}

export interface SEOValidationResult {
  articleId: string;
  checks: SEOCheckResult[];
  issues: SEOIssue[];
  recommendations: SafeSEORecommendation[];
  score: number; // 0 - 100
  dimensionScores: Record<SEODimension, number>;
  classification: SEOClassification;
  criticalErrors: string[];
  validatedAt: string; // ISO 8601
  policyVersion: string; // 'SEO_VALIDATION_POLICY_V1'
}
