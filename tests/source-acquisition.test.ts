/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 2C Unit Test Suite: Source Discovery & Research Acquisition
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

import { DiscoveryQueryBuilder } from '../engines/research/acquisition/discovery-query-builder.ts';
import { FreshnessEvaluator } from '../engines/research/acquisition/freshness-evaluator.ts';
import { AuthorityEvaluator } from '../engines/research/acquisition/authority-evaluator.ts';
import { SourceCandidateEvaluator } from '../engines/research/acquisition/source-candidate-evaluator.ts';
import { SourceSecurityValidator } from '../engines/research/acquisition/source-fetcher.ts';
import { SourceDiversityChecker } from '../engines/research/acquisition/source-diversity-checker.ts';
import { BudgetTracker } from '../engines/research/acquisition/research-budget-policy.ts';

import { MockResearchDiscoveryProvider } from '../engines/research/acquisition/providers/mock-discovery-provider.ts';
import { MockSourceAcquisitionProvider } from '../engines/research/acquisition/providers/mock-acquisition-provider.ts';
import { HttpSourceAcquisitionProvider } from '../engines/research/acquisition/providers/http-source-acquisition-provider.ts';

import { ResearchIngestionService } from '../engines/research/ingestion/research-ingestion-service.ts';
import { ResearchAcquisitionService } from '../engines/research/acquisition/research-acquisition-service.ts';

import type { ResearchQuestion } from '../engines/research/domain/research-question.ts';
import type { SourceCandidate } from '../engines/research/acquisition/source-candidate.ts';
import type { DiscoveryQuery } from '../engines/research/acquisition/source-discovery.ts';

describe('Phase 2C Unit Tests: Source Discovery & Research Acquisition', () => {
  let sourceRepo: InMemoryResearchSourceRepository;
  let evidenceRepo: InMemoryResearchEvidenceRepository;
  let eventRepo: InMemoryResearchEventRepository;
  let ingestionService: ResearchIngestionService;

  let discoveryProvider: MockResearchDiscoveryProvider;
  let acquisitionProvider: MockSourceAcquisitionProvider;
  let acquisitionService: ResearchAcquisitionService;

  const sampleQuestion: ResearchQuestion = {
    id: 'rq-seo-ai-001',
    question: 'Apakah SEO masih relevan untuk generative AI search?',
    priority: 'HIGH',
    status: 'OPEN'
  };

  beforeEach(() => {
    sourceRepo = new InMemoryResearchSourceRepository();
    evidenceRepo = new InMemoryResearchEvidenceRepository();
    eventRepo = new InMemoryResearchEventRepository();

    ingestionService = new ResearchIngestionService({
      sourceRepo,
      evidenceRepo,
      eventRepo
    });

    discoveryProvider = new MockResearchDiscoveryProvider();
    acquisitionProvider = new MockSourceAcquisitionProvider();

    acquisitionService = new ResearchAcquisitionService({
      discoveryProvider,
      acquisitionProvider,
      ingestionService,
      eventRepo,
      sourceRepo
    });
  });

  // ==========================================================================
  // 1. QUERY BUILDER TESTS
  // ==========================================================================

  describe('1. Discovery Query Builder', () => {
    const builder = new DiscoveryQueryBuilder();

    test('buildQueries: generates primary source query from research question', () => {
      const queries = builder.buildQueries(sampleQuestion, [], { projectId: 'proj-1' });
      assert.strictEqual(queries.length > 0, true);

      const primaryQuery = queries.find((q) => q.intent === 'FIND_PRIMARY_SOURCE');
      assert.ok(primaryQuery, 'Harus menghasilkan query dengan intent FIND_PRIMARY_SOURCE');
      assert.strictEqual(primaryQuery?.query.includes('official documentation'), true);
      assert.strictEqual(primaryQuery?.researchQuestionId, 'rq-seo-ai-001');
    });

    test('buildQueries: generates counter-evidence query when MISSING_COUNTER_EVIDENCE gap present', () => {
      const gaps = [
        {
          type: 'MISSING_COUNTER_EVIDENCE' as const,
          description: 'Belum ada bukti tandingan yang menentang relevansi SEO.',
          questionId: 'rq-seo-ai-001'
        }
      ];

      const queries = builder.buildQueries(sampleQuestion, gaps, { projectId: 'proj-1' });
      const counterQuery = queries.find((q) => q.intent === 'FIND_COUNTER_EVIDENCE');
      assert.ok(counterQuery, 'Harus merumuskan query FIND_COUNTER_EVIDENCE');
      assert.strictEqual(
        counterQuery?.query.includes('criticism') || counterQuery?.query.includes('debunked'),
        true
      );
    });

    test('buildQueries: generates current-data query when MISSING_CURRENT_DATA gap present', () => {
      const gaps = [
        {
          type: 'MISSING_CURRENT_DATA' as const,
          description: 'Data statistik terbaru masih kurang.',
          questionId: 'rq-seo-ai-001'
        }
      ];

      const queries = builder.buildQueries(sampleQuestion, gaps, { projectId: 'proj-1' });
      const currentQuery = queries.find((q) => q.intent === 'FIND_CURRENT_DATA');
      assert.ok(currentQuery, 'Harus merumuskan query FIND_CURRENT_DATA');
      assert.strictEqual(currentQuery?.query.includes('benchmark'), true);
    });
  });

  // ==========================================================================
  // 2. FRESHNESS EVALUATOR TESTS
  // ==========================================================================

  describe('2. Freshness Evaluator', () => {
    const evaluator = new FreshnessEvaluator();
    const mockNow = new Date('2026-03-01T00:00:00.000Z');

    test('HIGH volatility domain: source > 2 years is STALE, <= 1 year is CURRENT', () => {
      const freshRes = evaluator.evaluate({
        publicationDate: '2025-08-01',
        topicVolatility: 'HIGH',
        currentDate: mockNow
      });
      assert.strictEqual(freshRes.status, 'CURRENT');

      const staleRes = evaluator.evaluate({
        publicationDate: '2023-01-01',
        topicVolatility: 'HIGH',
        currentDate: mockNow
      });
      assert.strictEqual(staleRes.status, 'STALE');
    });

    test('LOW volatility domain: 4-year-old foundational source remains CURRENT/AGING (not stale)', () => {
      const lowVolRes = evaluator.evaluate({
        publicationDate: '2022-01-01', // ~4 years old
        topicVolatility: 'LOW',
        currentDate: mockNow
      });
      assert.strictEqual(lowVolRes.status === 'CURRENT' || lowVolRes.status === 'AGING', true);
      assert.notStrictEqual(lowVolRes.status, 'STALE');
    });

    test('Missing / invalid publication date returns UNKNOWN safely without crashing', () => {
      const unknownRes1 = evaluator.evaluate({
        publicationDate: null,
        topicVolatility: 'MEDIUM',
        currentDate: mockNow
      });
      assert.strictEqual(unknownRes1.status, 'UNKNOWN');

      const unknownRes2 = evaluator.evaluate({
        publicationDate: 'not-a-valid-date',
        topicVolatility: 'MEDIUM',
        currentDate: mockNow
      });
      assert.strictEqual(unknownRes2.status, 'UNKNOWN');
    });
  });

  // ==========================================================================
  // 3. AUTHORITY & CANDIDATE EVALUATION TESTS
  // ==========================================================================

  describe('3. Authority & Candidate Evaluation', () => {
    const candidateEvaluator = new SourceCandidateEvaluator();

    const mockQuery: DiscoveryQuery = {
      id: 'dq-test-01',
      researchProjectId: 'proj-1',
      researchQuestionId: 'rq-01',
      query: 'generative AI search SEO documentation',
      intent: 'FIND_PRIMARY_SOURCE',
      preferredSourceTypes: ['OFFICIAL_DOCUMENTATION', 'PRIMARY_RESEARCH'],
      createdAt: '2026-03-01T00:00:00.000Z'
    };

    test('Authoritative, relevant, and fresh candidate is ACCEPTED', () => {
      const candidate: SourceCandidate = {
        id: 'cand-01',
        queryId: 'dq-test-01',
        researchProjectId: 'proj-1',
        title: 'Google Search Central: Creating Helpful Content with AI',
        url: 'https://developers.google.com/search/docs/helpful-content',
        snippet: 'Guidelines on generative AI search and SEO documentation.',
        publisher: 'Google LLC',
        author: 'Search Team',
        publicationDate: '2025-10-01',
        sourceType: 'OFFICIAL_DOCUMENTATION',
        provider: 'MockSearch',
        status: 'DISCOVERED',
        discoveredAt: '2026-03-01T00:00:00.000Z'
      };

      const result = candidateEvaluator.evaluate(candidate, {
        query: mockQuery,
        topicVolatility: 'HIGH',
        currentDate: new Date('2026-03-01')
      });

      assert.strictEqual(result.decision, 'ACCEPT');
      assert.strictEqual(result.authorityAssessment.score >= 80, true);
      assert.strictEqual(result.isDuplicate, false);
    });

    test('Irrelevant candidate is REJECTED', () => {
      const candidate: SourceCandidate = {
        id: 'cand-02',
        queryId: 'dq-test-01',
        researchProjectId: 'proj-1',
        title: 'Cooking Recipe for Chocolate Brownies',
        url: 'https://cookingblog.com/brownies',
        snippet: 'Delicious baking recipe completely unrelated to search engines.',
        publisher: 'Cooking Blog',
        publicationDate: '2025-10-01',
        sourceType: 'COMMUNITY_DISCUSSION',
        provider: 'MockSearch',
        status: 'DISCOVERED',
        discoveredAt: '2026-03-01T00:00:00.000Z'
      };

      const result = candidateEvaluator.evaluate(candidate, {
        query: mockQuery,
        topicVolatility: 'HIGH',
        currentDate: new Date('2026-03-01')
      });

      assert.strictEqual(result.decision, 'REJECT');
      assert.strictEqual(result.relevanceScore < 40, true);
    });

    test('Stale candidate on HIGH volatility topic produces REVIEW_REQUIRED', () => {
      const candidate: SourceCandidate = {
        id: 'cand-03',
        queryId: 'dq-test-01',
        researchProjectId: 'proj-1',
        title: 'Search Engine Architecture BERT Update',
        url: 'https://authoritative-research.org/bert',
        snippet: 'Discussion on search algorithm updates and SEO relevance.',
        publisher: 'ACM Press',
        publicationDate: '2020-01-01', // 6 years old
        sourceType: 'ACADEMIC_PAPER',
        provider: 'MockSearch',
        status: 'DISCOVERED',
        discoveredAt: '2026-03-01T00:00:00.000Z'
      };

      const result = candidateEvaluator.evaluate(candidate, {
        query: mockQuery,
        topicVolatility: 'HIGH',
        currentDate: new Date('2026-03-01')
      });

      assert.strictEqual(result.decision, 'REVIEW_REQUIRED');
      assert.strictEqual(result.freshnessAssessment.status, 'STALE');
    });

    test('Pre-acquisition duplication detection flags duplicate URLs or titles', () => {
      const candidate: SourceCandidate = {
        id: 'cand-04',
        queryId: 'dq-test-01',
        researchProjectId: 'proj-1',
        title: 'Existing Source in Database',
        url: 'https://known-source.org/report',
        sourceType: 'INDUSTRY_RESEARCH',
        provider: 'MockSearch',
        status: 'DISCOVERED',
        discoveredAt: '2026-03-01T00:00:00.000Z'
      };

      const knownUrls = new Set(['https://known-source.org/report']);
      const result = candidateEvaluator.evaluate(candidate, {
        query: mockQuery,
        knownUrls
      });

      assert.strictEqual(result.decision, 'REJECT');
      assert.strictEqual(result.isDuplicate, true);
    });
  });

  // ==========================================================================
  // 4. SECURITY & SSRF GUARDRAILS
  // ==========================================================================

  describe('4. Security & SSRF Guardrails', () => {
    const validator = new SourceSecurityValidator();
    const httpProvider = new HttpSourceAcquisitionProvider(validator);

    test('Rejects localhost and 127.0.0.1 addresses', () => {
      const check1 = validator.validateUrl('http://localhost:8080/admin');
      assert.strictEqual(check1.allowed, false);

      const check2 = validator.validateUrl('http://127.0.0.1/secret');
      assert.strictEqual(check2.allowed, false);
    });

    test('Rejects private IPv4 ranges (10.x, 172.16.x, 192.168.x, 169.254.x)', () => {
      assert.strictEqual(validator.validateUrl('http://10.0.0.5/data').allowed, false);
      assert.strictEqual(validator.validateUrl('http://172.20.1.10/doc').allowed, false);
      assert.strictEqual(validator.validateUrl('http://192.168.1.1/router').allowed, false);
      assert.strictEqual(validator.validateUrl('http://169.254.169.254/latest/meta-data').allowed, false);
    });

    test('Rejects non-HTTP protocols (file://, ftp://, data:)', () => {
      assert.strictEqual(validator.validateUrl('file:///etc/passwd').allowed, false);
      assert.strictEqual(validator.validateUrl('ftp://server.org/data').allowed, false);
      assert.strictEqual(validator.validateUrl('data:text/html,<html>').allowed, false);
    });

    test('Accepts valid public HTTP and HTTPS URLs', () => {
      const check = validator.validateUrl('https://developers.google.com/search/docs');
      assert.strictEqual(check.allowed, true);
    });

    test('HttpSourceAcquisitionProvider: blocks SSRF targets with SSRF_BLOCKED error code', async () => {
      const candidate: SourceCandidate = {
        id: 'cand-bad',
        queryId: 'dq-1',
        researchProjectId: 'proj-1',
        title: 'Localhost Target',
        url: 'http://127.0.0.1:3000/internal-keys',
        provider: 'Mock',
        status: 'DISCOVERED',
        discoveredAt: '2026-03-01T00:00:00.000Z'
      };

      const result = await httpProvider.acquire(candidate);
      assert.strictEqual(result.ok, false);
      if (!result.ok) {
        assert.strictEqual(result.error.code, 'SSRF_BLOCKED');
      }
    });
  });

  // ==========================================================================
  // 5. BUDGET & DIVERSITY CONTROLS
  // ==========================================================================

  describe('5. Budget & Diversity Controls', () => {
    test('BudgetTracker: enforces maxQueries and maxAcceptedSources limits', () => {
      const tracker = new BudgetTracker({
        maxQueries: 2,
        maxAcceptedSources: 2,
        maxAcquisitions: 2
      });

      assert.strictEqual(tracker.recordQuery(), true);
      assert.strictEqual(tracker.recordQuery(), true);
      assert.strictEqual(tracker.recordQuery(), false); // Over budget

      assert.strictEqual(tracker.recordAcceptedSource(), true);
      assert.strictEqual(tracker.recordAcceptedSource(), true);
      assert.strictEqual(tracker.recordAcceptedSource(), false); // Over budget

      assert.strictEqual(tracker.isExhausted(), true);
    });

    test('SourceDiversityChecker: warns when one publisher dominates > 60% of sources', () => {
      const checker = new SourceDiversityChecker();
      const candidates: SourceCandidate[] = [
        {
          id: 'c1', queryId: 'q1', researchProjectId: 'p1', title: 'T1', url: 'u1',
          publisher: 'VendorX', sourceType: 'INDUSTRY_RESEARCH', provider: 'M', status: 'ACCEPTED', discoveredAt: '2026'
        },
        {
          id: 'c2', queryId: 'q1', researchProjectId: 'p1', title: 'T2', url: 'u2',
          publisher: 'VendorX', sourceType: 'INDUSTRY_RESEARCH', provider: 'M', status: 'ACCEPTED', discoveredAt: '2026'
        },
        {
          id: 'c3', queryId: 'q1', researchProjectId: 'p1', title: 'T3', url: 'u3',
          publisher: 'VendorX', sourceType: 'INDUSTRY_RESEARCH', provider: 'M', status: 'ACCEPTED', discoveredAt: '2026'
        }
      ];

      const div = checker.checkDiversity(candidates);
      assert.strictEqual(div.isDiverse, false);
      assert.strictEqual(div.dominantPublisherRatio, 1.0);
      assert.strictEqual(div.warnings.length > 0, true);
    });
  });

  // ==========================================================================
  // 6. FULL END-TO-END PIPELINE & FIXTURE INTEGRATION
  // ==========================================================================

  describe('6. Full Pipeline Integration & Fixtures', () => {
    test('Loads primary source synthetic fixture cleanly', () => {
      const fixturePath = path.resolve('data/research/discovery-fixtures/primary-source-discovery.json');
      const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      assert.strictEqual(fixture.fixtureOnly, true);
      assert.strictEqual(fixture.verificationStatus, 'SYNTHETIC_TEST_DATA');
      assert.strictEqual(fixture.candidates.length, 2);
    });

    test('End-to-End: ResearchQuestion -> Discovery -> Candidate -> Acquisition -> Ingestion -> Evidence', async () => {
      // 1. Setup mock discovery provider with primary source fixture
      const fixturePath = path.resolve('data/research/discovery-fixtures/primary-source-discovery.json');
      const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      discoveryProvider.setDefaultResults(fixture.candidates);

      // 2. Setup mock acquisition provider with rich Markdown content
      acquisitionProvider.registerMockContent(fixture.candidates[0].url, {
        researchProjectId: 'res-proj-seo-relevance-001',
        sourceType: 'OFFICIAL_DOCUMENTATION',
        format: 'MARKDOWN',
        title: fixture.candidates[0].title,
        url: fixture.candidates[0].url,
        publisher: fixture.candidates[0].publisher,
        publicationDate: fixture.candidates[0].publicationDate,
        content: `# Information Gain Signals\n\nGoogle evaluates content uniqueness through information gain scores.\n\n> "Web pages offering unique empirical findings gain higher visibility in AI search summaries."\n\nApproximately 65% of organic traffic is sustained when authority markers are present.`
      });

      // 3. Execute full pipeline
      const pipelineRes = await acquisitionService.runAcquisitionPipeline(
        sampleQuestion,
        'res-proj-seo-relevance-001',
        [],
        {
          topicVolatility: 'HIGH',
          currentDate: new Date('2026-03-01'),
          budget: { maxQueries: 2, maxAcceptedSources: 2 }
        }
      );

      assert.strictEqual(pipelineRes.ok, true);
      if (!pipelineRes.ok) return;

      const report = pipelineRes.value;
      assert.strictEqual(report.queriesCreated.length > 0, true);
      assert.strictEqual(report.candidatesDiscovered.length > 0, true);
      assert.strictEqual(report.acceptedCandidates.length > 0, true);
      assert.strictEqual(report.ingestionResults.length > 0, true);

      // 4. Verify Phase 2A & 2B Repositories populated
      const sources = await sourceRepo.listByProjectId('res-proj-seo-relevance-001');
      assert.strictEqual(sources.length > 0, true);
      assert.strictEqual(sources[0].type, 'OFFICIAL_DOCUMENTATION');

      const evidence = await evidenceRepo.listByProjectId('res-proj-seo-relevance-001');
      assert.strictEqual(evidence.length > 0, true);

      // 5. Verify Provenance Chain & Audit Events
      const events = await eventRepo.listByProjectId('res-proj-seo-relevance-001');
      const eventTypes = events.map((e) => e.type);

      assert.strictEqual(eventTypes.includes('DISCOVERY_STARTED'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_CANDIDATE_DISCOVERED'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_CANDIDATE_ACCEPTED'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_ACQUISITION_STARTED'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_ACQUIRED'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_SENT_TO_INGESTION'), true);
      assert.strictEqual(eventTypes.includes('SOURCE_INGESTED'), true);
      assert.strictEqual(eventTypes.includes('EVIDENCE_EXTRACTED'), true);
    });
  });
});
