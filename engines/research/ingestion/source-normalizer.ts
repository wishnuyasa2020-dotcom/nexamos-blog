/**
 * NexaMOS Source Normalizer
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Melakukan sanitasi, penataan urutan section, perapian whitespace,
 * standarisasi locator, dan validasi struktur NormalizedSourceDocument.
 */

import type { NormalizedSourceDocument, NormalizedSection, NormalizedTable } from './source-ingestion.ts';

export class SourceNormalizer {
  normalize(doc: NormalizedSourceDocument): NormalizedSourceDocument {
    const cleanedSections = this.normalizeSections(doc.sections);
    const cleanedTables = this.normalizeTables(doc.tables);

    return {
      ...doc,
      title: (doc.title || 'Untitled Source').trim(),
      language: doc.language ? doc.language.trim().toLowerCase() : null,
      sections: cleanedSections,
      tables: cleanedTables,
      metadata: {
        ...(doc.metadata || {}),
        sanitizedAt: new Date().toISOString()
      }
    };
  }

  private normalizeSections(sections: NormalizedSection[]): NormalizedSection[] {
    return sections
      .map((sec, index) => {
        const cleanedText = (sec.text || '')
          .replace(/\r\n/g, '\n')
          .replace(/[\t ]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        const order = index + 1;
        return {
          id: sec.id || `sec-${order}`,
          heading: sec.heading ? sec.heading.trim() : null,
          text: cleanedText,
          order,
          locator: {
            section: sec.heading ? sec.heading.trim() : `Section ${order}`,
            paragraph: sec.locator?.paragraph ?? 1,
            page: sec.locator?.page ?? null
          }
        };
      })
      .filter((sec) => sec.text.length > 0);
  }

  private normalizeTables(tables: NormalizedTable[]): NormalizedTable[] {
    return tables.map((tbl, index) => {
      const headers = (tbl.headers || []).map((h) => h.trim());
      const rows = (tbl.rows || []).map((row) =>
        row.map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : ''))
      );

      return {
        id: tbl.id || `tbl-${index + 1}`,
        title: tbl.title ? tbl.title.trim() : `Table ${index + 1}`,
        headers,
        rows,
        locator: {
          table: tbl.title ? tbl.title.trim() : `Table ${index + 1}`,
          page: tbl.locator?.page ?? null
        }
      };
    });
  }
}
