/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 2B Unit Test Suite: Source Ingestion & Evidence Extraction Pipeline
 *
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { InMemoryResearchSourceRepository } from '../engines/research/repository/in-memory-research-source-repository.ts';
import { InMemoryResearchEvidenceRepository } from '../engines/research/repository/in-memory-research-evidence-repository.ts';
import { InMemoryResearchEventRepository } from '../engines/research/repository/in-memory-research-event-repository.ts';

import { PlainTextParser } from '../engines/research/ingestion/parsers/plain-text-parser.ts';
import { MarkdownParser } from '../engines/research/ingestion/parsers/markdown-parser.ts';
import { HtmlParser } from '../engines/research/ingestion/parsers/html-parser.ts';
import { JsonParser } from '../engines/research/ingestion/parsers/json-parser.ts';
import { JsonLdParser } from '../engines/research/ingestion/parsers/jsonld-parser.ts';
import { CsvParser } from '../engines/research/ingestion/parsers/csv-parser.ts';
import { PdfTextParser } from '../engines/research/ingestion/parsers/pdf-text-parser.ts';
import { ParserRegistry } from '../engines/research/ingestion/parsers/parser-registry.ts';

import { SourceNormalizer } from '../engines/research/ingestion/source-normalizer.ts';
import { SourceDeduplicator } from '../engines/research/ingestion/source-deduplicator.ts';
import { computeContentHash } from '../engines/research/ingestion/content-hasher.ts';
import { EvidenceExtractor } from '../engines/research/ingestion/evidence-extractor.ts';
import { ResearchIngestionService } from '../engines/research/ingestion/research-ingestion-service.ts';

import type { RawSourceInput } from '../engines/research/ingestion/source-ingestion.ts';

describe('Phase 2B Unit Tests: Source Ingestion & Evidence Extraction Pipeline', () => {
  let sourceRepo: InMemoryResearchSourceRepository;
  let evidenceRepo: InMemoryResearchEvidenceRepository;
  let eventRepo: InMemoryResearchEventRepository;
  let ingestionService: ResearchIngestionService;

  beforeEach(() => {
    sourceRepo = new InMemoryResearchSourceRepository();
    evidenceRepo = new InMemoryResearchEvidenceRepository();
    eventRepo = new InMemoryResearchEventRepository();

    ingestionService = new ResearchIngestionService({
      sourceRepo,
      evidenceRepo,
      eventRepo
    });
  });

  // ==========================================================================
  // 1. CONTENT PARSERS TESTS
  // ==========================================================================

  describe('1. Content Parsers Unit Tests', () => {
    test('PlainTextParser: splits paragraphs, computes hash, handles PLAIN_TEXT & INTERNAL_NOTE', async () => {
      const parser = new PlainTextParser();
      assert.strictEqual(parser.canParse('PLAIN_TEXT'), true);
      assert.strictEqual(parser.canParse('INTERNAL_NOTE'), true);
      assert.strictEqual(parser.canParse('MARKDOWN'), false);

      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'COMMUNITY_DISCUSSION',
        format: 'PLAIN_TEXT',
        title: 'User Interview Notes',
        content: 'First paragraph with some observations.\n\nSecond paragraph discussing search behaviors.'
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.title, 'User Interview Notes');
      assert.strictEqual(doc.sections.length, 2);
      assert.strictEqual(doc.sections[0].text, 'First paragraph with some observations.');
      assert.strictEqual(doc.sections[1].text, 'Second paragraph discussing search behaviors.');
      assert.strictEqual(typeof doc.contentHash, 'string');
      assert.strictEqual(doc.contentHash.length, 64);
    });

    test('MarkdownParser: extracts headings, blockquotes, and markdown tables', async () => {
      const parser = new MarkdownParser();
      assert.strictEqual(parser.canParse('MARKDOWN'), true);

      const mdContent = `# Introduction\n\nSome overview paragraph.\n\n> "A direct quote from industry leader."\n\n## Data Points\n\nOverview of search tool distributions:\n\n| Tool | Share |\n| --- | --- |\n| Tool A | 80% |\n| Tool B | 20% |`;
      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'INDUSTRY_RESEARCH',
        format: 'MARKDOWN',
        title: 'Market Report',
        content: mdContent
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.sections.length >= 2, true);
      assert.strictEqual(doc.tables.length, 1);
      assert.deepStrictEqual(doc.tables[0].headers, ['Tool', 'Share']);
      assert.strictEqual(doc.tables[0].rows.length, 2);
      assert.strictEqual(doc.tables[0].rows[0][0], 'Tool A');
      assert.strictEqual(doc.tables[0].rows[0][1], '80%');
    });

    test('HtmlParser: strips script/style tags, parses headings, paragraphs, and tables', async () => {
      const parser = new HtmlParser();
      assert.strictEqual(parser.canParse('HTML'), true);

      const htmlContent = `<html><head><style>body { color: red; }</style><script>alert(1);</script></head><body><h1>Guide</h1><p>Paragraph text.</p><blockquote>Notable quote.</blockquote><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>CTR</td><td>5%</td></tr></tbody></table></body></html>`;
      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'OFFICIAL_DOCUMENTATION',
        format: 'HTML',
        title: 'HTML Doc',
        content: htmlContent
      };

      const doc = await parser.parse(input);
      // Ensure scripts and styles are stripped
      for (const sec of doc.sections) {
        assert.strictEqual(sec.text.includes('alert(1)'), false);
        assert.strictEqual(sec.text.includes('color: red'), false);
      }
      assert.strictEqual(doc.tables.length, 1);
      assert.deepStrictEqual(doc.tables[0].headers, ['Metric', 'Value']);
      assert.strictEqual(doc.tables[0].rows[0][0], 'CTR');
    });

    test('JsonParser: parses generic JSON and tabular record arrays', async () => {
      const parser = new JsonParser();
      assert.strictEqual(parser.canParse('JSON'), true);

      const jsonRecords = JSON.stringify([
        { platform: 'SearchEngineX', share: '70%' },
        { platform: 'SearchEngineY', share: '30%' }
      ]);
      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'DATASET',
        format: 'JSON',
        title: 'Search Share JSON',
        content: jsonRecords
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.tables.length, 1);
      assert.deepStrictEqual(doc.tables[0].headers, ['platform', 'share']);
      assert.strictEqual(doc.tables[0].rows.length, 2);
      assert.strictEqual(doc.tables[0].rows[0][0], 'SearchEngineX');
    });

    test('JsonLdParser: extracts Schema.org NewsArticle attributes into sections and metadata', async () => {
      const parser = new JsonLdParser();
      assert.strictEqual(parser.canParse('JSON_LD'), true);

      const jsonld = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: 'AI Trends 2026',
        author: { '@type': 'Person', name: 'Dr. Jane Doe' },
        publisher: { '@type': 'Organization', name: 'Tech Insights' },
        datePublished: '2026-01-10',
        articleBody: 'Generative AI transforms search engine referral patterns.'
      });

      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'INDUSTRY_RESEARCH',
        format: 'JSON_LD',
        content: jsonld
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.title, 'AI Trends 2026');
      assert.strictEqual(doc.metadata.author, 'Dr. Jane Doe');
      assert.strictEqual(doc.metadata.publisher, 'Tech Insights');
      assert.strictEqual(doc.metadata.publicationDate, '2026-01-10');
      assert.strictEqual(doc.sections.some((s) => s.text.includes('Generative AI transforms')), true);
    });

    test('CsvParser: parses comma/semicolon/tab delimited records and quotes', async () => {
      const parser = new CsvParser();
      assert.strictEqual(parser.canParse('CSV'), true);
      assert.strictEqual(parser.canParse('TABULAR_DATA'), true);

      const csvContent = `Keyword,Search Volume,"CTR Drop, %"\n"ai seo overview",45000,-15.2%\n"information gain score",12000,-8.4%`;
      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'DATASET',
        format: 'CSV',
        title: 'Keyword CTR Benchmarks',
        content: csvContent
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.tables.length, 1);
      assert.deepStrictEqual(doc.tables[0].headers, ['Keyword', 'Search Volume', 'CTR Drop, %']);
      assert.strictEqual(doc.tables[0].rows.length, 2);
      assert.strictEqual(doc.tables[0].rows[0][0], 'ai seo overview');
      assert.strictEqual(doc.tables[0].rows[0][2], '-15.2%');
    });

    test('PdfTextParser: tracks page locators from page markers and detects headings', async () => {
      const parser = new PdfTextParser();
      assert.strictEqual(parser.canParse('PDF_TEXT'), true);

      const pdfText = `--- Page 1 ---\n1. Executive Summary\nFirst page content on search volume trends.\n\n--- Page 2 ---\n2. Citation Grounding\nSecond page content showing that 34% of citations fail grounding.`;
      const input: RawSourceInput = {
        researchProjectId: 'proj-1',
        sourceType: 'ACADEMIC_PAPER',
        format: 'PDF_TEXT',
        title: 'LLM Citation Study',
        content: pdfText
      };

      const doc = await parser.parse(input);
      assert.strictEqual(doc.sections.length >= 2, true);
      assert.strictEqual(doc.sections[0].locator?.page, 1);
      const page2Sec = doc.sections.find((s) => s.locator?.page === 2);
      assert.ok(page2Sec, 'Page 2 section should exist');
      assert.strictEqual(page2Sec?.heading?.includes('2. Citation Grounding'), true);
    });
  });

  // ==========================================================================
  // 2. PARSER REGISTRY & NORMALIZER TESTS
  // ==========================================================================

  describe('2. ParserRegistry and SourceNormalizer', () => {
    test('ParserRegistry: finds parser for supported formats and returns null for unknown', () => {
      const registry = new ParserRegistry();
      assert.ok(registry.getParser('PLAIN_TEXT'));
      assert.ok(registry.getParser('MARKDOWN'));
      assert.ok(registry.getParser('HTML'));
      assert.ok(registry.getParser('JSON'));
      assert.ok(registry.getParser('JSON_LD'));
      assert.ok(registry.getParser('CSV'));
      assert.ok(registry.getParser('PDF_TEXT'));
      assert.strictEqual(registry.getParser('UNKNOWN_FORMAT' as any), null);
    });

    test('SourceNormalizer: sanitizes whitespace and ensures sequential orders & locators', () => {
      const normalizer = new SourceNormalizer();
      const rawDoc = {
        id: 'norm-1',
        sourceId: 'src-1',
        researchProjectId: 'proj-1',
        title: '  Untrimmed Title  ',
        format: 'PLAIN_TEXT' as const,
        language: '  EN  ',
        sections: [
          {
            id: 'sec-a',
            heading: '  Heading 1  ',
            text: 'Text with    excessive   spaces\n\n\nand newlines.',
            order: 99
          }
        ],
        tables: [
          {
            id: 'tbl-1',
            title: '  Table 1  ',
            headers: ['  H1 ', ' H2  '],
            rows: [['  val1 ', ' val2 ']]
          }
        ],
        metadata: {},
        contentHash: 'dummy-hash',
        normalizedAt: new Date().toISOString()
      };

      const cleaned = normalizer.normalize(rawDoc);
      assert.strictEqual(cleaned.title, 'Untrimmed Title');
      assert.strictEqual(cleaned.language, 'en');
      assert.strictEqual(cleaned.sections[0].order, 1);
      assert.strictEqual(cleaned.sections[0].heading, 'Heading 1');
      assert.strictEqual(cleaned.sections[0].text, 'Text with excessive spaces\n\nand newlines.');
      assert.deepStrictEqual(cleaned.tables[0].headers, ['H1', 'H2']);
      assert.deepStrictEqual(cleaned.tables[0].rows[0], ['val1', 'val2']);
    });
  });

  // ==========================================================================
  // 3. DEDUPLICATION & PROVENANCE TESTS
  // ==========================================================================

  describe('3. Deduplication & Provenance Tests', () => {
    test('computeContentHash: produces stable, deterministic SHA-256 string', () => {
      const h1 = computeContentHash('Hello World');
      const h2 = computeContentHash('Hello World');
      const h3 = computeContentHash('Different Content');

      assert.strictEqual(h1, h2);
      assert.notStrictEqual(h1, h3);
      assert.strictEqual(h1.length, 64);
    });

    test('SourceDeduplicator: detects EXACT_DUPLICATE by content hash and LIKELY_DUPLICATE by metadata', () => {
      const deduplicator = new SourceDeduplicator();
      const rawText = 'Unique research content on search trends 2026.';
      const hash = computeContentHash(rawText);

      const existingSource = {
        id: 'src-original-001',
        researchProjectId: 'proj-1',
        type: 'INDUSTRY_RESEARCH' as const,
        title: 'Original Source Title',
        url: 'https://example.com/report',
        publicationDate: '2026-03-01',
        evidenceLevel: 'E2' as const,
        qualityAssessment: {
          authority: 80,
          relevance: 80,
          recency: 80,
          methodologicalTransparency: 80,
          independence: 80,
          verifiability: 80,
          qualitySummary: 'OK'
        },
        isPrimarySource: false,
        isInternal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      deduplicator.registerSource(existingSource, rawText);

      // Check exact duplicate
      const docExact = {
        id: 'norm-dup-1',
        sourceId: 'src-dup-1',
        researchProjectId: 'proj-1',
        title: 'Some other title',
        format: 'PLAIN_TEXT' as const,
        sections: [],
        tables: [],
        metadata: {},
        contentHash: hash,
        normalizedAt: new Date().toISOString()
      };
      const checkExact = deduplicator.check(docExact, rawText);
      assert.strictEqual(checkExact.status, 'EXACT_DUPLICATE');
      assert.strictEqual(checkExact.matchedSourceId, 'src-original-001');

      // Check likely duplicate (different content, but same title + url + pubDate)
      const docLikely = {
        id: 'norm-dup-2',
        sourceId: 'src-dup-2',
        researchProjectId: 'proj-1',
        title: 'Original Source Title',
        format: 'HTML' as const,
        sections: [],
        tables: [],
        metadata: {
          url: 'https://example.com/report',
          publicationDate: '2026-03-01'
        },
        contentHash: computeContentHash('completely different body text'),
        normalizedAt: new Date().toISOString()
      };
      const checkLikely = deduplicator.check(docLikely, 'completely different body text');
      assert.strictEqual(checkLikely.status, 'LIKELY_DUPLICATE');
      assert.strictEqual(checkLikely.matchedSourceId, 'src-original-001');

      // Check unique source
      const docUnique = {
        id: 'norm-unique',
        sourceId: 'src-unique',
        researchProjectId: 'proj-1',
        title: 'Brand New Study',
        format: 'PLAIN_TEXT' as const,
        sections: [],
        tables: [],
        metadata: { url: 'https://brand-new.org' },
        contentHash: computeContentHash('Brand new fresh content'),
        normalizedAt: new Date().toISOString()
      };
      const checkUnique = deduplicator.check(docUnique, 'Brand new fresh content');
      assert.strictEqual(checkUnique.status, 'UNIQUE');
    });
  });

  // ==========================================================================
  // 4. EVIDENCE EXTRACTOR UNIT TESTS
  // ==========================================================================

  describe('4. EvidenceExtractor Unit Tests', () => {
    test('EvidenceExtractor: extracts STATISTIC, QUOTE, DEFINITION, and TABLE_ROW candidates with provenance', () => {
      const extractor = new EvidenceExtractor();

      const doc = {
        id: 'norm-doc-1',
        sourceId: 'src-source-1',
        researchProjectId: 'proj-1',
        title: 'Multi-Evidence Source Document',
        format: 'MARKDOWN' as const,
        sections: [
          {
            id: 'sec-1',
            heading: 'Adoption and Shifts',
            text: 'A survey indicates that 58% of respondents have adopted conversational search engines.',
            order: 1,
            locator: { section: 'Adoption and Shifts', paragraph: 1 }
          },
          {
            id: 'sec-2',
            heading: 'Quotes and Perspectives',
            text: '> "Generative search replaces standard queries but demands verifiable source citations."',
            order: 2,
            locator: { section: 'Quotes and Perspectives', paragraph: 1 }
          },
          {
            id: 'sec-3',
            heading: 'Terminology',
            text: 'Information gain adalah metrik tambahan yang mengukur wawasan unik yang belum ada di dokumen lain.',
            order: 3,
            locator: { section: 'Terminology', paragraph: 1 }
          }
        ],
        tables: [
          {
            id: 'tbl-1',
            title: 'Market Shares',
            headers: ['Engine', 'Traffic Share'],
            rows: [
              ['Google', '89.2%'],
              ['Bing', '3.4%']
            ],
            locator: { table: 'Market Shares' }
          }
        ],
        metadata: {},
        contentHash: 'mock-doc-hash',
        normalizedAt: new Date().toISOString()
      };

      const candidates = extractor.extractCandidates(doc);
      assert.strictEqual(candidates.length, 5); // 3 from sections + 2 from table rows

      const statCandidate = candidates.find((c) => c.candidateType === 'STATISTIC');
      assert.ok(statCandidate);
      assert.strictEqual(statCandidate?.content.includes('58%'), true);
      assert.strictEqual(statCandidate?.provenance.sourceId, 'src-source-1');
      assert.strictEqual(typeof statCandidate?.provenance.rawContentHash, 'string');

      const quoteCandidate = candidates.find((c) => c.candidateType === 'QUOTE');
      assert.ok(quoteCandidate);
      assert.strictEqual(quoteCandidate?.content.includes('Generative search replaces'), true);

      const defCandidate = candidates.find((c) => c.candidateType === 'DEFINITION');
      assert.ok(defCandidate);
      assert.strictEqual(defCandidate?.content.includes('Information gain adalah'), true);

      const tableRows = candidates.filter((c) => c.candidateType === 'TABLE_ROW');
      assert.strictEqual(tableRows.length, 2);
      assert.strictEqual(tableRows[0].content, 'Engine: Google | Traffic Share: 89.2%');
      assert.strictEqual(tableRows[0].locator?.table, 'Market Shares');
    });
  });

  // ==========================================================================
  // 5. INGESTION SERVICE FULL PIPELINE & FIXTURE TESTS
  // ==========================================================================

  describe('5. Ingestion Service Full Pipeline & Canonical Fixtures', () => {
    test('Ingests Plain Text fixture (Pew Research Center)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/plain-text.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.source.type, 'PRIMARY_RESEARCH');
      assert.strictEqual(res.value.source.evidenceLevel, 'E1');
      assert.strictEqual(res.value.duplicateStatus, 'UNIQUE');
      assert.strictEqual(res.value.evidenceCandidates.length >= 2, true);
      assert.strictEqual(res.value.persistedEvidence.length, res.value.evidenceCandidates.length);

      // Verify saved in repository
      const savedSource = await sourceRepo.getById(res.value.source.id);
      assert.ok(savedSource);
      assert.strictEqual(savedSource?.title, fixtureRaw.title);
    });

    test('Ingests Markdown fixture (Similarweb Search Engine Share)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/markdown.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.source.type, 'INDUSTRY_RESEARCH');
      assert.strictEqual(res.value.source.evidenceLevel, 'E2');
      assert.strictEqual(res.value.normalizedDocument.tables.length, 1);
      assert.strictEqual(res.value.normalizedDocument.tables[0].rows.length, 4);

      // Check extracted table rows as candidate evidence
      const tableRowEv = res.value.evidenceCandidates.filter((c) => c.candidateType === 'TABLE_ROW');
      assert.strictEqual(tableRowEv.length, 4);
    });

    test('Ingests HTML fixture (Google Search Central Guidelines)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/html.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.source.type, 'OFFICIAL_DOCUMENTATION');
      assert.strictEqual(res.value.source.evidenceLevel, 'E2');
      assert.strictEqual(res.value.source.isPrimarySource, true);
      assert.strictEqual(res.value.normalizedDocument.tables.length, 1);
    });

    test('Ingests JSON-LD fixture (Gartner Search Volume Prediction)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/jsonld.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.source.publisher, 'Gartner Research');
      assert.strictEqual(res.value.source.author, 'Alan Antin');
      assert.strictEqual(res.value.source.publicationDate, '2024-02-19');
    });

    test('Ingests CSV fixture (Ahrefs CTR Benchmarks)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/csv.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.normalizedDocument.tables.length, 1);
      assert.strictEqual(res.value.normalizedDocument.tables[0].headers.length, 4);
      assert.strictEqual(res.value.normalizedDocument.tables[0].rows.length, 5);

      const tableCandidates = res.value.evidenceCandidates.filter((c) => c.candidateType === 'TABLE_ROW');
      assert.strictEqual(tableCandidates.length, 5);
    });

    test('Ingests PDF Text fixture (Stanford Citation Study)', async () => {
      const fixturePath = path.resolve('data/research/ingestion-fixtures/pdf-text.json');
      const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const res = await ingestionService.ingest(fixtureRaw);
      assert.strictEqual(res.ok, true);
      if (!res.ok) return;

      assert.strictEqual(res.value.source.type, 'ACADEMIC_PAPER');
      assert.strictEqual(res.value.source.evidenceLevel, 'E1');
      const p1Candidates = res.value.evidenceCandidates.filter((c) => c.locator?.page === 1);
      const p2Candidates = res.value.evidenceCandidates.filter((c) => c.locator?.page === 2);
      assert.strictEqual(p1Candidates.length > 0, true);
      assert.strictEqual(p2Candidates.length > 0, true);
    });

    test('Audit events: records full audit trail across ingestion steps', async () => {
      const input: RawSourceInput = {
        researchProjectId: 'proj-audit-test',
        sourceType: 'COMMUNITY_DISCUSSION',
        format: 'PLAIN_TEXT',
        title: 'Community Feedback',
        content: 'Users prefer 100% human-verified editorial content over pure AI outputs.'
      };

      const res = await ingestionService.ingest(input);
      assert.strictEqual(res.ok, true);

      const events = await eventRepo.listByProjectId('proj-audit-test');
      const types = events.map((e) => e.type);

      assert.strictEqual(types.includes('SOURCE_INGESTION_STARTED'), true);
      assert.strictEqual(types.includes('SOURCE_PARSED'), true);
      assert.strictEqual(types.includes('SOURCE_INGESTED'), true);
      assert.strictEqual(types.includes('EVIDENCE_EXTRACTION_STARTED'), true);
      assert.strictEqual(types.includes('EVIDENCE_EXTRACTED'), true);
    });

    test('Validation failure: rejects empty content, missing project, and unsupported format', async () => {
      const emptyContentRes = await ingestionService.ingest({
        researchProjectId: 'proj-1',
        sourceType: 'NEWS',
        format: 'PLAIN_TEXT',
        content: ''
      });
      assert.strictEqual(emptyContentRes.ok, false);
      if (!emptyContentRes.ok) {
        assert.strictEqual(emptyContentRes.error.code, 'INVALID_SOURCE_INPUT');
      }

      const missingProjRes = await ingestionService.ingest({
        researchProjectId: '',
        sourceType: 'NEWS',
        format: 'PLAIN_TEXT',
        content: 'Some valid text.'
      });
      assert.strictEqual(missingProjRes.ok, false);
      if (!missingProjRes.ok) {
        assert.strictEqual(missingProjRes.error.code, 'INVALID_SOURCE_INPUT');
      }

      const badFormatRes = await ingestionService.ingest({
        researchProjectId: 'proj-1',
        sourceType: 'NEWS',
        format: 'UNSUPPORTED_FORMAT' as any,
        content: 'Some valid text.'
      });
      assert.strictEqual(badFormatRes.ok, false);
      if (!badFormatRes.ok) {
        assert.strictEqual(badFormatRes.error.code, 'UNSUPPORTED_SOURCE_FORMAT');
      }
    });

    test('Duplicate handling: handles exact duplicate idempotently or rejects if requested', async () => {
      const input: RawSourceInput = {
        researchProjectId: 'proj-dup-test',
        sourceType: 'INDUSTRY_RESEARCH',
        format: 'PLAIN_TEXT',
        title: 'Duplicate Testing Article',
        content: 'This exact sentence will be submitted twice to test deduplication idempotency.'
      };

      // Ingest 1st time
      const res1 = await ingestionService.ingest(input);
      assert.strictEqual(res1.ok, true);
      if (!res1.ok) return;
      assert.strictEqual(res1.value.duplicateStatus, 'UNIQUE');

      // Ingest 2nd time (default: idempotent, returns EXACT_DUPLICATE status and existing source)
      const res2 = await ingestionService.ingest(input);
      assert.strictEqual(res2.ok, true);
      if (!res2.ok) return;
      assert.strictEqual(res2.value.duplicateStatus, 'EXACT_DUPLICATE');
      assert.strictEqual(res2.value.source.id, res1.value.source.id);

      // Ingest 3rd time with rejectDuplicates: true
      const res3 = await ingestionService.ingest(input, { rejectDuplicates: true });
      assert.strictEqual(res3.ok, false);
      if (!res3.ok) {
        assert.strictEqual(res3.error.code, 'DUPLICATE_SOURCE');
      }
    });
  });
});
