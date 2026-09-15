/**
 * NexaMOS Research Orchestration Result Model
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Model hasil akhir proses orkestrasi riset otonom terpandu.
 */

import type { ResearchPlan } from './research-plan.ts';
import type { ResearchIteration } from './research-iteration.ts';
import type { ResearchBrief } from './research-brief.ts';
import type { ResearchNextAction } from './research-next-action.ts';

export interface ResearchOrchestrationResult {
  projectId: string;
  topicId: string;
  plan: ResearchPlan;
  iterations: ResearchIteration[];
  brief: ResearchBrief;
  finalAction: ResearchNextAction;
  stopReason: string;
  totalIterations: number;
  totalQueriesExecuted: number;
  totalSourcesAcquired: number;
  totalEvidenceCaptured: number;
  totalClaimsEvaluated: number;
  unresolvedGapsCount: number;
}
