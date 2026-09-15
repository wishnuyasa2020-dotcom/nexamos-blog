/**
 * NexaMOS Article Section Model
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3A specifications
 * Bagian modular pembentuk struktur naskah artikel berbobot.
 */

export type ArticleSectionPurpose =
  | 'HOOK'
  | 'CONTEXT'
  | 'ARGUMENT'
  | 'EVIDENCE'
  | 'FRAMEWORK'
  | 'ANALYSIS'
  | 'COUNTERPOINT'
  | 'IMPLICATION'
  | 'PRACTICAL_APPLICATION'
  | 'CONCLUSION';

export const ARTICLE_SECTION_PURPOSES: readonly ArticleSectionPurpose[] = [
  'HOOK',
  'CONTEXT',
  'ARGUMENT',
  'EVIDENCE',
  'FRAMEWORK',
  'ANALYSIS',
  'COUNTERPOINT',
  'IMPLICATION',
  'PRACTICAL_APPLICATION',
  'CONCLUSION'
] as const;

export interface ArticleSection {
  id: string;
  heading?: string | null;
  purpose: ArticleSectionPurpose;
  content: string;
  order: number;
  claimUsageIds: string[];
}
