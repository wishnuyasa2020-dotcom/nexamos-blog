/**
 * NexaMOS Unified Distribution Readiness Gate - Domain Models & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5D specifications.
 * Hard Principles:
 * VALIDATORS EVALUATE
 * UNIFIED GATE DECIDES
 * PUBLISHING WORKFLOW EXECUTES
 *
 * Readiness ≠ Performance / Rank Prediction
 * A validator warning ≠ automatic publishing failure
 */

import type { ReviewStatus, EditorialReview } from '../editorial/review/editorial-review.ts';
import type { SEOClassification, SEOValidationResult, SEOIssue } from '../seo-validator/seo-validation.ts';
import type { DiscoverClassification, DiscoverValidationResult, DiscoverIssue } from '../discover-validator/discover-validation.ts';
import type { AIVisibilityClassification, AIVisibilityValidationResult, AIVisibilityIssue } from '../ai-visibility/ai-visibility-validation.ts';

export type DistributionValidatorSource =
  | 'EDITORIAL'
  | 'SEO'
  | 'DISCOVER'
  | 'AI_VISIBILITY';

export type DistributionRouteTarget =
  | 'EDITORIAL'
  | 'RESEARCH'
  | 'SEO_TECHNICAL'
  | 'CONTENT_STRATEGY'
  | 'VISUAL_DESIGN'
  | 'SITE_TECHNICAL'
  | 'PUBLISHING'
  | 'HUMAN_REVIEW';

export const DISTRIBUTION_ROUTE_TARGETS: readonly DistributionRouteTarget[] = [
  'EDITORIAL',
  'RESEARCH',
  'SEO_TECHNICAL',
  'CONTENT_STRATEGY',
  'VISUAL_DESIGN',
  'SITE_TECHNICAL',
  'PUBLISHING',
  'HUMAN_REVIEW'
] as const;

export type DistributionIssueSeverity =
  | 'INFO'
  | 'WARNING'
  | 'REVISION'
  | 'CRITICAL';

export interface DistributionIssue {
  code: string;
  severity: DistributionIssueSeverity;
  sourceValidators: DistributionValidatorSource[];
  message: string;
  route: DistributionRouteTarget;
  blocking: boolean;
  originalCodes?: string[];
  location?: string;
  recommendation?: string;
}

export interface DistributionRecommendation {
  id: string;
  title: string;
  description: string;
  suggestedAction: string;
  targetRoute: DistributionRouteTarget;
  sourceValidators: DistributionValidatorSource[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type UnifiedDistributionStatus =
  | 'READY_TO_PUBLISH'
  | 'READY_WITH_WARNINGS'
  | 'RETURN_FOR_REVISION'
  | 'BLOCKED';

export const UNIFIED_DISTRIBUTION_STATUSES: readonly UnifiedDistributionStatus[] = [
  'READY_TO_PUBLISH',
  'READY_WITH_WARNINGS',
  'RETURN_FOR_REVISION',
  'BLOCKED'
] as const;

/**
 * Kontrak Acknowledgment untuk Warning non-kritis
 */
export interface WarningAcknowledgment {
  warningAcknowledged: boolean;
  warningAcknowledgedBy: string;
  warningAcknowledgedAt: string; // ISO 8601
  notes?: string;
}

/**
 * Kandidat Publikasi Resmi untuk Handoff ke Phase 6 Publishing Workflow
 */
export interface PublicationCandidate {
  candidateId: string;
  articleId: string;
  slug: string;
  title: string;
  distributionReadinessId: string;
  approvedAt: string; // ISO 8601
  overallStatus: 'READY_TO_PUBLISH' | 'READY_WITH_WARNINGS';
  warnings: DistributionIssue[];
  warningAcknowledgment?: WarningAcknowledgment | null;
  policyVersion: string;
}

/**
 * Input Contract untuk Unified Distribution Gate
 */
export interface UnifiedDistributionReadinessInput {
  articleId: string;
  editorialStatus: ReviewStatus;
  seoResult: SEOValidationResult;
  discoverResult: DiscoverValidationResult;
  aiVisibilityResult: AIVisibilityValidationResult;
  editorialReview?: EditorialReview | null;
  validatedAt?: string;
}

/**
 * Audit Events untuk Observabilitas dan Kepatuhan Gate Distribusi
 */
export type DistributionAuditEventType =
  | 'DISTRIBUTION_EVALUATION_STARTED'
  | 'DISTRIBUTION_EVALUATION_COMPLETED'
  | 'DISTRIBUTION_BLOCKED'
  | 'DISTRIBUTION_REVISION_REQUIRED'
  | 'DISTRIBUTION_READY_WITH_WARNINGS'
  | 'DISTRIBUTION_READY_TO_PUBLISH'
  | 'WARNING_ACKNOWLEDGED'
  | 'PUBLICATION_CANDIDATE_CREATED';

export interface DistributionAuditEvent {
  eventId: string;
  eventType: DistributionAuditEventType;
  articleId: string;
  timestamp: string; // ISO 8601
  details: Record<string, any>;
}

/**
 * Output Contract untuk Unified Distribution Gate
 */
export interface UnifiedDistributionReadinessResult {
  readinessId: string;
  articleId: string;
  editorialStatus: ReviewStatus;
  seoStatus: SEOClassification;
  discoverStatus: DiscoverClassification;
  aiVisibilityStatus: AIVisibilityClassification;
  overallStatus: UnifiedDistributionStatus;
  blockers: DistributionIssue[];
  warnings: DistributionIssue[];
  recommendations: DistributionRecommendation[];
  routes: DistributionRouteTarget[];
  summary: string;
  evaluatedAt: string; // ISO 8601
  policyVersion: string; // 'UNIFIED_DISTRIBUTION_POLICY_V1'
  aggregateDiagnosticScore?: number; // Observabilitas diagnostik saja, BUKAN penentu publish
  warningAcknowledgment?: WarningAcknowledgment | null;
  publicationCandidate?: PublicationCandidate | null;
  auditEvents: DistributionAuditEvent[];
}
