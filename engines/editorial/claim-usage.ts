/**
 * NexaMOS Claim Usage Model
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Melacak penggunaan klaim faktual dalam seksi naskah artikel.
 */

export type ClaimUsageType = 'DIRECT' | 'PARAPHRASED' | 'SYNTHESIZED' | 'CONTEXTUAL';

export const CLAIM_USAGE_TYPES: readonly ClaimUsageType[] = [
  'DIRECT',
  'PARAPHRASED',
  'SYNTHESIZED',
  'CONTEXTUAL'
] as const;

export interface ClaimUsage {
  id: string;
  claimId: string;
  sectionId: string;
  usageType: ClaimUsageType;
  statement: string;
}
