/**
 * NexaMOS Ingestion Result Model
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { ResearchSource } from '../domain/research-source.ts';
import type { ResearchEvidence } from '../domain/research-evidence.ts';
import type { NormalizedSourceDocument } from './source-ingestion.ts';
import type { EvidenceCandidate } from './evidence-extractor.ts';
import type { DuplicateStatus } from './source-deduplicator.ts';

export interface IngestionResult {
  source: ResearchSource;
  normalizedDocument: NormalizedSourceDocument;
  evidenceCandidates: EvidenceCandidate[];
  persistedEvidence: ResearchEvidence[];
  duplicateStatus: DuplicateStatus;
  ingestedAt: string;
}
