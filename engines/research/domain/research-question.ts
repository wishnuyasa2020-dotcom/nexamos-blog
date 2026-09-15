/**
 * NexaMOS Research Question Entity
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

export type QuestionPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type QuestionStatus = 'OPEN' | 'PARTIALLY_ANSWERED' | 'ANSWERED' | 'BLOCKED';

export interface ResearchQuestion {
  id: string;
  question: string;
  priority: QuestionPriority;
  status: QuestionStatus;
  notes?: string | null;
}
