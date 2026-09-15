/**
 * NexaMOS In-Memory Research Claim Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchClaim } from '../domain/research-claim.ts';
import type { ResearchClaimRepository } from './research-claim-repository.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';

export class InMemoryResearchClaimRepository implements ResearchClaimRepository {
  private claims = new Map<string, ResearchClaim>();

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(claim: ResearchClaim): Promise<Result<ResearchClaim, ResearchDomainError>> {
    if (this.claims.has(claim.id)) {
      return err(
        createResearchDomainError(
          'DUPLICATE_CLAIM_ID',
          `Klaim riset dengan id '${claim.id}' sudah terdaftar.`
        )
      );
    }

    const cloned = this.clone(claim);
    this.claims.set(claim.id, cloned);
    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<ResearchClaim | null> {
    const found = this.claims.get(id);
    return found ? this.clone(found) : null;
  }

  async listByProjectId(projectId: string): Promise<ResearchClaim[]> {
    return Array.from(this.claims.values())
      .filter((c) => c.researchProjectId === projectId)
      .map((c) => this.clone(c));
  }

  async update(claim: ResearchClaim): Promise<Result<ResearchClaim, ResearchDomainError>> {
    if (!this.claims.has(claim.id)) {
      return err(
        createResearchDomainError(
          'CLAIM_NOT_FOUND',
          `Klaim riset dengan id '${claim.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    const cloned = this.clone(claim);
    this.claims.set(claim.id, cloned);
    return ok(this.clone(cloned));
  }

  async existsById(id: string): Promise<boolean> {
    return this.claims.has(id);
  }

  clear(): void {
    this.claims.clear();
  }
}
