/**
 * NexaMOS Canonical Research Finding Entity
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 2A specifications
 * Definition: Hasil/kesimpulan yang diperoleh setelah evidence dan claim dianalisis.
 * Finding bukan salinan mentah evidence; finding adalah sintesis analitis yang grounded.
 */

export type FindingConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ResearchFinding {
  id: string;
  researchProjectId: string;
  statement: string;
  supportingClaimIds: string[];
  confidence: FindingConfidence;
  limitations: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreateResearchFindingInput = Omit<
  ResearchFinding,
  'id' | 'researchProjectId' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
  researchProjectId?: string;
};
export type UpdateResearchFindingInput = Partial<CreateResearchFindingInput>;
