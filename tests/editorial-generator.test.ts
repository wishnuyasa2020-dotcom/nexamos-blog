/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 3A Unit & Integration Test Suite: Grounded Editorial Generator
 *
 * Menggunakan Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { EVIDENCE_LEVELS } from '../engines/ideation/domain/evidence-level.ts';
import type { EvidenceLevel } from '../engines/ideation/domain/evidence-level.ts';

import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../engines/research/orchestrator/research-brief.ts';

import {
  EditorialGenerationService,
  ArticleGenerator,
  GroundingGuard,
  MockAIEditorialProvider,
  validateEditorialPlan
} from '../engines/editorial/index.ts';

import type { EditorialGenerationRequest } from '../engines/editorial/editorial-generation-request.ts';
import type { EditorialPlan } from '../engines/editorial/editorial-plan.ts';
import type { ArticleDraft } from '../engines/editorial/article-draft.ts';

describe('Phase 3A Tests: Grounded Editorial Generator', () => {
  let sampleTopic: Topic;
  let sampleBrief: ResearchBrief;
  let mockProvider: MockAIEditorialProvider;
  let service: EditorialGenerationService;
  let generator: ArticleGenerator;

  beforeEach(() => {
    sampleTopic = {
      id: 'top-blog-relevance-001',
      title: 'Apakah aktivitas blog masih relevan di era AI?',
      slug: 'apakah-aktivitas-blog-masih-relevan-di-era-ai',
      territory: 'TACTICAL',
      status: 'APPROVED',
      editorialRole: 'AUTHORITY',
      audience: {
        segment: 'Praktisi Pemasaran & Pemimpin Bisnis',
        jobToBeDone: 'Memahami strategi konten dan retensi organik di era AI'
      },
      problem: 'Banyak praktisi meragukan relevansi blog setelah munculnya AI Overviews.',
      intent: {
        primary: 'Menilai pergeseran fungsi blog menuju sistem kepemilikan pengetahuan'
      },
      thesis: 'Blog tetap relevan di era AI, tetapi fungsi strategisnya bergeser menjadi owned knowledge system.',
      whyNow: 'Disrupsi AI search mengubah pola klik organik secara struktural.',
      informationGain: {
        expectedContribution: 'Data empiris retensi dan framework arsitektur otoritas entitas',
        originalityType: ['ORIGINAL_DATA', 'CROSS_THEORY_SYNTHESIS'],
        commodityRisk: 'LOW'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E2',
        plannedSources: ['State of Organic Search Traffic 2025'],
        originalEvidenceRequired: true
      },
      businessRelevance: {
        objective: 'AUDIENCE_ACQUISITION',
        funnelRole: 'TOFU'
      },
      recommendedArticleType: 'ANALYSIS',
      distributionTargets: ['GOOGLE_SEARCH', 'GOOGLE_DISCOVER', 'EMAIL'],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z'
    };

    // PERINGATAN DOKTRIN: sampleBrief ini adalah SYNTHETIC TEST FIXTURE murni untuk validasi pipeline.
    // Data empiris (misal retensi 85% dari 10.000 domain) DILARANG dibocorkan/digunakan sebagai fakta artikel produksi.
    sampleBrief = {
      id: 'brief-blog-relevance-001',
      topicId: 'top-blog-relevance-001',
      researchProjectId: 'top-blog-relevance-001',
      objective: 'Menguji relevansi blog di era AI generatif dan mengukur retensi trafik organik',
      answeredQuestions: [
        {
          id: 'rq-001',
          question: 'Bagaimana tren retensi trafik organik pada blog riset orisinal?',
          priority: 'HIGH',
          status: 'ANSWERED'
        }
      ],
      openQuestions: [],
      supportedClaims: [
        {
          id: 'claim-retention-001',
          researchProjectId: 'top-blog-relevance-001',
          statement:
            'Blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator.',
          claimType: 'COMPARATIVE',
          status: 'SUPPORTED',
          importance: 'CRITICAL',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z'
        }
      ],
      partiallySupportedClaims: [],
      disputedClaims: [
        {
          id: 'claim-disputed-001',
          researchProjectId: 'top-blog-relevance-001',
          statement:
            'Semua query transaksional dan informasi akan sepenuhnya dijawab tanpa klik ke situs penerbit.',
          claimType: 'FORECAST',
          status: 'UNVERIFIED',
          importance: 'SUPPORTING',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z'
        }
      ],
      keyFindings: [
        {
          id: 'finding-001',
          researchProjectId: 'top-blog-relevance-001',
          statement:
            'Penurunan klik hanya menghantam konten komoditas; konten berbasis data primer mengalami peningkatan rujukan dan sitasi AI.',
          supportingClaimIds: ['claim-retention-001'],
          confidence: 'HIGH',
          limitations: ['Sampel 10.000 domain'],
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z'
        }
      ],
      limitations: [
        'Studi sampel dibatasi pada 10.000 domain industri B2B teknologi global, belum mencakup blog retail lokal.'
      ],
      researchGaps: [],
      recommendedEditorialAngle:
        'Blog bergeser dari saluran perolehan klik komoditas menjadi benteng pengetahuan otoritas entitas (owned knowledge moat).',
      sourceIndex: [
        {
          sourceId: 'src-seo-report-2025',
          title: 'State of Organic Search Traffic and Blog Retention in 2025',
          url: 'https://example.com/reports/seo-in-ai-era-2025.html',
          sourceType: 'INDUSTRY_RESEARCH',
          authorityScore: 86,
          freshnessStatus: 'CURRENT'
        }
      ],
      evidenceIndex: [
        {
          evidenceId: 'ev-seo-report-quote-001',
          sourceId: 'src-seo-report-2025',
          quote:
            'Data dari 10.000 domain menunjukkan blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator.',
          level: 'E2',
          verified: true
        }
      ],
      readiness: 'READY_FOR_EDITORIAL',
      generatedAt: '2026-03-01T00:00:00.000Z'
    };

    mockProvider = new MockAIEditorialProvider();
    service = new EditorialGenerationService({ aiProvider: mockProvider });
    generator = new ArticleGenerator(mockProvider);
  });

  describe('0. Evidence Taxonomy Audit & Integrity', () => {
    test('hanya ada satu taksonomi bukti kanonikal: E0, E1, E2, E3, E4', () => {
      assert.deepStrictEqual([...EVIDENCE_LEVELS], ['E0', 'E1', 'E2', 'E3', 'E4']);
    });

    test('menolak taksonomi asing seperti L2_STATISTICAL sebagai EvidenceLevel', () => {
      const candidateLevel: string = 'L2_STATISTICAL';
      const isCanonical = EVIDENCE_LEVELS.includes(candidateLevel as EvidenceLevel);
      assert.strictEqual(isCanonical, false, 'L2_STATISTICAL bukan taksonomi bukti kanonikal');
    });

    test('penegasan doktrin: ResearchRequirementLevel tidak sama dengan EvidenceLevel', () => {
      const researchRequirementConcept = 'DEEP_EMPIRICAL_RESEARCH';
      const evidenceLevelConcept: EvidenceLevel = 'E2';
      assert.notStrictEqual(
        researchRequirementConcept,
        evidenceLevelConcept,
        'ResearchRequirementLevel harus terpisah dari EvidenceLevel'
      );
    });
  });

  describe('1. Editorial Planner', () => {
    test('berhasil merumuskan EditorialPlan yang valid untuk tipe ANALYSIS', async () => {
      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran & Pemimpin Bisnis',
        primaryObjective: 'Membangun pemahaman strategis tentang pergeseran blog di era AI'
      };

      const plan = await mockProvider.createEditorialPlan(request);
      const validation = validateEditorialPlan(plan, 'ANALYSIS');

      assert.strictEqual(validation.valid, true);
      assert.ok(plan.thesis.length > 20);
      assert.ok(plan.sectionPlan.length >= 4);
    });

    test('menolak EditorialPlan jika thesis kosong pada tipe artikel ANALYSIS', () => {
      const invalidPlan: EditorialPlan = {
        workingTitle: 'Analisis Blog di Era AI',
        thesis: '', // Kosong!
        angle: 'Owned knowledge',
        readerPromise: 'Memahami arah baru konten',
        sectionPlan: [
          { heading: 'Pengantar', purpose: 'HOOK', keyPoints: ['Poin 1'], plannedClaimIds: [] }
        ],
        claimsToUse: ['claim-001'],
        findingsToUse: ['finding-001'],
        counterpoints: ['Limitasi'],
        intendedTakeaway: 'Takeaway'
      };

      const validation = validateEditorialPlan(invalidPlan, 'ANALYSIS');
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some((e) => e.includes('THESIS_REQUIRED')));
    });

    test('mengizinkan EditorialPlan tanpa thesis argumentatif untuk tipe GLOSSARY dan REFERENCE', () => {
      const glossaryPlan: EditorialPlan = {
        workingTitle: 'Glosarium Entity Authority',
        thesis: '', // Diizinkan kosong untuk glossary
        angle: 'Definisi otoritas entitas',
        readerPromise: 'Memahami definisi presisi istilah teknis',
        sectionPlan: [
          { heading: 'Definisi Konsep', purpose: 'CONTEXT', keyPoints: ['Definisi'], plannedClaimIds: [] }
        ],
        claimsToUse: [],
        findingsToUse: [],
        counterpoints: [],
        intendedTakeaway: 'Pemahaman terminologi'
      };

      const validationGlossary = validateEditorialPlan(glossaryPlan, 'GLOSSARY');
      assert.strictEqual(validationGlossary.valid, true);

      const validationReference = validateEditorialPlan(glossaryPlan, 'REFERENCE');
      assert.strictEqual(validationReference.valid, true);
    });
  });

  describe('2. Grounding & Citation Integrity Guard', () => {
    test('menerima penggunaan klaim, bukti, dan sumber yang sah terdaftar di ResearchBrief', async () => {
      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.guardResult.status, 'PASS');
      assert.strictEqual(result.draft?.status, 'READY_FOR_EDITORIAL_REVIEW');
    });

    test('menolak (FAIL/REJECTED) jika draf mereferensikan claimId fiktif', async () => {
      mockProvider.setConfig({ injectFakeClaimId: true });

      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.guardResult.status, 'FAIL');
      assert.strictEqual(result.draft?.status, 'REJECTED');
      assert.ok(
        result.guardResult.issues.some((i) => i.code === 'UNKNOWN_CLAIM_REFERENCE')
      );
    });

    test('menolak jika CitationMap mereferensikan sourceId atau evidenceId fiktif', () => {
      const guard = new GroundingGuard();

      const fakeDraft: ArticleDraft = {
        id: 'draft-fake-001',
        topicId: sampleTopic.id,
        researchProjectId: sampleTopic.id,
        title: 'Judul',
        territory: 'TACTICAL',
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        thesis: 'Tesis yang sah dan panjangnya memenuhi syarat doktrin.',
        editorialAngle: 'Sudut pandang',
        sections: [
          {
            id: 'sec-1',
            purpose: 'EVIDENCE',
            content: 'Konten dengan sitasi palsu.',
            order: 1,
            claimUsageIds: ['cu-1']
          }
        ],
        claimUsages: [
          {
            id: 'cu-1',
            claimId: 'claim-retention-001', // Sah
            sectionId: 'sec-1',
            usageType: 'DIRECT',
            statement: 'Pernyataan'
          }
        ],
        citationMap: [
          {
            claimUsageId: 'cu-1',
            claimId: 'claim-retention-001',
            sourceIds: ['src-hantu-999'], // Fiktif!
            evidenceIds: ['ev-hantu-888'] // Fiktif!
          }
        ],
        status: 'GENERATED',
        generatedAt: new Date().toISOString(),
        generatorVersion: 'v1.0',
        promptVersion: 'v1.0'
      };

      const guardResult = guard.evaluate(fakeDraft, sampleBrief);
      assert.strictEqual(guardResult.status, 'FAIL');
      assert.ok(guardResult.issues.some((i) => i.code === 'UNKNOWN_SOURCE_REFERENCE'));
      assert.ok(guardResult.issues.some((i) => i.code === 'UNKNOWN_EVIDENCE_REFERENCE'));
    });
  });

  describe('3. Numerical Claim Guard', () => {
    test('menerima persentase faktual (85%) yang terdaftar dalam ResearchBrief', async () => {
      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);
      assert.strictEqual(result.guardResult.issues.some((i) => i.code === 'UNSUPPORTED_NUMERICAL_CLAIM'), false);
    });

    test('menandai UNSUPPORTED_NUMERICAL_CLAIM jika ada angka persentase liar tanpa grounding', async () => {
      mockProvider.setConfig({ injectUngroundedNumber: true });

      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);
      assert.strictEqual(result.guardResult.status, 'FAIL');
      assert.ok(
        result.guardResult.issues.some(
          (i) => i.code === 'UNSUPPORTED_NUMERICAL_CLAIM' && i.contextSnippet === '99.7%'
        )
      );
    });
  });

  describe('4. Quote Guard', () => {
    test('menerima kutipan langsung jika verbatim terdaftar dalam evidenceIndex', async () => {
      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);
      assert.strictEqual(result.guardResult.issues.some((i) => i.code === 'UNSUPPORTED_QUOTE'), false);
    });

    test('menandai UNSUPPORTED_QUOTE jika kutipan langsung dikarang', async () => {
      mockProvider.setConfig({ injectInventedQuote: true });

      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);
      assert.strictEqual(result.guardResult.status, 'FAIL');
      assert.ok(result.guardResult.issues.some((i) => i.code === 'UNSUPPORTED_QUOTE'));
    });
  });

  describe('5. Preservation of Limitations & Counter-Evidence', () => {
    test('memperingatkan jika ResearchBrief memiliki limitasi tetapi draf mengabaikannya', async () => {
      const guard = new GroundingGuard();

      // Draf tanpa seksi counterpoint dan tanpa kata kunci limitasi
      const draftWithoutLimitation: ArticleDraft = {
        id: 'draft-no-limitation',
        topicId: sampleTopic.id,
        researchProjectId: sampleTopic.id,
        title: 'Judul',
        territory: 'TACTICAL',
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        thesis: 'Tesis yang sah dan panjangnya memenuhi syarat doktrin.',
        editorialAngle: 'Sudut pandang',
        sections: [
          {
            id: 'sec-1',
            purpose: 'HOOK',
            content: 'Pengantar yang optimistis tanpa batasan apa pun.',
            order: 1,
            claimUsageIds: []
          },
          {
            id: 'sec-2',
            purpose: 'ARGUMENT',
            content: 'Argumen mutlak bahwa strategi ini pasti berhasil untuk siapa saja.',
            order: 2,
            claimUsageIds: []
          }
        ],
        claimUsages: [],
        citationMap: [],
        status: 'GENERATED',
        generatedAt: new Date().toISOString(),
        generatorVersion: 'v1.0',
        promptVersion: 'v1.0'
      };

      const guardResult = guard.evaluate(draftWithoutLimitation, sampleBrief);
      assert.ok(
        guardResult.issues.some((i) => i.code === 'MATERIAL_LIMITATION_OMITTED'),
        'Harus memperingatkan ketiadaan pengungkapan limitasi riset'
      );
    });

    test('memperingatkan jika klaim bersengketa (disputedClaims) disajikan tanpa perimbangan counterpoint', async () => {
      mockProvider.setConfig({ omitCounterpointForDisputed: true });

      const guard = new GroundingGuard();

      const draftWithDisputedClaim: ArticleDraft = {
        id: 'draft-disputed-unbalanced',
        topicId: sampleTopic.id,
        researchProjectId: sampleTopic.id,
        title: 'Judul',
        territory: 'TACTICAL',
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        thesis: 'Tesis yang sah dan panjangnya memenuhi syarat doktrin.',
        editorialAngle: 'Sudut pandang',
        sections: [
          {
            id: 'sec-1',
            purpose: 'EVIDENCE',
            content: 'Klaim sepihak tanpa seksi tandingan.',
            order: 1,
            claimUsageIds: ['cu-disputed-1']
          }
        ],
        claimUsages: [
          {
            id: 'cu-disputed-1',
            claimId: 'claim-disputed-001', // Terdaftar di disputedClaims
            sectionId: 'sec-1',
            usageType: 'DIRECT',
            statement: 'Semua query akan dijawab tanpa klik.'
          }
        ],
        citationMap: [],
        status: 'GENERATED',
        generatedAt: new Date().toISOString(),
        generatorVersion: 'v1.0',
        promptVersion: 'v1.0'
      };

      const guardResult = guard.evaluate(draftWithDisputedClaim, sampleBrief);
      assert.ok(
        guardResult.issues.some((i) => i.code === 'DISPUTED_CLAIM_UNBALANCED'),
        'Harus memperingatkan penyajian klaim sengketa tanpa counterpoint'
      );
    });
  });

  describe('6. Article Type Behavior & Diversity', () => {
    test('struktur HOW_TO berfokus pada FRAMEWORK dan PRACTICAL_APPLICATION, berbeda dari ANALYSIS', async () => {
      const planHowTo = await mockProvider.createEditorialPlan({
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'HOW_TO',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi',
        primaryObjective: 'Panduan eksekusi'
      });

      const purposesHowTo = planHowTo.sectionPlan.map((s) => s.purpose);
      assert.ok(purposesHowTo.includes('PRACTICAL_APPLICATION'));
      assert.ok(purposesHowTo.includes('FRAMEWORK'));

      const planAnalysis = await mockProvider.createEditorialPlan({
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi',
        primaryObjective: 'Analisis mendalam'
      });

      const purposesAnalysis = planAnalysis.sectionPlan.map((s) => s.purpose);
      assert.ok(purposesAnalysis.includes('ARGUMENT'));
      assert.ok(purposesAnalysis.includes('EVIDENCE'));
      assert.ok(purposesAnalysis.includes('COUNTERPOINT'));
    });

    test('struktur GLOSSARY ringkas dan berfokus pada CONTEXT & DEFINISI, berbeda dari ORIGINAL_RESEARCH', async () => {
      const planGlossary = await mockProvider.createEditorialPlan({
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'GLOSSARY',
        editorialRole: 'REFERENCE',
        territory: 'TACTICAL',
        audience: 'Pembaca umum',
        primaryObjective: 'Definisi istilah'
      });

      assert.strictEqual(planGlossary.sectionPlan.length, 2);

      const planOriginalResearch = await mockProvider.createEditorialPlan({
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ORIGINAL_RESEARCH',
        editorialRole: 'FLAGSHIP',
        territory: 'INTELLIGENCE',
        audience: 'Peneliti & Analis',
        primaryObjective: 'Studi primer empiris'
      });

      assert.ok(planOriginalResearch.sectionPlan.length >= 5);
      const purposesOR = planOriginalResearch.sectionPlan.map((s) => s.purpose);
      assert.ok(purposesOR.includes('EVIDENCE'));
      assert.ok(purposesOR.includes('COUNTERPOINT'));
    });
  });

  describe('7. Information Gain & Commodity Risk', () => {
    test('menandai COMMODITY_DRAFT_RISK bila artikel peran FLAGSHIP atau AUTHORITY tidak menyertakan kerangka kerja orisinal NexaMOS', async () => {
      mockProvider.setConfig({ commodityOnly: true });

      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi Pemasaran',
        primaryObjective: 'Otoritas blog'
      };

      const result = await service.generateDraft(request);
      assert.ok(
        result.guardResult.issues.some((i) => i.code === 'COMMODITY_DRAFT_RISK'),
        'Harus menandai risiko komoditas bila tanpa framework/implication orisinal'
      );
    });
  });

  describe('8. Full End-to-End Orchestration Scenario: "Apakah aktivitas blog masih relevan di era AI?"', () => {
    test('menghasilkan draft terstruktur, berbobot, ter-grounding, dan berstatus READY_FOR_EDITORIAL_REVIEW', async () => {
      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: sampleBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'CMO, VP of Marketing, dan Praktisi SEO/Content',
        primaryObjective: 'Menetapkan arsitektur konten baru di era pencarian bertenaga AI',
        editorialAngle: 'Pergeseran fungsi dari traffic acquisition ke entity authority & owned knowledge moat',
        targetLength: { minWords: 800, maxWords: 1500 }
      };

      const result = await generator.generate(request);

      assert.strictEqual(result.success, true);
      assert.ok(result.draft);
      assert.strictEqual(result.draft.status, 'READY_FOR_EDITORIAL_REVIEW');
      assert.strictEqual(result.draft.articleType, 'ANALYSIS');
      assert.strictEqual(result.draft.editorialRole, 'AUTHORITY');
      assert.strictEqual(result.draft.territory, 'TACTICAL');

      // Verifikasi Tesis
      assert.ok(result.draft.thesis.includes('Blog tetap relevan di era AI'));
      assert.ok(result.draft.thesis.includes('owned knowledge'));

      // Verifikasi Struktur Seksi (HOOK, CONTEXT, ARGUMENT, EVIDENCE, FRAMEWORK, COUNTERPOINT, IMPLICATION, CONCLUSION)
      assert.ok(result.draft.sections.length >= 6);
      const purposes = result.draft.sections.map((s) => s.purpose);
      assert.ok(purposes.includes('HOOK'));
      assert.ok(purposes.includes('CONTEXT'));
      assert.ok(purposes.includes('ARGUMENT'));
      assert.ok(purposes.includes('EVIDENCE'));
      assert.ok(purposes.includes('FRAMEWORK'));
      assert.ok(purposes.includes('COUNTERPOINT'));
      assert.ok(purposes.includes('CONCLUSION'));

      // Verifikasi Claim Usages & Citation Map
      assert.ok(result.draft.claimUsages.length > 0);
      assert.strictEqual(result.draft.claimUsages[0].claimId, 'claim-retention-001');

      assert.ok(result.draft.citationMap.length > 0);
      assert.strictEqual(result.draft.citationMap[0].claimId, 'claim-retention-001');
      assert.deepStrictEqual(result.draft.citationMap[0].sourceIds, ['src-seo-report-2025']);
      assert.deepStrictEqual(result.draft.citationMap[0].evidenceIds, ['ev-seo-report-quote-001']);

      // Verifikasi Metrik
      assert.ok(result.metrics);
      assert.ok(result.metrics.totalWordCount > 100);
      assert.strictEqual(result.metrics.distinctSourcesCited, 1);
      assert.strictEqual(result.metrics.citationCount, 2);
    });

    test('menolak eksekusi jika ResearchBrief berstatus NOT_READY', async () => {
      const notReadyBrief: ResearchBrief = {
        ...sampleBrief,
        readiness: 'NOT_READY',
        readinessReason: 'Bukti primer belum mencukupi'
      };

      const request: EditorialGenerationRequest = {
        topic: sampleTopic,
        researchBrief: notReadyBrief,
        articleType: 'ANALYSIS',
        editorialRole: 'AUTHORITY',
        territory: 'TACTICAL',
        audience: 'Praktisi',
        primaryObjective: 'Uji kesiapan'
      };

      const result = await generator.generate(request);
      assert.strictEqual(result.success, false);
      assert.ok(!result.draft);
      assert.ok(result.errors && result.errors[0].includes('RESEARCH_BRIEF_NOT_READY'));
    });
  });
});
