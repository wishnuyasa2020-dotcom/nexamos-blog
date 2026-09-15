/**
 * NexaMOS Claim-Evidence Relation Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ClaimEvidenceRelation } from '../domain/evidence-relation.ts';

export interface ClaimEvidenceRelationRepository {
  add(relation: ClaimEvidenceRelation): Promise<ClaimEvidenceRelation>;
  listByClaimId(claimId: string): Promise<ClaimEvidenceRelation[]>;
  listByEvidenceId(evidenceId: string): Promise<ClaimEvidenceRelation[]>;
  listAll(): Promise<ClaimEvidenceRelation[]>;
  exists(claimId: string, evidenceId: string): Promise<boolean>;
  remove(claimId: string, evidenceId: string): Promise<boolean>;
}
