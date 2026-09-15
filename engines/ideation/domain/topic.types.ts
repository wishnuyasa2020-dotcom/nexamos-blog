/**
 * NexaMOS Canonical Topic Domain Types
 *
 * Sourced from NexaMOS Blog Master Reference & IDE Agent Doctrine v1.0
 */

import type { Territory } from './territory.ts';
import type { TopicLifecycleStatus } from './topic-status.ts';
import type { ArticleType } from './article-type.ts';
import type { DistributionTarget } from './distribution-target.ts';
import type { EvidenceLevel } from './evidence-level.ts';
import type { OriginalityType, CommodityRisk } from './originality-type.ts';
import type { EditorialRole } from './editorial-role.ts';
import type { TopicQualificationResult } from './qualification.types.ts';
import type { PriorityDimensions } from './priority.types.ts';

export * from './territory.ts';
export * from './topic-status.ts';
export * from './article-type.ts';
export * from './distribution-target.ts';
export * from './evidence-level.ts';
export * from './originality-type.ts';
export * from './editorial-role.ts';
export * from './qualification.types.ts';
export * from './priority.types.ts';
export * from './result.ts';
export * from './topic-article-relation.ts';
export * from './topic-event.ts';
export * from './topic-snapshot.ts';

export interface TopicAudience {
  segment: string;
  jobToBeDone?: string | null;
  knowledgeLevel?: string | null;
}

export interface TopicIntent {
  primary: string;
  secondary?: string[];
}

export interface TopicInformationGain {
  expectedContribution: string;
  originalityType: OriginalityType[];
  commodityRisk: CommodityRisk;
}

export interface TopicEvidencePlan {
  requiredEvidenceLevel: EvidenceLevel;
  plannedSources: string[];
  originalEvidenceRequired: boolean;
  notes?: string | null;
}

export interface TopicBusinessRelevance {
  objective: string;
  funnelRole: string;
  notes?: string | null;
}

export interface TopicPriority extends PriorityDimensions {
  overall?: number | null; // 0 - 100
}

/**
 * Canonical Topic Entity
 *
 * Definition:
 * Topic adalah candidate knowledge opportunity yang merepresentasikan
 * problem, question, phenomenon, tension, atau subject yang berpotensi
 * dikembangkan menjadi satu atau lebih editorial assets.
 */
export interface Topic {
  id: string;
  title: string;
  slug: string;
  territory: Territory;
  status: TopicLifecycleStatus;
  editorialRole?: EditorialRole | null;
  audience: TopicAudience;
  problem: string;
  intent: TopicIntent;
  thesis: string | null;
  whyNow: string | null;
  informationGain: TopicInformationGain;
  evidencePlan: TopicEvidencePlan;
  businessRelevance: TopicBusinessRelevance;
  recommendedArticleType: ArticleType;
  distributionTargets: DistributionTarget[];
  priority?: TopicPriority | null;
  qualification?: TopicQualificationResult | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNote?: string | null;
  articleIds?: string[];
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export type CreateTopicInput = Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTopicInput = Partial<CreateTopicInput>;
