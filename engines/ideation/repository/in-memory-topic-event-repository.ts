/**
 * NexaMOS In-Memory Topic Event Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 */

import type { TopicEvent } from '../domain/topic-event.ts';
import type { TopicEventRepository } from './topic-event-repository.ts';

export class InMemoryTopicEventRepository implements TopicEventRepository {
  private events: TopicEvent[] = [];

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async append(event: TopicEvent): Promise<TopicEvent> {
    const cloned = this.clone(event);
    this.events.push(cloned);
    return this.clone(cloned);
  }

  async listByTopicId(topicId: string): Promise<TopicEvent[]> {
    return this.events
      .filter((e) => e.topicId === topicId)
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0))
      .map((e) => this.clone(e));
  }

  clear(): void {
    this.events = [];
  }
}
