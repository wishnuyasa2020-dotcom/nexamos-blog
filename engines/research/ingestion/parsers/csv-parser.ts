/**
 * NexaMOS CSV and Tabular Data Parser
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { ContentParser } from './content-parser.ts';
import type { RawSourceInput, NormalizedSourceDocument, NormalizedSection, NormalizedTable } from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class CsvParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'CSV' || format === 'TABULAR_DATA';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;
    const title = input.title || 'Tabular Data Source';

    const { headers, rows } = this.parseCsv(raw);

    const tables: NormalizedTable[] = [];
    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        id: 'tbl-1',
        title: title,
        headers,
        rows,
        locator: {
          table: title
        }
      });
    }

    const sections: NormalizedSection[] = [];
    // Buat section ringkasan representatif
    const summaryText = `Dataset ${title} berisi ${rows.length} baris data dan ${headers.length} kolom: ${headers.join(', ')}.`;
    sections.push({
      id: 'sec-summary',
      heading: 'Dataset Summary',
      text: summaryText,
      order: 1,
      locator: {
        paragraph: 1
      }
    });

    // Tambahkan section baris data jika ada
    if (rows.length > 0) {
      const rowPreviews = rows.slice(0, 10).map((r, idx) => {
        return headers.length > 0
          ? `${idx + 1}. ` + headers.map((h, i) => `${h}: ${r[i] ?? ''}`).join('; ')
          : `${idx + 1}. ` + r.join(', ');
      });

      sections.push({
        id: 'sec-preview',
        heading: 'Data Sample Preview',
        text: rowPreviews.join('\n\n'),
        order: 2,
        locator: {
          paragraph: 2
        }
      });
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
        rowCount: rows.length,
        columnCount: headers.length,
        columns: headers,
        author: input.author || null,
        publisher: input.publisher || null,
        url: input.url || null,
        publicationDate: input.publicationDate || null
      },
      contentHash: hash,
      normalizedAt: new Date().toISOString()
    };
  }

  private parseCsv(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Deteksi delimiter: comma, semicolon, tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parsedLines: string[][] = lines.map((line) => this.parseCsvLine(line, delimiter));

    const headers = parsedLines[0] || [];
    const rows = parsedLines.slice(1);

    return { headers, rows };
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}
