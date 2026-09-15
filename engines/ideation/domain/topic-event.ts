/**
 * NexaMOS Topic Event & Audit Trail Domain Model
 *
 * Merekam setiap perubahan status dan keputusan editorial pada topik secara kronologis.
 */

export type TopicEventType =
  | 'TOPIC_CAPTURED'
  | 'TOPIC_UPDATED'
  | 'TOPIC_SCREENING_STARTED'
  | 'TOPIC_QUALIFIED'
  | 'TOPIC_RESEARCH_REQUIRED'
  | 'TOPIC_PRIORITIZED'
  | 'TOPIC_APPROVED'
  | 'TOPIC_ON_HOLD'
  | 'TOPIC_RESUMED'
  | 'TOPIC_REJECTED'
  | 'TOPIC_ARCHIVED'
  | 'TOPIC_PRODUCTION_STARTED'
  | 'TOPIC_ARTICLE_LINKED'
  | 'TOPIC_PUBLISHED';

export const TOPIC_EVENT_TYPES: readonly TopicEventType[] = [
  'TOPIC_CAPTURED',
  'TOPIC_UPDATED',
  'TOPIC_SCREENING_STARTED',
  'TOPIC_QUALIFIED',
  'TOPIC_RESEARCH_REQUIRED',
  'TOPIC_PRIORITIZED',
  'TOPIC_APPROVED',
  'TOPIC_ON_HOLD',
  'TOPIC_RESUMED',
  'TOPIC_REJECTED',
  'TOPIC_ARCHIVED',
  'TOPIC_PRODUCTION_STARTED',
  'TOPIC_ARTICLE_LINKED',
  'TOPIC_PUBLISHED'
] as const;

export interface ManualOverrideMetadata {
  override: true;
  originalDecision: string;
  newDecision: string;
  reason: string;
  actor: string;
  timestamp: string;
}

export interface TopicEvent {
  id: string;
  topicId: string;
  type: TopicEventType;
  timestamp: string; // ISO 8601 string
  actor: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
}
