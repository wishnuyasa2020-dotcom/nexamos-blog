/**
 * NexaMOS Source Candidate Model
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Merepresentasikan hasil temuan kandidat sumber dari provider pencarian sebelum akuisisi.
 */

import type { SourceType } from '../domain/source-type.ts';

export type CandidateStatus =
  | 'DISCOVERED'
  | 'EVALUATING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'ACQUISITION_FAILED'
  | 'INGESTED';

export const CANDIDATE_STATUSES: readonly CandidateStatus[] = [
  'DISCOVERED',
  'EVALUATING',
  'ACCEPTED',
  'REJECTED',
  'DUPLICATE',
  'ACQUISITION_FAILED',
  'INGESTED'
] as const;

export interface SourceCandidate {
  id: string;
  queryId: string;
  researchProjectId: string;
  title: string;
  url: string;
  snippet?: string | null;
  publisher?: string | null;
  author?: string | null;
  publicationDate?: string | null;
  /** Alias opsional untuk kompatibilitas */
  publishedDate?: string | null;
  sourceType?: SourceType | null;
  provider: string;
  rank?: number | null;
  status: CandidateStatus;
  discoveredAt: string;
  evaluationNotes?: string | null;
}

export type CreateSourceCandidateInput = Omit<
  SourceCandidate,
  'id' | 'status' | 'discoveredAt'
> & {
  id?: string;
  status?: CandidateStatus;
  discoveredAt?: string;
};
