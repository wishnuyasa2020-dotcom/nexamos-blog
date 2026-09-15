/**
 * NexaMOS Topic Lifecycle Status
 *
 * Primary lifecycle:
 * CAPTURED -> SCREENING -> RESEARCH_REQUIRED -> QUALIFIED -> PRIORITIZED -> APPROVED -> IN_PRODUCTION -> PUBLISHED
 *
 * Alternate states:
 * ON_HOLD, REJECTED, ARCHIVED
 */

export type TopicLifecycleStatus =
  | 'CAPTURED'
  | 'SCREENING'
  | 'RESEARCH_REQUIRED'
  | 'QUALIFIED'
  | 'PRIORITIZED'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'PUBLISHED'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'ARCHIVED';

export const TOPIC_STATUSES: readonly TopicLifecycleStatus[] = [
  'CAPTURED',
  'SCREENING',
  'RESEARCH_REQUIRED',
  'QUALIFIED',
  'PRIORITIZED',
  'APPROVED',
  'IN_PRODUCTION',
  'PUBLISHED',
  'ON_HOLD',
  'REJECTED',
  'ARCHIVED'
] as const;

export const ACTIVE_LIFECYCLE_SEQUENCE: readonly TopicLifecycleStatus[] = [
  'CAPTURED',
  'SCREENING',
  'RESEARCH_REQUIRED',
  'QUALIFIED',
  'PRIORITIZED',
  'APPROVED',
  'IN_PRODUCTION',
  'PUBLISHED'
] as const;

export const ALTERNATE_TOPIC_STATUSES: readonly TopicLifecycleStatus[] = [
  'ON_HOLD',
  'REJECTED',
  'ARCHIVED'
] as const;
