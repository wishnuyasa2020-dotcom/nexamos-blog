/**
 * NexaMOS Research Brief Model
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Kontrak handoff antara Research Engine dan Editorial Generator (Phase 3).
 * Menjamin integritas sitasi dan ketersediaan bukti terverifikasi.
 */

import type { ResearchQuestion } from '../domain/research-question.ts';
import type { ResearchClaim } from '../domain/research-claim.ts';
import type { ResearchFinding } from '../domain/research-finding.ts';
import type { ResearchGap } from '../domain/research-gap.ts';
import type { SourceType } from '../domain/source-type.ts';
import type { EvidenceLevel } from '../../ideation/domain/evidence-level.ts';

export type ResearchBriefReadiness =
  | 'NOT_READY'
  | 'READY_FOR_EDITORIAL'
  | 'HUMAN_REVIEW_REQUIRED';

export interface ResearchBriefSourceEntry {
  sourceId: string;
  title: string;
  url?: string;
  canonicalUrl?: string;
  publisher?: string;
  publishedDate?: string;
  publicationAllowed?: boolean;
  sourceType: SourceType;
  authorityScore: number;
  freshnessStatus?: string;
}

export interface ResearchBriefEvidenceEntry {
  evidenceId: string;
  sourceId: string;
  quote: string;
  level: EvidenceLevel;
  verified: boolean;
}

export interface ResearchBrief {
  id: string;
  topicId: string;
  researchProjectId: string;
  objective: string;

  answeredQuestions: ResearchQuestion[];
  openQuestions: ResearchQuestion[];

  supportedClaims: ResearchClaim[];
  partiallySupportedClaims: ResearchClaim[];
  disputedClaims: ResearchClaim[];

  keyFindings: ResearchFinding[];
  limitations: string[];
  researchGaps: ResearchGap[];

  recommendedEditorialAngle?: string;

  sourceIndex: ResearchBriefSourceEntry[];
  evidenceIndex: ResearchBriefEvidenceEntry[];

  readiness: ResearchBriefReadiness;
  readinessReason?: string;
  generatedAt: string; // ISO 8601
}
