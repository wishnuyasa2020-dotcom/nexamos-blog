/**
 * NexaMOS Source Discovery Models & Contracts
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Discovery bertugas menemukan candidate source dari query riset.
 */

import type { SourceType } from '../domain/source-type.ts';
import type { EvidenceLevel } from '../../ideation/domain/evidence-level.ts';
import type { SourceCandidate } from './source-candidate.ts';

export type DiscoveryQueryIntent =
  | 'FIND_PRIMARY_SOURCE'
  | 'FIND_EMPIRICAL_EVIDENCE'
  | 'FIND_CURRENT_DATA'
  | 'FIND_COUNTER_EVIDENCE'
  | 'FIND_DEFINITION'
  | 'FIND_LOCAL_CONTEXT'
  | 'GENERAL_RESEARCH';

export const DISCOVERY_QUERY_INTENTS: readonly DiscoveryQueryIntent[] = [
  'FIND_PRIMARY_SOURCE',
  'FIND_EMPIRICAL_EVIDENCE',
  'FIND_CURRENT_DATA',
  'FIND_COUNTER_EVIDENCE',
  'FIND_DEFINITION',
  'FIND_LOCAL_CONTEXT',
  'GENERAL_RESEARCH'
] as const;

export interface DiscoveryQuery {
  id: string;
  researchProjectId: string;
  researchQuestionId: string;
  query: string;
  intent: DiscoveryQueryIntent;
  preferredSourceTypes: SourceType[];
  requiredEvidenceLevel?: EvidenceLevel | null;
  dateConstraint?: string | null;
  language?: string | null;
  domainConstraints?: string[] | null;
  createdAt: string;
}

export interface CreateDiscoveryQueryInput {
  id?: string;
  researchProjectId: string;
  researchQuestionId: string;
  query: string;
  intent: DiscoveryQueryIntent;
  preferredSourceTypes?: SourceType[];
  requiredEvidenceLevel?: EvidenceLevel | null;
  dateConstraint?: string | null;
  language?: string | null;
  domainConstraints?: string[] | null;
}

export interface DiscoveryResult {
  query: DiscoveryQuery;
  candidates: SourceCandidate[];
  provider: string;
  discoveredAt: string;
}
