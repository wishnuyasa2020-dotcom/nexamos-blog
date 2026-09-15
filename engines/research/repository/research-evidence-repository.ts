/**
 * NexaMOS Research Evidence Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchEvidence } from '../domain/research-evidence.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';

export interface ResearchEvidenceRepository {
  create(evidence: ResearchEvidence): Promise<Result<ResearchEvidence, ResearchDomainError>>;
  getById(id: string): Promise<ResearchEvidence | null>;
  listByProjectId(projectId: string): Promise<ResearchEvidence[]>;
  listBySourceId(sourceId: string): Promise<ResearchEvidence[]>;
  update(evidence: ResearchEvidence): Promise<Result<ResearchEvidence, ResearchDomainError>>;
  existsById(id: string): Promise<boolean>;
}
