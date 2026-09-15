/**
 * NexaMOS Research Claim Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchClaim } from '../domain/research-claim.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';

export interface ResearchClaimRepository {
  create(claim: ResearchClaim): Promise<Result<ResearchClaim, ResearchDomainError>>;
  getById(id: string): Promise<ResearchClaim | null>;
  listByProjectId(projectId: string): Promise<ResearchClaim[]>;
  update(claim: ResearchClaim): Promise<Result<ResearchClaim, ResearchDomainError>>;
  existsById(id: string): Promise<boolean>;
}
