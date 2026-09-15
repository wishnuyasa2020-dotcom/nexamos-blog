/**
 * NexaMOS JSON & Tabular Data Parser Adapter
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Mengurai struktur JSON generik atau array objek tabular ke NormalizedSourceDocument.
 */

import type { ContentParser } from './content-parser.ts';
import type {
  RawSourceInput,
  NormalizedSourceDocument,
  NormalizedSection,
  NormalizedTable
} from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class JsonParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'JSON' || format === 'TABULAR_DATA';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '{}';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;
    const title = input.title || 'JSON Data Document';

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Gagal mem-parse JSON payload: ${(e as Error).message}`);
    }

    const sections: NormalizedSection[] = [];
    const tables: NormalizedTable[] = [];

    if (Array.isArray(data)) {
      // Array of records -> NormalizedTable
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        const headers = Object.keys(data[0] as Record<string, unknown>);
        const rows = data.map((item) => {
          const rec = (item || {}) as Record<string, unknown>;
          return headers.map((h) => String(rec[h] ?? ''));
        });

        tables.push({
          id: 'tbl-1',
          title: title,
          headers,
          rows,
          locator: { table: title }
        });

        sections.push({
          id: 'sec-1',
          heading: 'Tabular Dataset Summary',
          text: `Dataset berisi ${data.length} baris dengan kolom: ${headers.join(', ')}.`,
          order: 1,
          locator: { section: 'Dataset Summary' }
        });
      } else {
        // Array of primitives
        sections.push({
          id: 'sec-1',
          heading: 'List Items',
          text: data.map((d, i) => `${i + 1}. ${String(d)}`).join('\n'),
          order: 1
        });
      }
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      let order = 1;
      for (const [key, val] of Object.entries(obj)) {
        let text = '';
        if (typeof val === 'object' && val !== null) {
          text = JSON.stringify(val, null, 2);
        } else {
          text = String(val);
        }

        sections.push({
          id: `sec-${order}`,
          heading: key,
          text,
          order,
          locator: { section: key }
        });
        order++;
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
      tables,
      metadata: {
        ...(input.metadata || {}),
        author: input.author || null,
        publisher: input.publisher || null,
        url: input.url || null,
        publicationDate: input.publicationDate || null
      },
      contentHash: hash,
      normalizedAt: new Date().toISOString()
    };
  }
}
