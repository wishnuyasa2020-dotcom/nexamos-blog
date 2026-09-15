/**
 * NexaMOS In-Memory Research Event Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchEvent } from '../domain/research-event.ts';
import type { ResearchEventRepository } from './research-event-repository.ts';

export class InMemoryResearchEventRepository implements ResearchEventRepository {
  private events: ResearchEvent[] = [];

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async append(event: ResearchEvent): Promise<ResearchEvent> {
    const cloned = this.clone(event);
    this.events.push(cloned);
    return this.clone(cloned);
  }

  async listByProjectId(projectId: string): Promise<ResearchEvent[]> {
    return this.events
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((e) => this.clone(e));
  }

  clear(): void {
    this.events = [];
  }
}
