/**
 * NexaMOS Content Parser Registry
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { ContentParser } from './content-parser.ts';
import type { SourceFormat } from '../source-ingestion.ts';
import { PlainTextParser } from './plain-text-parser.ts';
import { MarkdownParser } from './markdown-parser.ts';
import { HtmlParser } from './html-parser.ts';
import { JsonParser } from './json-parser.ts';
import { JsonLdParser } from './jsonld-parser.ts';
import { CsvParser } from './csv-parser.ts';
import { PdfTextParser } from './pdf-text-parser.ts';

export class ParserRegistry {
  private parsers: ContentParser[] = [];

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.parsers.push(
      new PlainTextParser(),
      new MarkdownParser(),
      new HtmlParser(),
      new JsonParser(),
      new JsonLdParser(),
      new CsvParser(),
      new PdfTextParser()
    );
  }

  registerParser(parser: ContentParser): void {
    this.parsers.unshift(parser); // Beri prioritas lebih tinggi jika ada custom parser
  }

  getParser(format: SourceFormat | string): ContentParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(format)) {
        return parser;
      }
    }
    return null;
  }

  hasParser(format: SourceFormat | string): boolean {
    return this.getParser(format) !== null;
  }
}
