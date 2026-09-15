/**
 * NexaMOS Research Synthesis Model
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchQuestion } from './research-question.ts';
import type { ResearchClaim } from './research-claim.ts';
import type { ResearchFinding } from './research-finding.ts';
import type { ResearchGap } from './research-gap.ts';

export type ResearchReadiness = 'NOT_READY' | 'READY_FOR_EDITORIAL' | 'REVIEW_REQUIRED';

export type RecommendedTopicAction = 'NONE' | 'READY_FOR_REQUALIFICATION' | 'RESCREEN';

export interface ResearchSynthesis {
  projectId: string;
  topicId: string;
  answeredQuestions: ResearchQuestion[];
  openQuestions: ResearchQuestion[];
  supportedClaims: ResearchClaim[];
  disputedClaims: ResearchClaim[];
  keyFindings: ResearchFinding[];
  limitations: string[];
  gaps: ResearchGap[];
  evidenceSummary: string;
  readiness: ResearchReadiness;
  recommendedTopicAction: RecommendedTopicAction;
  synthesizedAt: string;
}
