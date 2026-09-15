/**
 * NexaMOS Topic Event Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 * Abstraksi persistence untuk audit trail event topik.
 */

import type { TopicEvent } from '../domain/topic-event.ts';

export interface TopicEventRepository {
  append(event: TopicEvent): Promise<TopicEvent>;
  listByTopicId(topicId: string): Promise<TopicEvent[]>;
}
