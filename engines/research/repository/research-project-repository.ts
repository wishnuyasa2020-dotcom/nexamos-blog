/**
 * NexaMOS Research Project Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchProject } from '../domain/research-project.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';

export interface ResearchProjectRepository {
  create(project: ResearchProject): Promise<Result<ResearchProject, ResearchDomainError>>;
  getById(id: string): Promise<ResearchProject | null>;
  listByTopicId(topicId: string): Promise<ResearchProject[]>;
  update(project: ResearchProject): Promise<Result<ResearchProject, ResearchDomainError>>;
  existsById(id: string): Promise<boolean>;
}
