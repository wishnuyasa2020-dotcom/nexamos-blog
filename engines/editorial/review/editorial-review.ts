/**
 * NexaMOS Editorial Review Model
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Model hasil evaluasi multi-dimensi kualitas penulisan dan kepatuhan gaya naskah artikel.
 */

export type QualityDimension =
  | 'CLARITY'
  | 'COHERENCE'
  | 'DEPTH'
  | 'THESIS_ALIGNMENT'
  | 'INFORMATION_DENSITY'
  | 'READER_USEFULNESS'
  | 'STRUCTURE'
  | 'ORIGINALITY'
  | 'TONE_CONSISTENCY'
  | 'GROUNDING_PRESERVATION';

export const QUALITY_DIMENSIONS: readonly QualityDimension[] = [
  'CLARITY',
  'COHERENCE',
  'DEPTH',
  'THESIS_ALIGNMENT',
  'INFORMATION_DENSITY',
  'READER_USEFULNESS',
  'STRUCTURE',
  'ORIGINALITY',
  'TONE_CONSISTENCY',
  'GROUNDING_PRESERVATION'
] as const;

export type ReviewSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL';

export type ReviewStatus =
  | 'PASS'
  | 'REVISION_REQUIRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'REJECT';

export interface ReviewIssue {
  dimension: QualityDimension;
  code: string;
  message: string;
  severity: ReviewSeverity;
  sectionId?: string | null;
  snippet?: string | null;
  recommendation?: string | null;
}

export interface EditorialReview {
  articleDraftId: string;
  qualityScores: Record<QualityDimension, number>;
  overallWritingScore: number; // 0 - 100
  status: ReviewStatus;
  issues: ReviewIssue[];
  strengths: string[];
  revisionRecommendations: string[];
  reviewedAt: string; // ISO 8601
  reviewPolicyVersion: string; // 'EDITORIAL_WRITING_POLICY_V1'
}
