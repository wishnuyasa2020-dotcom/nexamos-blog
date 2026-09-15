/**
 * NexaMOS Research Next Action Model
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Enum aksi berikutnya dalam siklus riset otonom terpandu.
 */

export type ResearchNextAction =
  | 'SEARCH_MORE'
  | 'SEARCH_PRIMARY_SOURCE'
  | 'SEARCH_COUNTER_EVIDENCE'
  | 'SEARCH_CURRENT_DATA'
  | 'SYNTHESIZE'
  | 'REQUEST_HUMAN_REVIEW'
  | 'STOP_RESEARCH';

export const RESEARCH_NEXT_ACTIONS: readonly ResearchNextAction[] = [
  'SEARCH_MORE',
  'SEARCH_PRIMARY_SOURCE',
  'SEARCH_COUNTER_EVIDENCE',
  'SEARCH_CURRENT_DATA',
  'SYNTHESIZE',
  'REQUEST_HUMAN_REVIEW',
  'STOP_RESEARCH'
] as const;

export function isResearchNextAction(value: unknown): value is ResearchNextAction {
  return typeof value === 'string' && RESEARCH_NEXT_ACTIONS.includes(value as ResearchNextAction);
}

export interface NextActionProposal {
  action: ResearchNextAction;
  reason: string;
  focusQuery?: string;
  focusQuestionId?: string;
  focusClaimId?: string;
}
