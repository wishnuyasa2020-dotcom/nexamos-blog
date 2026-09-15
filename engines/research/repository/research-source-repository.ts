/**
 * NexaMOS Research Source Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchSource } from '../domain/research-source.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';

export interface ResearchSourceRepository {
  create(source: ResearchSource): Promise<Result<ResearchSource, ResearchDomainError>>;
  getById(id: string): Promise<ResearchSource | null>;
  listByProjectId(projectId: string): Promise<ResearchSource[]>;
  update(source: ResearchSource): Promise<Result<ResearchSource, ResearchDomainError>>;
  existsById(id: string): Promise<boolean>;
}
