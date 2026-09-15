/**
 * NexaMOS Opportunity Priority Domain Types
 *
 * Sourced from NexaMOS Blog Phase 1B specifications
 */

export type PriorityClass = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BACKLOG';

export const PRIORITY_CLASSES: readonly PriorityClass[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'BACKLOG'
] as const;

export interface PriorityDimensions {
  strategicValue: number; // 0 - 100
  audienceValue: number; // 0 - 100
  differentiationPotential: number; // 0 - 100
  timeliness: number; // 0 - 100
  evidenceReadiness: number; // 0 - 100
}

export interface PriorityWeights {
  strategicValue: number; // default 0.25
  audienceValue: number; // default 0.25
  differentiationPotential: number; // default 0.25
  timeliness: number; // default 0.15
  evidenceReadiness: number; // default 0.10
}

export const DEFAULT_PRIORITY_WEIGHTS_V1: PriorityWeights = {
  strategicValue: 0.25,
  audienceValue: 0.25,
  differentiationPotential: 0.25,
  timeliness: 0.15,
  evidenceReadiness: 0.10
};

export const TOPIC_PRIORITY_POLICY_V1 = 'TOPIC_PRIORITY_V1';

export interface OpportunityScoringOutput {
  dimensions: PriorityDimensions;
  weights: PriorityWeights;
  weightedValues: PriorityDimensions;
  overall: number; // 0 - 100, rounded
  priorityClass: PriorityClass;
  scoringPolicyVersion: string;
  scoredAt: string; // ISO 8601 string
  summary: string;
}
