/**
 * NexaMOS Canonical Research Source Types & Hierarchy
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 2A specifications
 */

export type SourceType =
  | 'OFFICIAL_DOCUMENTATION'
  | 'GOVERNMENT'
  | 'REGULATOR'
  | 'ACADEMIC_PAPER'
  | 'PRIMARY_RESEARCH'
  | 'INDUSTRY_RESEARCH'
  | 'COMPANY_PUBLICATION'
  | 'NEWS'
  | 'EXPERT_ANALYSIS'
  | 'BOOK'
  | 'INTERVIEW'
  | 'DATASET'
  | 'INTERNAL_DATA'
  | 'INTERNAL_OBSERVATION'
  | 'INTERNAL_EXPERIMENT'
  | 'COMMUNITY_DISCUSSION'
  | 'OTHER';

export const SOURCE_TYPES: readonly SourceType[] = [
  'OFFICIAL_DOCUMENTATION',
  'GOVERNMENT',
  'REGULATOR',
  'ACADEMIC_PAPER',
  'PRIMARY_RESEARCH',
  'INDUSTRY_RESEARCH',
  'COMPANY_PUBLICATION',
  'NEWS',
  'EXPERT_ANALYSIS',
  'BOOK',
  'INTERVIEW',
  'DATASET',
  'INTERNAL_DATA',
  'INTERNAL_OBSERVATION',
  'INTERNAL_EXPERIMENT',
  'COMMUNITY_DISCUSSION',
  'OTHER'
] as const;

/**
 * Default Source Authority Hierarchy:
 * 1. Official / Primary authoritative source (Official docs, Government, Regulator, Internal primary)
 * 2. Primary research / Academic / Datasets
 * 3. High-quality independent empirical industry research
 * 4. Reputable industry analysis & Books
 * 5. Expert opinion & Interviews & News
 * 6. Community discussion & Other
 */
export const SOURCE_HIERARCHY_RANK: Record<SourceType, number> = {
  OFFICIAL_DOCUMENTATION: 1,
  GOVERNMENT: 1,
  REGULATOR: 1,
  INTERNAL_EXPERIMENT: 1,
  INTERNAL_DATA: 1,
  INTERNAL_OBSERVATION: 1,
  PRIMARY_RESEARCH: 2,
  ACADEMIC_PAPER: 2,
  DATASET: 2,
  INDUSTRY_RESEARCH: 3,
  BOOK: 4,
  EXPERT_ANALYSIS: 4,
  COMPANY_PUBLICATION: 4,
  NEWS: 5,
  INTERVIEW: 5,
  COMMUNITY_DISCUSSION: 6,
  OTHER: 7
};
