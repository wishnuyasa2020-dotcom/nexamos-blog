/**
 * NexaMOS Canonical Article Types
 *
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 (Section 11)
 */

export type ArticleType =
  | 'EXPLAINER'
  | 'ANALYSIS'
  | 'ORIGINAL_RESEARCH'
  | 'FRAMEWORK'
  | 'CASE_STUDY'
  | 'OPINION'
  | 'COMPARATIVE_ANALYSIS'
  | 'HOW_TO'
  | 'TREND_ANALYSIS'
  | 'GLOSSARY'
  | 'REFERENCE';

export const ARTICLE_TYPES: readonly ArticleType[] = [
  'EXPLAINER',
  'ANALYSIS',
  'ORIGINAL_RESEARCH',
  'FRAMEWORK',
  'CASE_STUDY',
  'OPINION',
  'COMPARATIVE_ANALYSIS',
  'HOW_TO',
  'TREND_ANALYSIS',
  'GLOSSARY',
  'REFERENCE'
] as const;

/**
 * Editorial Priority order for establishing authority (Doctrine Section 11)
 */
export const ARTICLE_TYPE_AUTHORITY_PRIORITY: readonly ArticleType[] = [
  'ORIGINAL_RESEARCH',
  'FRAMEWORK',
  'CASE_STUDY',
  'ANALYSIS',
  'COMPARATIVE_ANALYSIS',
  'TREND_ANALYSIS',
  'OPINION',
  'HOW_TO',
  'EXPLAINER',
  'REFERENCE',
  'GLOSSARY'
] as const;
