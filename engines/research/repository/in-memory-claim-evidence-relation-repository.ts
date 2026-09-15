/**
 * NexaMOS In-Memory Claim-Evidence Relation Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ClaimEvidenceRelation } from '../domain/evidence-relation.ts';
import type { ClaimEvidenceRelationRepository } from './claim-evidence-relation-repository.ts';

export class InMemoryClaimEvidenceRelationRepository implements ClaimEvidenceRelationRepository {
  private relations: ClaimEvidenceRelation[] = [];

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async add(relation: ClaimEvidenceRelation): Promise<ClaimEvidenceRelation> {
    const existingIndex = this.relations.findIndex(
      (r) => r.claimId === relation.claimId && r.evidenceId === relation.evidenceId
    );

    if (existingIndex >= 0) {
      // Update relation and strength safely
      this.relations[existingIndex] = this.clone(relation);
      return this.clone(this.relations[existingIndex]);
    }

    const cloned = this.clone(relation);
    this.relations.push(cloned);
    return this.clone(cloned);
  }

  async listByClaimId(claimId: string): Promise<ClaimEvidenceRelation[]> {
    return this.relations
      .filter((r) => r.claimId === claimId)
      .map((r) => this.clone(r));
  }

  async listByEvidenceId(evidenceId: string): Promise<ClaimEvidenceRelation[]> {
    return this.relations
      .filter((r) => r.evidenceId === evidenceId)
      .map((r) => this.clone(r));
  }

  async listAll(): Promise<ClaimEvidenceRelation[]> {
    return this.relations.map((r) => this.clone(r));
  }

  async exists(claimId: string, evidenceId: string): Promise<boolean> {
    return this.relations.some((r) => r.claimId === claimId && r.evidenceId === evidenceId);
  }

  async remove(claimId: string, evidenceId: string): Promise<boolean> {
    const initialLen = this.relations.length;
    this.relations = this.relations.filter(
      (r) => !(r.claimId === claimId && r.evidenceId === evidenceId)
    );
    return this.relations.length < initialLen;
  }

  clear(): void {
    this.relations = [];
  }
}
