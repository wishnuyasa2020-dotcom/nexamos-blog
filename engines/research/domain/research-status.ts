/**
 * NexaMOS Research Lifecycle Status & FSM Transitions
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

export type ResearchStatus =
  | 'PLANNED'
  | 'COLLECTING'
  | 'EVALUATING'
  | 'SYNTHESIZING'
  | 'READY'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'ARCHIVED';

export const RESEARCH_STATUSES: readonly ResearchStatus[] = [
  'PLANNED',
  'COLLECTING',
  'EVALUATING',
  'SYNTHESIZING',
  'READY',
  'COMPLETED',
  'BLOCKED',
  'ARCHIVED'
] as const;

export interface ResearchTransitionResult {
  allowed: boolean;
  from: ResearchStatus;
  to: ResearchStatus;
  reason?: string;
}

const ALLOWED_RESEARCH_TRANSITIONS: Record<ResearchStatus, ResearchStatus[]> = {
  PLANNED: ['COLLECTING', 'BLOCKED', 'ARCHIVED'],
  COLLECTING: ['EVALUATING', 'BLOCKED', 'ARCHIVED'],
  EVALUATING: ['SYNTHESIZING', 'COLLECTING', 'BLOCKED', 'ARCHIVED'],
  SYNTHESIZING: ['READY', 'EVALUATING', 'COLLECTING', 'BLOCKED', 'ARCHIVED'],
  READY: ['COMPLETED', 'SYNTHESIZING', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  BLOCKED: ['COLLECTING', 'EVALUATING', 'ARCHIVED'],
  ARCHIVED: [] // Terminal
};

export function validateResearchTransition(
  from: ResearchStatus,
  to: ResearchStatus
): ResearchTransitionResult {
  if (from === to) {
    return {
      allowed: true,
      from,
      to
    };
  }

  const allowedTargets = ALLOWED_RESEARCH_TRANSITIONS[from] || [];
  if (allowedTargets.includes(to)) {
    return {
      allowed: true,
      from,
      to
    };
  }

  return {
    allowed: false,
    from,
    to,
    reason: `Transisi status riset dari '${from}' ke '${to}' tidak diizinkan oleh FSM Research NexaMOS.`
  };
}
