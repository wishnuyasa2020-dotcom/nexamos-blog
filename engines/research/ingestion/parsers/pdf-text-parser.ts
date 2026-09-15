/**
 * NexaMOS PDF Text Parser
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Menguraikan teks hasil ekstraksi PDF (pre-extracted text) yang memiliki page markers
 * atau form feed separator. Tidak melakukan binary parsing / OCR.
 */

import type { ContentParser } from './content-parser.ts';
import type { RawSourceInput, NormalizedSourceDocument, NormalizedSection } from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class PdfTextParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'PDF_TEXT';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;
    const title = input.title || 'PDF Document';

    const sections: NormalizedSection[] = [];

    // Split berdasarkan form feed (\f) atau marker eksplisit seperti "--- Page X ---", "[Page X]"
    const pageMarkerRegex = /(?:^|\n)(?:---+\s*Page\s+(\d+)\s*---+|\[Page\s+(\d+)\]|Page\s+(\d+)\s+of\s+\d+|\f)/i;

    // Jika memiliki form feed atau page marker
    const rawPages = raw.split(pageMarkerRegex).filter((p) => p !== undefined);

    let currentPage = 1;
    let sectionOrder = 1;

    // Jika page markers ditemukan
    if (rawPages.length > 1) {
      for (let i = 0; i < rawPages.length; i++) {
        const chunk = rawPages[i].trim();
        if (!chunk) continue;

        // Jika chunk hanyalah nomor halaman dari capturing group
        if (/^\d+$/.test(chunk)) {
          currentPage = parseInt(chunk, 10);
          continue;
        }

        const paragraphs = chunk.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
          const paraText = paragraphs[pIdx].trim();
          const heading = this.detectHeading(paraText);

          sections.push({
            id: `sec-p${currentPage}-${pIdx + 1}`,
            heading: heading || null,
            text: paraText,
            order: sectionOrder++,
            locator: {
              page: currentPage,
              paragraph: pIdx + 1
            }
          });
        }
      }
    } else {
      // Tidak ada page marker terdeteksi, bagi berdasarkan paragraf biasa
      const paragraphs = raw.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      for (let idx = 0; idx < paragraphs.length; idx++) {
        const paraText = paragraphs[idx].trim();
        const heading = this.detectHeading(paraText);

        sections.push({
          id: `sec-${idx + 1}`,
          heading: heading || null,
          text: paraText,
          order: idx + 1,
          locator: {
            page: 1,
            paragraph: idx + 1
          }
        });
      }
    }

    return {
      id: `norm-${sourceId}`,
      sourceId,
      researchProjectId: input.researchProjectId,
      title,
      format: input.format,
      language: input.language || null,
      sections,
      tables: [],
      metadata: {
        ...(input.metadata || {}),
        detectedPages: currentPage,
        author: input.author || null,
        publisher: input.publisher || null,
        url: input.url || null,
        publicationDate: input.publicationDate || null
      },
      contentHash: hash,
      normalizedAt: new Date().toISOString()
    };
  }

  private detectHeading(text: string): string | null {
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 80) {
      // Cek pola numbering seperti "1. Introduction", "2.1 Metodologi", "Executive Summary"
      if (/^(\d+(\.\d+)*\.?\s+[A-Z]|[A-Z\s]{4,})/m.test(firstLine)) {
        return firstLine;
      }
    }
    return null;
  }
}
