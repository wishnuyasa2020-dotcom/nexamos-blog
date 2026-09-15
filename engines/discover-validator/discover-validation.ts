/**
 * NexaMOS Google Discover Readiness Validation - Domain Models & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Hard Doctrine:
 * DISCOVER READINESS ≠ DISCOVER RANK PREDICTION
 * DISCOVER ELIGIBILITY ≠ GUARANTEE OF APPEARANCE
 */

export type DiscoverDimension =
  | 'ORIGINALITY'
  | 'DEPTH'
  | 'TIMELINESS'
  | 'TOPICAL_EXPERTISE'
  | 'INTEREST_FIT'
  | 'TITLE_INTEGRITY'
  | 'VISUAL_READINESS'
  | 'PAGE_EXPERIENCE'
  | 'LOCAL_RELEVANCE'
  | 'POLICY_SAFETY';

export const DISCOVER_DIMENSIONS: readonly DiscoverDimension[] = [
  'ORIGINALITY',
  'DEPTH',
  'TIMELINESS',
  'TOPICAL_EXPERTISE',
  'INTEREST_FIT',
  'TITLE_INTEGRITY',
  'VISUAL_READINESS',
  'PAGE_EXPERIENCE',
  'LOCAL_RELEVANCE',
  'POLICY_SAFETY'
] as const;

export type DiscoverEligibilityStatus =
  | 'ELIGIBLE'
  | 'ELIGIBILITY_WARNING'
  | 'INELIGIBLE';

export type DiscoverClassification =
  | 'STRONG'               // 90 - 100
  | 'READY'                // 80 - 89
  | 'READY_WITH_WARNINGS'  // 70 - 79
  | 'REVISION_REQUIRED'    // < 70
  | 'INELIGIBLE';          // Mengandung hard fail / blocking issues

export type DiscoverCheckStatus = 'PASS' | 'WARNING' | 'FAIL';

export type DiscoverSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type DiscoverCheckId =
  | 'DISCOVER_ELIGIBILITY'
  | 'DISCOVER_ORIGINALITY'
  | 'DISCOVER_DEPTH'
  | 'DISCOVER_TIMELINESS'
  | 'DISCOVER_TOPICAL_EXPERTISE'
  | 'DISCOVER_INTEREST_FIT'
  | 'DISCOVER_TITLE_INTEGRITY'
  | 'DISCOVER_VISUAL_READINESS'
  | 'DISCOVER_PAGE_EXPERIENCE'
  | 'DISCOVER_LOCAL_RELEVANCE'
  | 'DISCOVER_POLICY_SAFETY';

export type DiscoverIssueCode =
  | 'CONTENT_NOT_INDEXABLE'
  | 'DISCOVER_POLICY_INELIGIBLE'
  | 'MISSING_PRIMARY_CONTENT'
  | 'CRITICAL_TITLE_DECEPTION'
  | 'LOW_DISCOVER_ORIGINALITY'
  | 'INSUFFICIENT_TOPIC_DEPTH'
  | 'STALE_TIME_SENSITIVE_CONTENT'
  | 'ISOLATED_TOPIC_RISK'
  | 'WEAK_INTEREST_ALIGNMENT'
  | 'DISCOVER_CLICKBAIT_RISK'
  | 'SENSATIONAL_TITLE'
  | 'TITLE_CONTENT_MISMATCH'
  | 'VISUAL_ASSET_MISSING'
  | 'VISUAL_LOW_RESOLUTION'
  | 'VISUAL_NON_LANDSCAPE'
  | 'VISUAL_GENERIC_LOGO'
  | 'VISUAL_TEXT_HEAVY'
  | 'LARGE_IMAGE_PREVIEW_RESTRICTED'
  | 'PAGE_EXPERIENCE_POOR'
  | 'UNVERIFIED_PAGE_EXPERIENCE'
  | 'CONTENT_POLICY_RISK';

export interface DiscoverIssue {
  code: DiscoverIssueCode;
  checkId: DiscoverCheckId;
  dimension: DiscoverDimension;
  severity: DiscoverSeverity;
  message: string;
  location?: string;
  recommendation?: string;
}

export interface DiscoverCheckResult {
  checkId: DiscoverCheckId;
  dimension: DiscoverDimension;
  status: DiscoverCheckStatus;
  scoreContribution: number;
  summary: string;
  details?: Record<string, any>;
}

export type DiscoverRecommendationType =
  | 'EDITORIAL_IMPROVEMENT'
  | 'TITLE_IMPROVEMENT'
  | 'VISUAL_IMPROVEMENT'
  | 'TOPICAL_CLUSTER_IMPROVEMENT'
  | 'TECHNICAL_FIX'
  | 'FRESHNESS_REVIEW'
  | 'PAGE_EXPERIENCE_REVIEW';

export interface DiscoverRecommendation {
  type: DiscoverRecommendationType;
  title: string;
  description: string;
  suggestedAction: string;
  crossEngineDestination?: 'EDITORIAL' | 'SEO_TECHNICAL' | 'CONTENT_STRATEGY' | 'VISUAL_DESIGN';
}

export interface DiscoverVisualAsset {
  url: string;
  width?: number;
  height?: number;
  totalPixels?: number;
  aspectRatio?: string; // '16:9', '4:3', '1:1', 'custom'
  alt?: string | null;
  caption?: string | null;
  isGeneric?: boolean;
  isLogo?: boolean;
  textDensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  ogImage?: boolean;
  schemaImage?: boolean;
}

export interface DiscoverValidationResult {
  articleId: string;
  checks: DiscoverCheckResult[];
  issues: DiscoverIssue[];
  recommendations: DiscoverRecommendation[];
  dimensions: Record<DiscoverDimension, number>;
  score: number; // 0 - 100
  classification: DiscoverClassification;
  eligibility: DiscoverEligibilityStatus;
  criticalIneligibilityReasons: string[];
  validatedAt: string; // ISO 8601
  policyVersion: string; // 'DISCOVER_READINESS_POLICY_V1'
}

/**
 * Kontrak Antarmuka Masa Depan untuk Integrasi Google Search Console Discover Performance Report.
 * HANYA KONTRAK DATA - Tidak dihubungkan ke live API pada fase ini.
 */
export interface DiscoverPerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  page: string;
  country: string;
  date: string;
  appearanceType?: 'STANDARD' | 'CHROME_NEW_TAB' | 'GOOGLE_APP' | 'SEARCH_GEN_AI';
}
