/// <reference path="./ambient.d.ts" />
/**
 * Tests: Phase 7 — Analytics + Feedback Loop
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Menutup loop publikasi secara utuh:
 * PUBLISH → METRIC → SIGNAL → DIAGNOSIS → LEARNING → RECOMMENDATION → TOPIC CAPTURED
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  AnalyticsService,
  MockSearchConsoleProvider,
  MockDiscoverProvider,
  MockGenerativeAISearchProvider,
  MockGenerativeAIDiscoverProvider,
  MockGA4Provider,
  GenerativeAIReportImportProvider,
  ArticleIdentityResolver,
  AnalyticsNormalizer,
  SignalDetector,
  PerformanceDiagnosisService,
  LearningEngine,
  FeedbackRouter,
  createPerformanceWindow,
  areWindowsComparable,
  validateAnalyticsPayloadPrivacy,
  validateCausalAttribution,
  validateContentLearningScope
} from '../engines/analytics/index.ts';

import type { PublicationManifest } from '../engines/publishing/publication.ts';
import { TopicManagementService } from '../engines/ideation/topic-management-service.ts';
import { InMemoryTopicRepository } from '../engines/ideation/repository/in-memory-topic-repository.ts';
import { InMemoryTopicEventRepository } from '../engines/ideation/repository/in-memory-topic-event-repository.ts';
import { InMemoryTopicArticleRelationRepository } from '../engines/ideation/repository/in-memory-topic-article-relation-repository.ts';

describe('Phase 7 Tests: Analytics + Feedback Loop', () => {
  function createTestTopicService(): { topicService: TopicManagementService; topicRepo: InMemoryTopicRepository } {
    const topicRepo = new InMemoryTopicRepository();
    const eventRepo = new InMemoryTopicEventRepository();
    const relationRepo = new InMemoryTopicArticleRelationRepository();
    const topicService = new TopicManagementService({ topicRepo, eventRepo, relationRepo });
    return { topicService, topicRepo };
  }
  // Helper membuat manifes publikasi
  function createTestManifest(overrides: Partial<PublicationManifest> = {}): PublicationManifest {
    return {
      publicationId: 'pub-test-001',
      articleId: 'art-001',
      slug: 'blog-masih-relevan-di-era-ai',
      canonicalUrl: 'https://nexamos.cloud/blog/blog-masih-relevan-di-era-ai',
      contentHash: 'hash-abc-123',
      publishedAt: '2026-09-01T00:00:00.000Z',
      packageVersion: 'v1.0.0',
      distributionPolicyVersion: 'UNIFIED_DISTRIBUTION_POLICY_V1',
      status: 'PUBLISHED',
      ...overrides
    };
  }

  // =========================================================================
  // 1. Providers & Capabilities
  // =========================================================================
  describe('1. Providers & Capability Boundaries', () => {
    it('Search Console provider menerima metrik standar dan menolak metrik engagement', () => {
      const gsc = new MockSearchConsoleProvider();
      const validMeasurement = {
        id: 'm-1',
        sourceType: 'GOOGLE_SEARCH' as const,
        providerName: 'GSC',
        rawPageIdentifier: 'https://nexamos.cloud/blog/artikel-a',
        dimensions: { date: '2026-09-10' },
        rawValues: { impressions: 1000, clicks: 50, ctr: 0.05, position: 4.2 },
        sourceTimezone: 'UTC',
        ingestedAt: new Date().toISOString()
      };

      const validCheck = gsc.validateMeasurement(validMeasurement);
      assert.strictEqual(validCheck.isValid, true);
      assert.strictEqual(validCheck.errors.length, 0);

      const invalidMeasurement = {
        ...validMeasurement,
        rawValues: { ...validMeasurement.rawValues, engagedSessions: 120 }
      };
      const invalidCheck = gsc.validateMeasurement(invalidMeasurement);
      assert.strictEqual(invalidCheck.isValid, false);
      assert.ok(invalidCheck.errors.some((e) => e.includes('tidak mendukung metrik engagement')));
    });

    it('Generative AI Search provider menolak metrik palsu (clicks, ctr, citationCount, aiRank)', () => {
      const aiSearch = new MockGenerativeAISearchProvider();
      const validAi = {
        id: 'm-ai-1',
        sourceType: 'GOOGLE_GENERATIVE_AI_SEARCH' as const,
        providerName: 'GenAI',
        rawPageIdentifier: 'https://nexamos.cloud/blog/artikel-a',
        dimensions: { date: '2026-09-10' },
        rawValues: { impressions: 450 },
        sourceTimezone: 'UTC',
        ingestedAt: new Date().toISOString()
      };

      const validCheck = aiSearch.validateMeasurement(validAi);
      assert.strictEqual(validCheck.isValid, true);

      // Metrik terlarang
      const fakeMetrics = {
        ...validAi,
        rawValues: { impressions: 450, clicks: 20, aiRank: 1 }
      };
      const invalidCheck = aiSearch.validateMeasurement(fakeMetrics);
      assert.strictEqual(invalidCheck.isValid, false);
      assert.ok(invalidCheck.errors.some((e) => e.includes('Metrik tidak didukung')));
    });

    it('Generative AI Report Importer berhasil memproses CSV dan JSON tanpa live API palsu', () => {
      const importer = new GenerativeAIReportImportProvider();

      // JSON import
      const jsonRecords = importer.importFromJson([
        { url: 'https://nexamos.cloud/blog/artikel-a', impressions: 320, date: '2026-09-10' }
      ]);
      assert.strictEqual(jsonRecords.length, 1);
      assert.strictEqual(jsonRecords[0].rawValues.impressions, 320);

      // CSV import
      const csv = `url,impressions,date,country\nhttps://nexamos.cloud/blog/artikel-b,150,2026-09-10,ID`;
      const csvRecords = importer.importFromCsv(csv);
      assert.strictEqual(csvRecords.length, 1);
      assert.strictEqual(csvRecords[0].rawValues.impressions, 150);
      assert.strictEqual(csvRecords[0].dimensions.country, 'ID');
    });
  });

  // =========================================================================
  // 2. Article Identity Resolution
  // =========================================================================
  describe('2. Article Identity Resolution', () => {
    it('Memetakan URL absolut, path relatif, dan variasi trailing slash ke identitas artikel', () => {
      const resolver = new ArticleIdentityResolver();
      const manifest = createTestManifest({
        articleId: 'art-arch-01',
        slug: 'arsitektur-informasi-retrieval',
        canonicalUrl: 'https://nexamos.cloud/blog/arsitektur-informasi-retrieval'
      });
      resolver.registerManifest(manifest, 'top-strat-01');

      // 1. URL absolut sama persis
      const res1 = resolver.resolve('https://nexamos.cloud/blog/arsitektur-informasi-retrieval');
      assert.ok(res1);
      assert.strictEqual(res1?.articleId, 'art-arch-01');
      assert.strictEqual(res1?.topicId, 'top-strat-01');

      // 2. Path relatif dengan trailing slash
      const res2 = resolver.resolve('/blog/arsitektur-informasi-retrieval/');
      assert.ok(res2);
      assert.strictEqual(res2?.articleId, 'art-arch-01');

      // 3. Resolusi langsung via articleId (kebal terhadap slug update)
      const res3 = resolver.resolveByArticleId('art-arch-01');
      assert.ok(res3);
      assert.strictEqual(res3?.slug, 'arsitektur-informasi-retrieval');
    });

    it('URL yang tidak terdaftar menghasilkan null tanpa crash', () => {
      const resolver = new ArticleIdentityResolver();
      const res = resolver.resolve('https://external.com/unknown-page');
      assert.strictEqual(res, null);
    });
  });

  // =========================================================================
  // 3. Zero Semantics & Sample Sufficiency
  // =========================================================================
  describe('3. Zero Semantics & Sample Sufficiency', () => {
    const normalizer = new AnalyticsNormalizer();
    const identity = {
      articleId: 'art-001',
      topicId: 'top-001',
      slug: 'artikel-uji',
      canonicalUrl: 'https://nexamos.cloud/blog/artikel-uji'
    };
    const window = createPerformanceWindow('FIRST_7_DAYS', '2026-09-01', '2026-09-08');

    it('Membedakan impresi nol (ZERO) dengan ketiadaan data (NO_DATA)', () => {
      // Kasus impresi benar-benar nol dari provider
      const measurementZero = [
        {
          id: 'm-z',
          sourceType: 'GOOGLE_SEARCH' as const,
          providerName: 'GSC',
          rawPageIdentifier: 'artikel-uji',
          dimensions: { date: '2026-09-02' },
          rawValues: { impressions: 0, clicks: 0 },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString()
        }
      ];

      const snapZero = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: measurementZero
      });

      assert.strictEqual(snapZero.search?.impressions.semantic, 'ZERO');
      assert.strictEqual(snapZero.search?.impressions.value, 0);

      // Kasus tidak ada data sama sekali
      const snapNoData = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: []
      });

      assert.strictEqual(snapNoData.search, null);
    });

    it('Membedakan Google Discover di bawah ambang batas (BELOW_THRESHOLD) dari angka 0', () => {
      const measurementThresholded = [
        {
          id: 'm-disc-t',
          sourceType: 'GOOGLE_DISCOVER' as const,
          providerName: 'Discover',
          rawPageIdentifier: 'artikel-uji',
          dimensions: { date: '2026-09-02' },
          rawValues: { thresholdStatus: 'BELOW_THRESHOLD', dataAvailable: false },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString()
        }
      ];

      const snapDisc = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'TACTICAL',
        articleType: 'HOW_TO',
        measurements: measurementThresholded
      });

      assert.ok(snapDisc.discover);
      assert.strictEqual(snapDisc.discover?.thresholdStatus, 'BELOW_THRESHOLD');
      assert.strictEqual(snapDisc.discover?.impressions.semantic, 'BELOW_THRESHOLD');
      assert.strictEqual(snapDisc.discover?.impressions.value, null);
      assert.strictEqual(snapDisc.dataCompleteness, 'THRESHOLDED');
    });

    it('Sample size kecil (< 200 impresi) menghasilkan LOW_SAMPLE / INSUFFICIENT', () => {
      const measurementSmall = [
        {
          id: 'm-s',
          sourceType: 'GOOGLE_SEARCH' as const,
          providerName: 'GSC',
          rawPageIdentifier: 'artikel-uji',
          dimensions: { date: '2026-09-02' },
          rawValues: { impressions: 45, clicks: 3 },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString()
        }
      ];

      const snapSmall = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'INTELLIGENCE',
        articleType: 'EXPLAINER',
        measurements: measurementSmall
      });

      assert.strictEqual(snapSmall.search?.impressions.sampleSufficiency, 'LOW_SAMPLE');
      assert.strictEqual(snapSmall.overallSampleSufficiency, 'LOW_SAMPLE');
    });
  });

  // =========================================================================
  // 4. Performance Windows & Comparability
  // =========================================================================
  describe('4. Performance Windows & Comparability', () => {
    it('Membangun window dengan durasi hari yang tepat', () => {
      const w7 = createPerformanceWindow('FIRST_7_DAYS', '2026-09-01', '2026-09-08');
      assert.strictEqual(w7.durationDays, 7);
      assert.strictEqual(w7.isRolling, false);

      const w28 = createPerformanceWindow('ROLLING_28_DAYS', '2026-08-01', '2026-08-29');
      assert.strictEqual(w28.durationDays, 28);
      assert.strictEqual(w28.isRolling, true);
    });

    it('Menolak perbandingan langsung antar window dengan durasi jomplang (bias usia)', () => {
      const w7 = createPerformanceWindow('FIRST_7_DAYS', '2026-09-01', '2026-09-08');
      const w28 = createPerformanceWindow('FIRST_28_DAYS', '2026-09-01', '2026-09-29');

      const check = areWindowsComparable(w7, w28);
      assert.strictEqual(check.comparable, false);
      assert.ok(check.reason?.includes('Tipe window berbeda'));
    });
  });

  // =========================================================================
  // 5. Signal Detection Engine
  // =========================================================================
  describe('5. Signal Detection Engine', () => {
    const detector = new SignalDetector();
    const identity = {
      articleId: 'art-sig-01',
      topicId: 'top-01',
      slug: 'uji-sinyal',
      canonicalUrl: 'https://nexamos.cloud/blog/uji-sinyal'
    };
    const normalizer = new AnalyticsNormalizer();
    const windowCurrent = createPerformanceWindow('ROLLING_28_DAYS', '2026-09-01', '2026-09-29');
    const windowPrevious = createPerformanceWindow('ROLLING_28_DAYS', '2026-08-03', '2026-08-31');

    it('Mendeteksi SEARCH_IMPRESSIONS_RISING saat impresi naik >= 25% dibanding periode lalu', () => {
      const currentSnap = normalizer.normalizeSnapshot({
        identity,
        window: windowCurrent,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-curr',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-sinyal',
            dimensions: { date: '2026-09-15' },
            rawValues: { impressions: 1500, clicks: 60, position: 5.0 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const previousSnap = normalizer.normalizeSnapshot({
        identity,
        window: windowPrevious,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-prev',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-sinyal',
            dimensions: { date: '2026-08-15' },
            rawValues: { impressions: 1000, clicks: 40, position: 7.0 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = detector.detectSignals({
        currentSnapshot: currentSnap,
        previousSnapshot: previousSnap
      });

      assert.ok(signals.some((s) => s.signalType === 'SEARCH_IMPRESSIONS_RISING'));
      const sig = signals.find((s) => s.signalType === 'SEARCH_IMPRESSIONS_RISING')!;
      assert.strictEqual(sig.confidence, 'HIGH');
      assert.strictEqual(sig.metricsObserved.deltaPercentage, 50);
    });

    it('Mendeteksi HIGH_IMPRESSIONS_LOW_CTR saat impresi tinggi tapi CTR di bawah benchmark', () => {
      const currentSnap = normalizer.normalizeSnapshot({
        identity,
        window: windowCurrent,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-low-ctr',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-sinyal',
            dimensions: { date: '2026-09-15' },
            rawValues: { impressions: 2000, clicks: 15 }, // CTR: 0.75% (jauh di bawah 3.5%)
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = detector.detectSignals({
        currentSnapshot: currentSnap
      });

      assert.ok(signals.some((s) => s.signalType === 'HIGH_IMPRESSIONS_LOW_CTR'));
    });

    it('Mendeteksi AI_SEARCH_VISIBILITY_EMERGING secara deterministik', () => {
      const currentSnap = normalizer.normalizeSnapshot({
        identity,
        window: windowCurrent,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-ai',
            sourceType: 'GOOGLE_GENERATIVE_AI_SEARCH',
            providerName: 'GenAI',
            rawPageIdentifier: 'uji-sinyal',
            dimensions: { date: '2026-09-15' },
            rawValues: { impressions: 320 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = detector.detectSignals({
        currentSnapshot: currentSnap
      });

      assert.ok(signals.some((s) => s.signalType === 'AI_SEARCH_VISIBILITY_EMERGING'));
    });

    it('Sample size kecil tidak menghasilkan sinyal berkategori HIGH confidence', () => {
      const currentSnap = normalizer.normalizeSnapshot({
        identity,
        window: windowCurrent,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-small-sample',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-sinyal',
            dimensions: { date: '2026-09-15' },
            rawValues: { impressions: 30, clicks: 1 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = detector.detectSignals({ currentSnapshot: currentSnap });
      for (const sig of signals) {
        assert.notStrictEqual(sig.confidence, 'HIGH', 'Sinyal dari sampel rendah tidak boleh HIGH confidence');
      }
    });
  });

  // =========================================================================
  // 6. Diagnosis Engine & Anti-Causality Guardrails
  // =========================================================================
  describe('6. Diagnosis Engine & Anti-Causality Guardrail', () => {
    const diagnosisService = new PerformanceDiagnosisService();
    const identity = {
      articleId: 'art-diag-01',
      topicId: 'top-01',
      slug: 'uji-diagnosis',
      canonicalUrl: 'https://nexamos.cloud/blog/uji-diagnosis'
    };
    const normalizer = new AnalyticsNormalizer();
    const window = createPerformanceWindow('ROLLING_28_DAYS', '2026-09-01', '2026-09-29');

    it('Membangun multi-metric diagnosis (SEARCH_PRESENTATION_WEAKNESS) dengan bukti eksplisit', () => {
      const snapshot = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-diag',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-diagnosis',
            dimensions: { date: '2026-09-10' },
            rawValues: { impressions: 2500, clicks: 20 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = new SignalDetector().detectSignals({ currentSnapshot: snapshot });
      const diagnoses = diagnosisService.diagnose({ snapshot, signals });

      assert.ok(diagnoses.some((d) => d.diagnosisType === 'SEARCH_PRESENTATION_WEAKNESS'));
      const d = diagnoses.find((d) => d.diagnosisType === 'SEARCH_PRESENTATION_WEAKNESS')!;
      assert.ok(d.evidence.length >= 2);
      assert.ok(d.limitations.length >= 1);
    });

    it('Anomali provider otomatis menurunkan tingkat keyakinan (confidence) diagnosis', () => {
      const snapshot = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-diag-anom',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-diagnosis',
            dimensions: { date: '2026-09-10' },
            rawValues: { impressions: 3000, clicks: 15 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ],
        anomalies: [
          {
            anomalyType: 'PROVIDER_LOGGING_ISSUE',
            sourceType: 'GOOGLE_SEARCH',
            description: 'Google Search Console mengalami keterlambatan pelaporan data klik global.',
            severity: 'HIGH',
            identifiedAt: new Date().toISOString()
          }
        ]
      });

      const signals = new SignalDetector().detectSignals({ currentSnapshot: snapshot });
      const diagnoses = diagnosisService.diagnose({ snapshot, signals });

      const d = diagnoses.find((d) => d.diagnosisType === 'SEARCH_PRESENTATION_WEAKNESS');
      assert.ok(d);
      assert.strictEqual(d?.confidence, 'LOW', 'Anomali provider harus menurunkan confidence ke LOW');
      assert.ok(d?.limitations.some((lim) => lim.includes('anomali')));
    });

    it('Guardrail Anti-Kausalitas menolak pernyataan klaim kausal tak berdasar', () => {
      const badStatement = 'Perubahan judul artikel terbukti menyebabkan lonjakan CTR sebesar 80%';
      const check = validateCausalAttribution(badStatement);
      assert.strictEqual(check.isValid, false);
      assert.strictEqual(check.issueCode, 'UNSUPPORTED_CAUSAL_ATTRIBUTION');

      const validStatement = 'Peningkatan CTR teramati setelah pembaruan formulasi judul artikel.';
      const checkValid = validateCausalAttribution(validStatement);
      assert.strictEqual(checkValid.isValid, true);
    });
  });

  // =========================================================================
  // 7. Content Learning Engine
  // =========================================================================
  describe('7. Content Learning Engine', () => {
    const learningEngine = new LearningEngine();
    const identity = {
      articleId: 'art-learn-01',
      topicId: 'top-01',
      slug: 'uji-learning',
      canonicalUrl: 'https://nexamos.cloud/blog/uji-learning'
    };
    const normalizer = new AnalyticsNormalizer();
    const window = createPerformanceWindow('ROLLING_28_DAYS', '2026-09-01', '2026-09-29');

    it('Mengekstrak pembelajaran terlingkup dan menolak klaim aturan universal mutlak', () => {
      const snapshot = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        measurements: [
          {
            id: 'm-learn',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'uji-learning',
            dimensions: { date: '2026-09-10' },
            rawValues: { impressions: 1800, clicks: 12 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const signals = new SignalDetector().detectSignals({ currentSnapshot: snapshot });
      const diagnoses = new PerformanceDiagnosisService().diagnose({ snapshot, signals });
      const learnings = learningEngine.extractLearnings({ snapshot, diagnoses });

      assert.ok(learnings.length >= 1);
      const l = learnings[0];
      assert.strictEqual(l.applicableTo.isUniversalRule, false);
      assert.ok(l.applicableTo.territories?.includes('STRATEGY'));

      // Uji validator cakupan
      const invalidUniversal = {
        ...l,
        applicableTo: { ...l.applicableTo, isUniversalRule: true }
      };
      const checkUniversal = validateContentLearningScope(invalidUniversal);
      assert.strictEqual(checkUniversal.isValid, false);

      const sweepingText = {
        ...l,
        statement: 'Semua artikel harus menggunakan format judul pertanyaan.'
      };
      const checkSweeping = validateContentLearningScope(sweepingText);
      assert.strictEqual(checkSweeping.isValid, false);
    });
  });

  // =========================================================================
  // 8. Feedback Actions & Closed Loop to Phase 1/2
  // =========================================================================
  describe('8. Feedback Actions & Closed Loop Routing', () => {
    it('Merutekan usulan topik ke Phase 1 Topic Manager dengan status awal CAPTURED (tanpa bypass)', async () => {
      const { topicService } = createTestTopicService();
      const router = new FeedbackRouter(topicService);

      const action = {
        id: 'act-top-01',
        target: 'TOPIC' as const,
        actionType: 'PRIORITIZE_FOLLOW_UP' as const,
        priority: 'MEDIUM' as const,
        reason: 'Minat pencarian lanjutan tinggi terdeteksi.',
        originArticleId: 'art-001',
        supportingDiagnosisIds: ['diag-01'],
        payload: {
          followUpTopicProposal: {
            proposedTitle: 'Praktik Implementasi AI Grounding',
            problem: 'Bagaimana tim konten enterprise menerapkan arsitektur informasi grounding?',
            audienceSegment: 'Enterprise Content Leaders',
            primaryIntent: 'Panduan taktis implementasi',
            suggestedTerritory: 'STRATEGY' as const,
            recommendedArticleType: 'HOW_TO' as const,
            originArticleId: 'art-001',
            rationaleSignals: ['AI_SEARCH_VISIBILITY_EMERGING']
          }
        },
        status: 'PROPOSED' as const,
        createdAt: new Date().toISOString()
      };

      const result = await router.routeAction(action);
      assert.strictEqual(result.routed, true);
      assert.ok(result.createdTopic);

      // Verifikasi doktrin keras: Status topik baru HARUS 'CAPTURED', BUKAN 'APPROVED'
      assert.strictEqual(result.createdTopic?.status, 'CAPTURED');
      assert.strictEqual(action.status, 'ROUTED');
    });

    it('Prioritas tindakan performa penurunan impresi bukan CRITICAL melainkan MEDIUM', () => {
      const router = new FeedbackRouter();
      const identity = {
        articleId: 'art-002',
        topicId: 'top-002',
        slug: 'stale-article',
        canonicalUrl: 'https://nexamos.cloud/blog/stale-article'
      };
      const normalizer = new AnalyticsNormalizer();
      const window = createPerformanceWindow('ROLLING_28_DAYS', '2026-09-01', '2026-09-29');

      const snapshot = normalizer.normalizeSnapshot({
        identity,
        window,
        territory: 'TACTICAL',
        articleType: 'HOW_TO',
        measurements: [
          {
            id: 'm-stale',
            sourceType: 'GOOGLE_SEARCH',
            providerName: 'GSC',
            rawPageIdentifier: 'stale-article',
            dimensions: { date: '2026-09-10' },
            rawValues: { impressions: 100, clicks: 1 },
            sourceTimezone: 'UTC',
            ingestedAt: new Date().toISOString()
          }
        ]
      });

      const diagnoses = [
        {
          id: 'diag-decay',
          articleId: 'art-002',
          signals: [],
          diagnosisType: 'CONTENT_REFRESH_OPPORTUNITY' as const,
          summary: 'Penurunan visibilitas organik terdeteksi',
          confidence: 'MEDIUM' as const,
          evidence: ['Impresi menurun konsisten'],
          limitations: [],
          anomaliesConsidered: [],
          createdAt: new Date().toISOString()
        }
      ];

      const actions = router.proposeActions({ snapshot, diagnoses, learnings: [] });
      const refreshAction = actions.find((a) => a.actionType === 'REFRESH_RESEARCH');
      assert.ok(refreshAction);
      assert.strictEqual(refreshAction?.priority, 'MEDIUM');
      assert.notStrictEqual(refreshAction?.priority, 'CRITICAL', 'Penurunan performa biasa bukan CRITICAL');
    });
  });

  // =========================================================================
  // 9. Privacy & Safety Guardrails
  // =========================================================================
  describe('9. Privacy & Safety Guardrails', () => {
    it('Menolak rekaman yang memuat PII (email, IP address, user real name)', () => {
      const payloadWithPII = {
        page: '/blog/artikel-a',
        email: 'reader@company.com',
        impressions: 10
      };

      const check = validateAnalyticsPayloadPrivacy(payloadWithPII);
      assert.strictEqual(check.hasPII, true);
      assert.ok(check.detectedFields.includes('email'));

      const normalizer = new AnalyticsNormalizer();
      assert.throws(
        () => {
          normalizer.normalizeSnapshot({
            identity: {
              articleId: 'a-1',
              slug: 's-1',
              canonicalUrl: 'https://nexamos.cloud/blog/s-1'
            },
            window: createPerformanceWindow('FIRST_7_DAYS', '2026-09-01', '2026-09-08'),
            territory: 'STRATEGY',
            articleType: 'ANALYSIS',
            measurements: [
              {
                id: 'm-pii',
                sourceType: 'INTERNAL_EVENT',
                providerName: 'Internal',
                rawPageIdentifier: 's-1',
                dimensions: { date: '2026-09-01' },
                rawValues: payloadWithPII,
                sourceTimezone: 'UTC',
                ingestedAt: new Date().toISOString()
              }
            ]
          });
        },
        /Pelanggaran Privasi Terdeteksi/
      );
    });

    it('Memblokir data pengujian sintetis (fixtureOnly / isSyntheticTestData) pada mode produksi', () => {
      const normalizer = new AnalyticsNormalizer();
      assert.throws(
        () => {
          normalizer.normalizeSnapshot({
            identity: {
              articleId: 'a-prod',
              slug: 'prod-article',
              canonicalUrl: 'https://nexamos.cloud/blog/prod-article'
            },
            window: createPerformanceWindow('FIRST_7_DAYS', '2026-09-01', '2026-09-08'),
            territory: 'STRATEGY',
            articleType: 'ANALYSIS',
            measurements: [
              {
                id: 'm-fixture',
                sourceType: 'GOOGLE_SEARCH',
                providerName: 'GSC',
                rawPageIdentifier: 'prod-article',
                dimensions: { date: '2026-09-01' },
                rawValues: { impressions: 100 },
                sourceTimezone: 'UTC',
                ingestedAt: new Date().toISOString(),
                fixtureOnly: true // Data sintetis
              }
            ],
            isProductionMode: true
          });
        },
        /Pelanggaran Keamanan Produksi/
      );
    });
  });

  // =========================================================================
  // 10. Full Closed-Loop Orchestration (E2E)
  // =========================================================================
  describe('10. Full Closed-Loop Orchestration (E2E with Mocks)', () => {
    it('Menjalankan seluruh siklus dari artikel terbit hingga pembuatan topik baru di Phase 1', async () => {
      // 1. Inisialisasi service dengan TopicManagementService Phase 1
      const { topicService } = createTestTopicService();
      const analyticsService = new AnalyticsService({ topicService });

      // 2. Daftarkan manifes artikel terbit
      const manifest = createTestManifest({
        articleId: 'art-closed-loop',
        slug: 'blog-masih-relevan-di-era-ai',
        canonicalUrl: 'https://nexamos.cloud/blog/blog-masih-relevan-di-era-ai'
      });
      analyticsService.registerPublishedArticle(manifest, 'top-master-01');

      // 3. Ingest pengukuran performa mentah dari berbagai kanal
      await analyticsService.ingestMeasurements([
        // Search
        {
          id: 'm-e2e-gsc',
          sourceType: 'GOOGLE_SEARCH',
          providerName: 'MockGSC',
          rawPageIdentifier: 'blog-masih-relevan-di-era-ai',
          dimensions: { date: '2026-09-15' },
          rawValues: { impressions: 20000, clicks: 800, position: 3.5 },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString(),
          fixtureOnly: true,
          isSyntheticTestData: true
        },
        // Discover
        {
          id: 'm-e2e-disc',
          sourceType: 'GOOGLE_DISCOVER',
          providerName: 'MockDiscover',
          rawPageIdentifier: 'blog-masih-relevan-di-era-ai',
          dimensions: { date: '2026-09-15' },
          rawValues: { impressions: 5000, clicks: 700 },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString(),
          fixtureOnly: true,
          isSyntheticTestData: true
        },
        // Generative AI Search (Hanya impressions!)
        {
          id: 'm-e2e-ai',
          sourceType: 'GOOGLE_GENERATIVE_AI_SEARCH',
          providerName: 'MockGenAISearch',
          rawPageIdentifier: 'blog-masih-relevan-di-era-ai',
          dimensions: { date: '2026-09-15' },
          rawValues: { impressions: 1200 },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString(),
          fixtureOnly: true,
          isSyntheticTestData: true
        },
        // GA4 Behavior
        {
          id: 'm-e2e-ga4',
          sourceType: 'GA4',
          providerName: 'MockGA4',
          rawPageIdentifier: 'blog-masih-relevan-di-era-ai',
          dimensions: { date: '2026-09-15' },
          rawValues: {
            users: 850,
            sessions: 900,
            engagedSessions: 720,
            averageEngagementTime: 145, // ~2.4 menit
            views: 1100,
            eventCount: 4500,
            keyEvents: 45
          },
          sourceTimezone: 'UTC',
          ingestedAt: new Date().toISOString(),
          fixtureOnly: true,
          isSyntheticTestData: true
        }
      ]);

      // 4. Proses performa artikel untuk window 28 hari
      const window = createPerformanceWindow('ROLLING_28_DAYS', '2026-09-01', '2026-09-29');
      const processResult = await analyticsService.processArticlePerformance({
        articleId: 'art-closed-loop',
        window,
        territory: 'STRATEGY',
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        isProductionMode: false // Berjalan dengan data fixture uji
      });

      // Verifikasi Snapshot
      assert.strictEqual(processResult.snapshot.articleId, 'art-closed-loop');
      assert.strictEqual(processResult.snapshot.search?.impressions.value, 20000);
      assert.strictEqual(processResult.snapshot.discover?.impressions.value, 5000);
      assert.strictEqual(processResult.snapshot.generativeAISearch?.impressions.value, 1200);
      assert.strictEqual(processResult.snapshot.behavior?.sessions.value, 900);

      // Verifikasi Deteksi Sinyal
      assert.ok(processResult.signals.some((s) => s.signalType === 'AI_SEARCH_VISIBILITY_EMERGING'));
      assert.ok(processResult.signals.some((s) => s.signalType === 'STRONG_ENGAGEMENT'));

      // Verifikasi Diagnosis
      assert.ok(processResult.diagnoses.some((d) => d.diagnosisType === 'AI_VISIBILITY_GAIN'));

      // Verifikasi Learning
      assert.ok(processResult.learnings.some((l) => l.learningType === 'AI_VISIBILITY_LEARNING'));

      // Verifikasi Rekomendasi Feedback Action
      const topicAction = processResult.actions.find((a) => a.actionType === 'PRIORITIZE_FOLLOW_UP');
      assert.ok(topicAction);
      assert.strictEqual(topicAction?.target, 'TOPIC');

      // 5. Eksekusi Perutean Feedback Action ke Phase 1
      const routeResult = await analyticsService.routeFeedbackAction(topicAction!);
      assert.strictEqual(routeResult.routed, true);
      assert.ok(routeResult.createdTopic);

      // Pastikan topik baru tercipta di repositori Topic Management Phase 1 dengan status CAPTURED
      assert.strictEqual(routeResult.createdTopic?.status, 'CAPTURED');
      const retrievedTopic = await topicService.getTopic(routeResult.createdTopic!.id);
      assert.ok(retrievedTopic);
      assert.strictEqual(retrievedTopic?.status, 'CAPTURED');

      // 6. Verifikasi Scorecard Multi-Dimensi
      const scorecard = analyticsService.generateScorecard(processResult.snapshot);
      assert.strictEqual(scorecard.dimensions.searchVisibility, 'STRONG');
      assert.strictEqual(scorecard.dimensions.discoverVisibility, 'ACTIVE');
      assert.strictEqual(scorecard.dimensions.aiVisibility, 'GROWING');
      assert.strictEqual(scorecard.dimensions.engagementQuality, 'DEEP');

      // 7. Verifikasi Summary Manusiawi
      const summary = analyticsService.getArticleAnalyticsSummary(
        processResult.snapshot,
        processResult.diagnoses,
        processResult.learnings,
        processResult.actions
      );
      assert.ok(summary.searchSummary.includes('20000 impresi'));
      assert.ok(summary.aiSearchSummary.includes('1200 impresi'));
      assert.ok(summary.diagnosesSummary.length > 0);
      assert.ok(summary.recommendedActionsSummary.length > 0);

      // 8. Verifikasi Audit Events
      const auditEvents = analyticsService.getAuditEvents();
      assert.ok(auditEvents.some((e) => e.eventType === 'ANALYTICS_INGESTION_STARTED'));
      assert.ok(auditEvents.some((e) => e.eventType === 'PERFORMANCE_SNAPSHOT_CREATED'));
      assert.ok(auditEvents.some((e) => e.eventType === 'SIGNAL_DETECTED'));
      assert.ok(auditEvents.some((e) => e.eventType === 'FEEDBACK_ROUTED'));
    });
  });
});
