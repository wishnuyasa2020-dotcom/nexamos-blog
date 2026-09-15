/**
 * NexaMOS Research Iteration Model
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Model audit jejak setiap putaran/siklus riset untuk transparansi dan auditabilitas.
 */

import type { ResearchNextAction } from './research-next-action.ts';

export interface ResearchIteration {
  iterationNumber: number;
  researchQuestions: string[];
  queriesExecuted: string[];
  sourcesDiscovered: number;
  sourcesAccepted: number;
  evidenceCaptured: number;
  claimsEvaluated: number;
  gapsRemaining: number;
  nextAction: ResearchNextAction;
  actionReason?: string;
  timestamp: string; // ISO 8601
}
