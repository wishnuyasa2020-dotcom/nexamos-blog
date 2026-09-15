/**
 * NexaMOS Deterministic Evidence Extractor
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Mengekstrak candidate evidence units dari dokumen ternormalisasi:
 * - STATISTIC: Deteksi angka persentase atau metrik terukur
 * - QUOTE: Deteksi kutipan tanda petik atau blockquote eksplisit
 * - TABLE_ROW: Ekstraksi baris tabel menjadi unit pembuktian
 * - DEFINITION: Deteksi pola definisi formal
 * - TEXT: Paragraf atau bagian naratif umum
 *
 * Jaminan: Extraction ≠ Verification. Ekstraksi mempertahankan provenance lengkap.
 */

import type { NormalizedSourceDocument, NormalizedSection, NormalizedTable } from './source-ingestion.ts';
import type { EvidenceLocator } from '../domain/research-evidence.ts';
import { computeContentHash } from './content-hasher.ts';

export type EvidenceCandidateType =
  | 'TEXT'
  | 'TABLE_ROW'
  | 'METADATA'
  | 'QUOTE'
  | 'STATISTIC'
  | 'DEFINITION';

export interface EvidenceProvenance {
  sourceId: string;
  sectionId?: string | null;
  tableId?: string | null;
  locator?: EvidenceLocator | null;
  rawContentHash: string;
}

export interface EvidenceCandidate {
  id: string;
  sourceId: string;
  researchProjectId: string;
  content: string;
  locator?: EvidenceLocator | null;
  candidateType: EvidenceCandidateType;
  provenance: EvidenceProvenance;
}

// Pola deteksi statistik (e.g. 58%, 95%, 300,000 keywords, 32% respondents, rasio 8% vs 15%)
const STATISTIC_REGEX = /(?:\b\d+(\.\d+)?%|\b\d{1,3}(,\d{3})+|\b\d+(\.\d+)?\s*(?:persen|percent|keywords|users|respondents|clicks|visits|growth|reduction|penurunan|pertumbuhan)\b)/i;

// Pola deteksi kutipan eksplisit
const QUOTE_REGEX = /(["“'][^"”']{10,}["”']|^>\s*["“']?[^"”'\n]{10,}["”']?)/m;

// Pola deteksi definisi (e.g. "adalah", "merupakan", "is defined as", "refers to")
const DEFINITION_REGEX = /\b(adalah|merupakan|didefinisikan sebagai|is defined as|refers to)\b/i;

export class EvidenceExtractor {
  extractCandidates(doc: NormalizedSourceDocument): EvidenceCandidate[] {
    const candidates: EvidenceCandidate[] = [];

    // 1. Ekstraksi dari sections (paragraf, kutipan, statistik, definisi)
    for (const sec of doc.sections) {
      const paragraphs = sec.text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
        const text = paragraphs[pIndex];
        if (text.length < 15) continue; // Abaikan teks trivial pendek

        const candidateType = this.classifyTextCandidate(text);
        const locator: EvidenceLocator = {
          section: sec.heading || `Section ${sec.order}`,
          paragraph: pIndex + 1,
          ...(sec.locator || {})
        };

        const hash = computeContentHash(text);
        const id = `evc-${doc.sourceId}-s${sec.order}-p${pIndex + 1}`;

        candidates.push({
          id,
          sourceId: doc.sourceId,
          researchProjectId: doc.researchProjectId,
          content: text,
          locator,
          candidateType,
          provenance: {
            sourceId: doc.sourceId,
            sectionId: sec.id,
            locator,
            rawContentHash: hash
          }
        });
      }
    }

    // 2. Ekstraksi dari tabel (baris tabel menjadi unit pembuktian)
    for (const tbl of doc.tables) {
      const headers = tbl.headers;
      for (let rIndex = 0; rIndex < tbl.rows.length; rIndex++) {
        const row = tbl.rows[rIndex];
        const rowContent = headers.length > 0
          ? headers.map((h, i) => `${h}: ${row[i] || '-'}`).join(' | ')
          : row.join(' | ');

        if (rowContent.trim().length === 0) continue;

        const locator: EvidenceLocator = {
          table: tbl.title || `Table ${tbl.id}`,
          page: tbl.locator?.page || null,
          paragraph: `Row ${rIndex + 1}`
        };

        const hash = computeContentHash(rowContent);
        const id = `evc-${doc.sourceId}-t${tbl.id}-r${rIndex + 1}`;

        candidates.push({
          id,
          sourceId: doc.sourceId,
          researchProjectId: doc.researchProjectId,
          content: rowContent,
          locator,
          candidateType: 'TABLE_ROW',
          provenance: {
            sourceId: doc.sourceId,
            tableId: tbl.id,
            locator,
            rawContentHash: hash
          }
        });
      }
    }

    return candidates;
  }

  private classifyTextCandidate(text: string): EvidenceCandidateType {
    if (QUOTE_REGEX.test(text)) {
      return 'QUOTE';
    }
    if (STATISTIC_REGEX.test(text)) {
      return 'STATISTIC';
    }
    if (DEFINITION_REGEX.test(text)) {
      return 'DEFINITION';
    }
    return 'TEXT';
  }
}
