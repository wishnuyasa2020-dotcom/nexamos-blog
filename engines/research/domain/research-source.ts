/**
 * NexaMOS Canonical Research Source Entity
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 2A specifications
 * Definition: Dokumen, halaman, dataset, laporan, interview, observation,
 * atau material primer/sekunder rujukan riset.
 */

import type { SourceType } from './source-type.ts';
import type { SourceQualityAssessment } from './source-quality.ts';
import type { EvidenceLevel } from '../../ideation/domain/evidence-level.ts';

export type RecencyRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ResearchSource {
  id: string;
  researchProjectId: string;
  type: SourceType;
  title: string;
  publisher?: string | null;
  author?: string | null;
  url?: string | null; // Nullable untuk sumber internal/offline
  publicationDate?: string | null; // ISO Date / Year
  accessedAt?: string | null; // ISO 8601 string
  language?: string | null; // e.g. 'en', 'id'
  evidenceLevel: EvidenceLevel;
  qualityAssessment: SourceQualityAssessment;
  isPrimarySource: boolean;
  isInternal: boolean;
  recencyRisk?: RecencyRisk;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateResearchSourceInput = Omit<
  ResearchSource,
  'id' | 'researchProjectId' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
  researchProjectId?: string;
};
export type UpdateResearchSourceInput = Partial<CreateResearchSourceInput>;
