/**
 * NexaMOS Markdown Parser Adapter
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Mempertahankan hierarki heading, paragraf, list, blockquote, dan tabel markdown.
 */

import type { ContentParser } from './content-parser.ts';
import type {
  RawSourceInput,
  NormalizedSourceDocument,
  NormalizedSection,
  NormalizedTable
} from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class MarkdownParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'MARKDOWN';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;

    // Ekstraksi title jika ada h1 pertama atau gunakan input.title
    let detectedTitle = input.title;
    const h1Match = raw.match(/^#\s+(.+)$/m);
    if (!detectedTitle && h1Match) {
      detectedTitle = h1Match[1].trim();
    }
    const title = detectedTitle || 'Untitled Markdown';

    const lines = raw.split('\n');
    const sections: NormalizedSection[] = [];
    const tables: NormalizedTable[] = [];

    let currentHeading: string | null = null;
    let currentParagraphs: string[] = [];
    let sectionOrder = 1;

    let inTable = false;
    let tableLines: string[] = [];
    let tableOrder = 1;

    const flushSection = () => {
      const text = currentParagraphs.join('\n\n').trim();
      if (text.length > 0) {
        sections.push({
          id: `sec-${sectionOrder}`,
          heading: currentHeading,
          text,
          order: sectionOrder,
          locator: {
            section: currentHeading || `Section ${sectionOrder}`
          }
        });
        sectionOrder++;
      }
      currentParagraphs = [];
    };

    const flushTable = () => {
      if (tableLines.length >= 2) {
        const parsed = this.parseMarkdownTable(tableLines, tableOrder, currentHeading);
        if (parsed) {
          tables.push(parsed);
          tableOrder++;
        }
      }
      tableLines = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Deteksi baris tabel markdown (e.g. | col1 | col2 |)
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          flushSection();
          inTable = true;
        }
        tableLines.push(line);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Deteksi heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushSection();
        currentHeading = headingMatch[2].trim();
        continue;
      }

      if (line.length > 0) {
        currentParagraphs.push(line);
      }
    }

    // Flush any remaining
    if (inTable) {
      flushTable();
    }
    flushSection();

    return {
      id: `norm-${sourceId}`,
      sourceId,
      researchProjectId: input.researchProjectId,
      title,
      format: 'MARKDOWN',
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

  private parseMarkdownTable(
    lines: string[],
    order: number,
    headingTitle?: string | null
  ): NormalizedTable | null {
    if (lines.length < 2) return null;

    // Header line
    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .slice(1, -1)
      .map((h) => h.trim());

    // Skip separator line (lines[1], e.g. |---|---|)
    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
      const rowLine = lines[i];
      const cells = rowLine
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    const title = headingTitle || `Table ${order}`;
    return {
      id: `tbl-${order}`,
      title,
      headers,
      rows,
      locator: {
        table: title
      }
    };
  }
}
