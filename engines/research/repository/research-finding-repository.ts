/**
 * NexaMOS Research Finding Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchFinding } from '../domain/research-finding.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';

export interface ResearchFindingRepository {
  create(finding: ResearchFinding): Promise<Result<ResearchFinding, ResearchDomainError>>;
  getById(id: string): Promise<ResearchFinding | null>;
  listByProjectId(projectId: string): Promise<ResearchFinding[]>;
  update(finding: ResearchFinding): Promise<Result<ResearchFinding, ResearchDomainError>>;
  existsById(id: string): Promise<boolean>;
}
