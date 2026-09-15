/**
 * NexaMOS Research Event Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchEvent } from '../domain/research-event.ts';

export interface ResearchEventRepository {
  append(event: ResearchEvent): Promise<ResearchEvent>;
  listByProjectId(projectId: string): Promise<ResearchEvent[]>;
}
