/**
 * NexaMOS AI Visibility Readiness Validation - Domain Models & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Hard Doctrine:
 * AI VISIBILITY READINESS ≠ AI CITATION GUARANTEE
 * AI VISIBILITY VALIDATOR ≠ SEARCH RANKING PREDICTOR
 */

export type AIVisibilityDimension =
  | 'GOOGLE_AI_ELIGIBILITY'
  | 'RETRIEVAL_READINESS'
  | 'ANSWERABILITY'
  | 'ENTITY_CLARITY'
  | 'CLAIM_CLARITY'
  | 'CITATION_READINESS'
  | 'SOURCE_TRANSPARENCY'
  | 'INFORMATION_GAIN'
  | 'CONTENT_ACCESSIBILITY'
  | 'MULTIMODAL_READINESS';

export const AI_VISIBILITY_DIMENSIONS: readonly AIVisibilityDimension[] = [
  'GOOGLE_AI_ELIGIBILITY',
  'RETRIEVAL_READINESS',
  'ANSWERABILITY',
  'ENTITY_CLARITY',
  'CLAIM_CLARITY',
  'CITATION_READINESS',
  'SOURCE_TRANSPARENCY',
  'INFORMATION_GAIN',
  'CONTENT_ACCESSIBILITY',
  'MULTIMODAL_READINESS'
] as const;

/**
 * Search Generative AI Control Contract
 * Merefleksikan pengaturan inklusi Search Console untuk AI Overviews, AI Mode, dan Discover Gen AI.
 */
export type GenerativeAIInclusionStatus = 'INCLUDED' | 'EXCLUDED' | 'UNKNOWN';

export type GoogleAIEligibilityStatus =
  | 'ELIGIBLE'
  | 'ELIGIBILITY_WARNING'
  | 'INELIGIBLE'
  | 'BLOCKED_BY_SITE_CONTROL';

export type AIVisibilityClassification =
  | 'STRONG'               // 90 - 100
  | 'READY'                // 80 - 89
  | 'READY_WITH_WARNINGS'  // 70 - 79
  | 'REVISION_REQUIRED'    // < 70
  | 'BLOCKED';             // Memiliki critical blocking issue

export type AIVisibilityCheckStatus = 'PASS' | 'WARNING' | 'FAIL';

export type AIVisibilitySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AIVisibilityCheckId =
  | 'AI_GOOGLE_ELIGIBILITY'
  | 'AI_RETRIEVAL_READINESS'
  | 'AI_ANSWERABILITY'
  | 'AI_ENTITY_CLARITY'
  | 'AI_CLAIM_CLARITY'
  | 'AI_CITATION_READINESS'
  | 'AI_SOURCE_TRANSPARENCY'
  | 'AI_INFORMATION_GAIN'
  | 'AI_CONTENT_ACCESSIBILITY'
  | 'AI_MULTIMODAL_READINESS';

export type AIVisibilityIssueCode =
  | 'GENERATIVE_AI_SITE_EXCLUDED'
  | 'ARTICLE_NOT_INDEXABLE'
  | 'PRIMARY_CONTENT_UNAVAILABLE'
  | 'CRITICAL_CANONICAL_CONFLICT'
  | 'CRITICAL_GROUNDING_FAILURE'
  | 'SNIPPET_ELIGIBILITY_WARNING'
  | 'RETRIEVAL_COHERENCE_WEAK'
  | 'HEADING_HIERARCHY_AMBIGUOUS'
  | 'VAGUE_ANSWERABILITY'
  | 'MISSING_EXPLICIT_CONCLUSION'
  | 'AMBIGUOUS_ENTITY_NAMING'
  | 'UNDEFINED_ACRONYM'
  | 'OVERCLAIMED_STATEMENT'
  | 'UNBOUNDED_ANALYTICAL_CLAIM'
  | 'UNSUPPORTED_CITATION'
  | 'MISSING_EVIDENCE_LOCATOR'
  | 'OPAQUE_AUTHORSHIP'
  | 'UNSPECIFIED_KNOWLEDGE_SOURCE'
  | 'LOW_INFORMATION_GAIN'
  | 'COMMODITY_CONTENT_RISK'
  | 'CONTENT_INTERACTION_LOCKED'
  | 'JS_RENDERING_REVIEW'
  | 'PAYWALL_ACCESS_RESTRICTION'
  | 'MISSING_EXPLANATORY_VISUAL'
  | 'AI_OPTIMIZATION_ABUSE_RISK';

export interface AIVisibilityIssue {
  code: AIVisibilityIssueCode;
  checkId: AIVisibilityCheckId;
  dimension: AIVisibilityDimension;
  severity: AIVisibilitySeverity;
  message: string;
  location?: string;
  recommendation?: string;
}

export interface AIVisibilityCheckResult {
  checkId: AIVisibilityCheckId;
  dimension: AIVisibilityDimension;
  status: AIVisibilityCheckStatus;
  scoreContribution: number;
  summary: string;
  details?: Record<string, any>;
}

export type AIVisibilityRecommendationType =
  | 'CONTENT_CLARIFICATION'
  | 'ENTITY_CLARIFICATION'
  | 'CLAIM_CLARIFICATION'
  | 'SOURCE_TRANSPARENCY'
  | 'CITATION_IMPROVEMENT'
  | 'INFORMATION_GAIN_IMPROVEMENT'
  | 'ACCESSIBILITY_FIX'
  | 'MULTIMODAL_IMPROVEMENT'
  | 'SEO_TECHNICAL_RETURN'
  | 'EDITORIAL_RETURN'
  | 'RESEARCH_RETURN';

export interface AIVisibilityRecommendation {
  type: AIVisibilityRecommendationType;
  title: string;
  description: string;
  suggestedAction: string;
  crossEngineDestination?: 'RESEARCH' | 'EDITORIAL' | 'SEO_TECHNICAL' | 'VISUAL_DESIGN' | 'CONTENT_STRATEGY';
  isAbuseRiskWarning?: boolean;
}

/**
 * Provider-Neutral AI Readiness Profile
 * Profil kesiapan terpadu tanpa mengasumsikan ranking factor tertutup dari provider tertentu.
 */
export interface ProviderNeutralAIReadiness {
  retrievability: 'HIGH' | 'MEDIUM' | 'LOW';
  answerability: 'STRONG' | 'ADEQUATE' | 'WEAK';
  entityClarity: 'HIGH' | 'MEDIUM' | 'LOW';
  claimTraceability: 'FULL' | 'PARTIAL' | 'UNSUPPORTED';
  sourceTransparency: 'TRANSPARENT' | 'NEEDS_IMPROVEMENT' | 'OPAQUE';
  informationGain: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AIVisibilityValidationResult {
  articleId: string;
  googleEligibility: GoogleAIEligibilityStatus;
  providerNeutralReadiness: ProviderNeutralAIReadiness;
  checks: AIVisibilityCheckResult[];
  issues: AIVisibilityIssue[];
  recommendations: AIVisibilityRecommendation[];
  dimensions: Record<AIVisibilityDimension, number>;
  score: number; // 0 - 100
  classification: AIVisibilityClassification;
  criticalBlockingReasons: string[];
  validatedAt: string; // ISO 8601
  policyVersion: string; // 'AI_VISIBILITY_READINESS_POLICY_V1'
}

/**
 * Kontrak Antarmuka Masa Depan: Search Generative AI Search Performance Metrics
 * (HANYA KONTRAK DATA - Tidak dihubungkan ke live Search Console API pada Phase 5C)
 */
export interface GenerativeAISearchPerformanceMetrics {
  date: string;
  page: string;
  country?: string;
  device?: string;
  impressions: number;
  environmentTarget?: 'AI_OVERVIEWS' | 'AI_MODE' | 'STANDARD_GEN_AI';
}

/**
 * Kontrak Antarmuka Masa Depan: Search Generative AI Discover Performance Metrics
 * (HANYA KONTRAK DATA - Tidak dihubungkan ke live Search Console API pada Phase 5C)
 */
export interface GenerativeAIDiscoverPerformanceMetrics {
  date: string;
  page: string;
  impressions: number;
  environmentTarget: 'DISCOVER_GEN_AI';
}
