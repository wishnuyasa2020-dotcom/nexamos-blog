/**
 * NexaMOS Source Deduplicator
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Mendeteksi duplikasi sumber secara deterministik:
 * - EXACT_DUPLICATE: Content hash sama persis
 * - LIKELY_DUPLICATE: Judul ternormalisasi, URL, dan tanggal publikasi identik
 * - UNIQUE: Sumber baru unik
 */

import type { ResearchSource } from '../domain/research-source.ts';
import type { NormalizedSourceDocument } from './source-ingestion.ts';
import { computeContentHash } from './content-hasher.ts';

export type DuplicateStatus = 'EXACT_DUPLICATE' | 'LIKELY_DUPLICATE' | 'UNIQUE';

export interface DuplicateCheckResult {
  status: DuplicateStatus;
  matchedSourceId?: string;
  reason?: string;
}

export class SourceDeduplicator {
  private knownContentHashes = new Map<string, string>(); // hash -> sourceId
  private knownSignatures = new Map<string, string>(); // signature -> sourceId

  registerSource(source: ResearchSource, rawContent?: string): void {
    if (rawContent) {
      const hash = computeContentHash(rawContent);
      this.knownContentHashes.set(hash, source.id);
    }
    const signature = this.computeSignature(source.title, source.url, source.publicationDate);
    if (signature) {
      this.knownSignatures.set(signature, source.id);
    }
  }

  check(doc: NormalizedSourceDocument, rawContent: string): DuplicateCheckResult {
    const hash = doc.contentHash || computeContentHash(rawContent);

    // 1. Exact duplicate check by content hash
    if (this.knownContentHashes.has(hash)) {
      const matchedSourceId = this.knownContentHashes.get(hash);
      return {
        status: 'EXACT_DUPLICATE',
        matchedSourceId,
        reason: `Konten identik ditemukan pada sumber '${matchedSourceId}' (Hash: ${hash.slice(0, 12)}...).`
      };
    }

    // 2. Likely duplicate check by title + url + pubDate
    const url = (doc.metadata?.url as string) || null;
    const pubDate = (doc.metadata?.publicationDate as string) || null;
    const signature = this.computeSignature(doc.title, url, pubDate);

    if (signature && this.knownSignatures.has(signature)) {
      const matchedSourceId = this.knownSignatures.get(signature);
      return {
        status: 'LIKELY_DUPLICATE',
        matchedSourceId,
        reason: `Metadata identik (judul, url, tanggal) cocok dengan sumber '${matchedSourceId}'.`
      };
    }

    return {
      status: 'UNIQUE'
    };
  }

  private computeSignature(
    title?: string | null,
    url?: string | null,
    pubDate?: string | null
  ): string | null {
    if (!title && !url) return null;
    const normTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normUrl = (url || '').toLowerCase().trim();
    const normDate = (pubDate || '').trim();
    return `${normTitle}|${normUrl}|${normDate}`;
  }

  clear(): void {
    this.knownContentHashes.clear();
    this.knownSignatures.clear();
  }
}
