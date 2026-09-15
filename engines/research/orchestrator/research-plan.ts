/**
 * NexaMOS Research Plan Model
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Model rencana riset yang diusulkan oleh AI dan divalidasi oleh kebijakan deterministik.
 */

import type { ResearchQuestion } from '../domain/research-question.ts';
import type { EvidenceLevel } from '../../ideation/domain/evidence-level.ts';
import type { SourceType } from '../domain/source-type.ts';
import type { TopicVolatility } from '../acquisition/freshness-evaluator.ts';

export interface ResearchPlan {
  id: string;
  topicId: string;
  objective: string;
  researchQuestions: ResearchQuestion[];
  requiredEvidenceLevel: EvidenceLevel;
  preferredSourceTypes: SourceType[];
  counterEvidenceRequired: boolean;
  freshnessRequirement: TopicVolatility;
  maxResearchIterations: number;
  createdAt: string;
}

export interface ResearchPlanProposal {
  objective: string;
  researchQuestions: Array<{
    question: string;
    targetEvidenceLevel?: EvidenceLevel;
    priority?: 'CRITICAL' | 'IMPORTANT' | 'EXPLORATORY';
  }>;
  requiredEvidenceLevel: EvidenceLevel;
  preferredSourceTypes: SourceType[];
  counterEvidenceRequired: boolean;
  freshnessRequirement: TopicVolatility;
  suggestedIterations?: number;
  rationale?: string;
}

export interface CreateResearchPlanInput {
  id?: string;
  topicId: string;
  objective: string;
  researchQuestions: ResearchQuestion[];
  requiredEvidenceLevel: EvidenceLevel;
  preferredSourceTypes: SourceType[];
  counterEvidenceRequired?: boolean;
  freshnessRequirement?: TopicVolatility;
  maxResearchIterations?: number;
  createdAt?: string;
}
