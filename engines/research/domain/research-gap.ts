/**
 * NexaMOS Research Gap Model
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

export type ResearchGapType =
  | 'MISSING_PRIMARY_SOURCE'
  | 'MISSING_CURRENT_DATA'
  | 'MISSING_COUNTER_EVIDENCE'
  | 'MISSING_LOCAL_CONTEXT'
  | 'MISSING_METHOD_DETAIL'
  | 'UNRESOLVED_CONTRADICTION'
  | 'INSUFFICIENT_SAMPLE'
  | 'OTHER';

export interface ResearchGap {
  type: ResearchGapType;
  description: string;
  claimId?: string | null;
  questionId?: string | null;
}
