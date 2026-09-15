/**
 * NexaMOS Plain Text & Internal Note Parser
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { ContentParser } from './content-parser.ts';
import type { RawSourceInput, NormalizedSourceDocument, NormalizedSection } from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class PlainTextParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'PLAIN_TEXT' || format === 'INTERNAL_NOTE';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;
    const title = input.title || 'Untitled Plain Text';

    const rawSections = raw.split(/\n\s*\n/).filter((s) => s.trim().length > 0);
    const sections: NormalizedSection[] = rawSections.map((secText, idx) => ({
      id: `sec-${idx + 1}`,
      heading: null,
      text: secText.trim(),
      order: idx + 1,
      locator: {
        paragraph: idx + 1
      }
    }));

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
