/**
 * NexaMOS Research Claim Types & Statuses
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

export type ClaimType =
  | 'FACTUAL'
  | 'COMPARATIVE'
  | 'CAUSAL'
  | 'INTERPRETIVE'
  | 'FORECAST'
  | 'DEFINITIONAL';

export const CLAIM_TYPES: readonly ClaimType[] = [
  'FACTUAL',
  'COMPARATIVE',
  'CAUSAL',
  'INTERPRETIVE',
  'FORECAST',
  'DEFINITIONAL'
] as const;

export type ClaimStatus =
  | 'UNVERIFIED'
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'DISPUTED'
  | 'INSUFFICIENT_EVIDENCE';

export const CLAIM_STATUSES: readonly ClaimStatus[] = [
  'UNVERIFIED',
  'SUPPORTED',
  'PARTIALLY_SUPPORTED',
  'CONTRADICTED',
  'DISPUTED',
  'INSUFFICIENT_EVIDENCE'
] as const;

export type ClaimImportance = 'CRITICAL' | 'SUPPORTING' | 'ANCILLARY';

export const CLAIM_IMPORTANCES: readonly ClaimImportance[] = [
  'CRITICAL',
  'SUPPORTING',
  'ANCILLARY'
] as const;
