/**
 * NexaMOS Information Gain & Originality Types
 *
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 (Section 4 & 5)
 */

export type OriginalityType =
  | 'ORIGINAL_RESEARCH'
  | 'ORIGINAL_DATA'
  | 'ORIGINAL_FRAMEWORK'
  | 'EXPERT_INTERPRETATION'
  | 'CASE_STUDY'
  | 'FIRST_HAND_OBSERVATION'
  | 'STRONG_POINT_OF_VIEW'
  | 'CROSS_THEORY_SYNTHESIS'
  | 'TIMELY_ANALYSIS'
  | 'PRACTICAL_DECISION_FRAMEWORK';

export const ORIGINALITY_TYPES: readonly OriginalityType[] = [
  'ORIGINAL_RESEARCH',
  'ORIGINAL_DATA',
  'ORIGINAL_FRAMEWORK',
  'EXPERT_INTERPRETATION',
  'CASE_STUDY',
  'FIRST_HAND_OBSERVATION',
  'STRONG_POINT_OF_VIEW',
  'CROSS_THEORY_SYNTHESIS',
  'TIMELY_ANALYSIS',
  'PRACTICAL_DECISION_FRAMEWORK'
] as const;

export type CommodityRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export const COMMODITY_RISKS: readonly CommodityRisk[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'UNKNOWN'
] as const;
