/**
 * NexaMOS JSON-LD Parser Adapter
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Mengekstrak entitas schema.org standar (Article, NewsArticle, BlogPosting,
 * Person, Organization, Dataset, WebPage) tanpa mengarang missing fields.
 */

import type { ContentParser } from './content-parser.ts';
import type {
  RawSourceInput,
  NormalizedSourceDocument,
  NormalizedSection
} from '../source-ingestion.ts';
import { computeContentHash } from '../content-hasher.ts';

export class JsonLdParser implements ContentParser {
  canParse(format: string): boolean {
    return format === 'JSON_LD';
  }

  async parse(input: RawSourceInput): Promise<NormalizedSourceDocument> {
    const raw = input.content || '{}';
    const hash = computeContentHash(raw);
    const sourceId = input.id || `src-${Date.now().toString(36)}`;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`Gagal mem-parse JSON-LD payload: ${(e as Error).message}`);
    }

    const type = (data['@type'] as string) || 'Thing';
    const headline = (data['headline'] as string) || (data['name'] as string) || input.title;
    const title = headline || `JSON-LD ${type}`;

    const sections: NormalizedSection[] = [];
    let order = 1;

    // 1. Header / Meta Section
    sections.push({
      id: `sec-${order}`,
      heading: 'Schema Metadata',
      text: `Entity Type: ${type}\nName: ${title}`,
      order,
      locator: { section: 'Metadata' }
    });
    order++;

    // 2. Description or abstract
    if (data['description']) {
      sections.push({
        id: `sec-${order}`,
        heading: 'Description',
        text: String(data['description']),
        order,
        locator: { section: 'Description' }
      });
      order++;
    }

    // 3. ArticleBody or text
    if (data['articleBody']) {
      sections.push({
        id: `sec-${order}`,
        heading: 'Article Body',
        text: String(data['articleBody']),
        order,
        locator: { section: 'ArticleBody' }
      });
      order++;
    }

    // 4. Author extraction
    let authorName: string | null = input.author || null;
    if (data['author']) {
      const authorObj = data['author'];
      if (typeof authorObj === 'string') {
        authorName = authorObj;
      } else if (typeof authorObj === 'object' && authorObj !== null) {
        authorName = ((authorObj as Record<string, unknown>)['name'] as string) || authorName;
      }
    }

    // 5. Publisher extraction
    let publisherName: string | null = input.publisher || null;
    if (data['publisher']) {
      const pubObj = data['publisher'];
      if (typeof pubObj === 'string') {
        publisherName = pubObj;
      } else if (typeof pubObj === 'object' && pubObj !== null) {
        publisherName = ((pubObj as Record<string, unknown>)['name'] as string) || publisherName;
      }
    }

    // 6. Publication date
    const datePublished =
      (data['datePublished'] as string) ||
      (data['dateModified'] as string) ||
      input.publicationDate ||
      null;

    return {
      id: `norm-${sourceId}`,
      sourceId,
      researchProjectId: input.researchProjectId,
      title,
      format: 'JSON_LD',
      language: (data['inLanguage'] as string) || input.language || null,
      sections,
      tables: [],
      metadata: {
        ...(input.metadata || {}),
        schemaType: type,
        author: authorName,
        publisher: publisherName,
        url: (data['url'] as string) || input.url || null,
        publicationDate: datePublished
      },
      contentHash: hash,
      normalizedAt: new Date().toISOString()
    };
  }
}
