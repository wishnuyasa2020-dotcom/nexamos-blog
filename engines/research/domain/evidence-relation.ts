/**
 * NexaMOS Claim ↔ Evidence Relation Entity
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 * Mendukung relasi many-to-many (N:N) antara Claim dan Evidence.
 */

export type EvidenceRelationType =
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'QUALIFIES'
  | 'CONTEXTUALIZES';

export const EVIDENCE_RELATION_TYPES: readonly EvidenceRelationType[] = [
  'SUPPORTS',
  'CONTRADICTS',
  'QUALIFIES',
  'CONTEXTUALIZES'
] as const;

export type RelationStrength = 'WEAK' | 'MODERATE' | 'STRONG';

export const RELATION_STRENGTHS: readonly RelationStrength[] = [
  'WEAK',
  'MODERATE',
  'STRONG'
] as const;

export interface ClaimEvidenceRelation {
  claimId: string;
  evidenceId: string;
  relation: EvidenceRelationType;
  strength: RelationStrength;
  notes?: string | null;
  createdAt: string;
}
