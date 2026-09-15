/**
 * NexaMOS Source Ingestion & Normalization Contracts
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { SourceType } from '../domain/source-type.ts';
import type { EvidenceLocator } from '../domain/research-evidence.ts';

export type SourceFormat =
  | 'PLAIN_TEXT'
  | 'MARKDOWN'
  | 'HTML'
  | 'PDF_TEXT'
  | 'JSON'
  | 'JSON_LD'
  | 'CSV'
  | 'TABULAR_DATA'
  | 'INTERNAL_NOTE';

export const SOURCE_FORMATS: readonly SourceFormat[] = [
  'PLAIN_TEXT',
  'MARKDOWN',
  'HTML',
  'PDF_TEXT',
  'JSON',
  'JSON_LD',
  'CSV',
  'TABULAR_DATA',
  'INTERNAL_NOTE'
] as const;

export interface RawSourceInput {
  id?: string;
  researchProjectId: string;
  sourceType: SourceType;
  format: SourceFormat;
  content: string; // Payload raw/teks materialisasi
  title?: string | null;
  url?: string | null;
  publisher?: string | null;
  author?: string | null;
  publicationDate?: string | null;
  language?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NormalizedSection {
  id: string;
  heading?: string | null;
  text: string;
  order: number;
  locator?: EvidenceLocator | null;
}

export interface NormalizedTable {
  id: string;
  title?: string | null;
  headers: string[];
  rows: string[][];
  locator?: EvidenceLocator | null;
}

export interface NormalizedSourceDocument {
  id: string;
  sourceId: string;
  researchProjectId: string;
  title: string;
  format: SourceFormat;
  language?: string | null;
  sections: NormalizedSection[];
  tables: NormalizedTable[];
  metadata: Record<string, unknown>;
  contentHash: string;
  normalizedAt: string;
}
