/**
 * NexaMOS Feedback Action Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - NO AUTO-OPTIMIZATION LOOP: Analytics dilarang memicu auto-rewrite artikel atau auto-republish.
 * - Closed Loop: Menyalurkan rekomendasi ke alur kanonikal (Phase 1, Phase 2, Phase 3/4/5/6).
 * - CRITICAL priority hanya untuk insiden teknis pelacakan rusak atau korupsi data, BUKAN untuk penurunan traffic biasa.
 */

import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';

export type FeedbackTarget =
  | 'TOPIC'
  | 'RESEARCH'
  | 'EDITORIAL'
  | 'SEO'
  | 'DISCOVER'
  | 'AI_VISIBILITY'
  | 'VISUAL'
  | 'PUBLISHING'
  | 'CONTENT_STRATEGY'
  | 'HUMAN_REVIEW';

export const FEEDBACK_TARGETS: readonly FeedbackTarget[] = [
  'TOPIC',
  'RESEARCH',
  'EDITORIAL',
  'SEO',
  'DISCOVER',
  'AI_VISIBILITY',
  'VISUAL',
  'PUBLISHING',
  'CONTENT_STRATEGY',
  'HUMAN_REVIEW'
] as const;

export type FeedbackActionType =
  | 'REVIEW_TOPIC'
  | 'PRIORITIZE_FOLLOW_UP'
  | 'CREATE_UPDATE_TOPIC'
  | 'REFRESH_RESEARCH'
  | 'UPDATE_ARTICLE'
  | 'TEST_TITLE'
  | 'IMPROVE_INTERNAL_LINKING'
  | 'IMPROVE_VISUAL'
  | 'REVIEW_SEARCH_INTENT'
  | 'EXPAND_TOPIC_CLUSTER'
  | 'NO_ACTION';

export const FEEDBACK_ACTION_TYPES: readonly FeedbackActionType[] = [
  'REVIEW_TOPIC',
  'PRIORITIZE_FOLLOW_UP',
  'CREATE_UPDATE_TOPIC',
  'REFRESH_RESEARCH',
  'UPDATE_ARTICLE',
  'TEST_TITLE',
  'IMPROVE_INTERNAL_LINKING',
  'IMPROVE_VISUAL',
  'REVIEW_SEARCH_INTENT',
  'EXPAND_TOPIC_CLUSTER',
  'NO_ACTION'
] as const;

export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Usulan Topik Lanjutan (Bridge to Phase 1 Topic Ideation)
 * Handoff ini akan dimasukkan ke Topic Lifecycle dengan status awal CAPTURED.
 */
export interface FollowUpTopicProposal {
  proposedTitle: string;
  problem: string;
  audienceSegment: string;
  primaryIntent: string;
  suggestedTerritory: Territory;
  recommendedArticleType: ArticleType;
  originArticleId: string;
  rationaleSignals: string[];
}

/**
 * Permintaan Penyegaran Riset (Bridge to Phase 2 Research Engine)
 */
export interface ResearchRefreshRequest {
  articleId: string;
  topicId: string;
  reason: string;
  staleEvidenceIdentified: string[];
  suggestedFocusAreas: string[];
  requestedAt: string; // ISO 8601
}

/**
 * Kontrak Eksperimen Konten (Future A/B Experiment Boundary)
 */
export interface ContentExperiment {
  experimentId: string;
  articleId: string;
  hypothesis: string;
  experimentType: 'TITLE_TEST' | 'HERO_IMAGE_TEST' | 'CTA_TEST' | 'INTERNAL_LINK_TEST';
  variantA: string;
  variantB: string;
  primaryMetric: string;
  guardrailMetrics: string[];
  startAt?: string;
  endAt?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CONCLUDED' | 'ABORTED';
}

/**
 * Entitas Tindakan Umpan Balik Resmi
 */
export interface FeedbackAction {
  id: string;
  target: FeedbackTarget;
  actionType: FeedbackActionType;
  priority: FeedbackPriority;
  reason: string;
  originArticleId: string;
  supportingDiagnosisIds: string[];
  payload?: {
    followUpTopicProposal?: FollowUpTopicProposal;
    researchRefreshRequest?: ResearchRefreshRequest;
    contentExperiment?: ContentExperiment;
    recommendedNotes?: string;
    [key: string]: any;
  };
  status: 'PROPOSED' | 'ROUTED' | 'ACKNOWLEDGED' | 'DISMISSED';
  createdAt: string; // ISO 8601
  routedAt?: string | null;
}
