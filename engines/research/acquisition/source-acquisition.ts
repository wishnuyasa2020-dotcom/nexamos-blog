/**
 * NexaMOS Source Acquisition Contracts & MIME Helpers
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Menangani kontrak hasil akuisisi konten mentah dan pemetaan MIME types.
 */

import type { SourceCandidate } from './source-candidate.ts';
import type { RawSourceInput, SourceFormat } from '../ingestion/source-ingestion.ts';

export interface AcquisitionResult {
  candidate: SourceCandidate;
  rawSourceInput: RawSourceInput;
  providerName: string;
  acquiredAt: string;
  contentSizeBytes: number;
}

export interface AcquisitionOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  actor?: string;
}

export function mapMimeTypeToSourceFormat(
  contentTypeHeader?: string | null
): SourceFormat | 'PDF_BINARY_UNSUPPORTED' | null {
  if (!contentTypeHeader) return 'HTML'; // Default web format jika header tidak tertera

  const mime = contentTypeHeader.split(';')[0].trim().toLowerCase();

  if (mime === 'text/plain') return 'PLAIN_TEXT';
  if (mime === 'text/markdown') return 'MARKDOWN';
  if (mime === 'text/html') return 'HTML';
  if (mime === 'application/json') return 'JSON';
  if (mime === 'application/ld+json') return 'JSON_LD';
  if (mime === 'text/csv' || mime === 'application/csv') return 'CSV';
  if (mime === 'application/pdf') return 'PDF_BINARY_UNSUPPORTED';

  // Fallback heuristik jika mengandung html
  if (mime.includes('html')) return 'HTML';

  return null;
}
