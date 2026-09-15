/**
 * NexaMOS Citation Map Model
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Menjamin traceability penuh: Article Sentence/Claim ➔ Claim ➔ Evidence ➔ Source.
 */

export interface CitationMapEntry {
  claimUsageId: string;
  claimId: string;
  sourceIds: string[];
  evidenceIds: string[];
}
