/**
 * NexaMOS Topic Qualification Domain Types
 *
 * Sourced from NexaMOS Blog Phase 1B specifications
 */

export type GateStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export type QualificationGateId =
  | 'TERRITORY_FIT'
  | 'AUDIENCE_RELEVANCE'
  | 'KNOWLEDGE_VALUE'
  | 'EVIDENCE_FEASIBILITY'
  | 'NON_COMMODITY_POTENTIAL'
  | 'BUSINESS_RELEVANCE';

export const QUALIFICATION_GATES: readonly QualificationGateId[] = [
  'TERRITORY_FIT',
  'AUDIENCE_RELEVANCE',
  'KNOWLEDGE_VALUE',
  'EVIDENCE_FEASIBILITY',
  'NON_COMMODITY_POTENTIAL',
  'BUSINESS_RELEVANCE'
] as const;

export type QualificationDecision =
  | 'QUALIFIED'
  | 'RESEARCH_REQUIRED'
  | 'ON_HOLD'
  | 'REJECTED';

export const QUALIFICATION_DECISIONS: readonly QualificationDecision[] = [
  'QUALIFIED',
  'RESEARCH_REQUIRED',
  'ON_HOLD',
  'REJECTED'
] as const;

export interface GateEvaluation {
  gate: QualificationGateId;
  status: GateStatus;
  explanation: string;
}

export interface TopicQualificationResult {
  decision: QualificationDecision;
  gates: Record<QualificationGateId, GateEvaluation>;
  summary: string;
  qualifiedAt: string; // ISO 8601 string
  evaluatorVersion: string;
}
