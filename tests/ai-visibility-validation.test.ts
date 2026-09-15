/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 5C Tests: AI Visibility Readiness Validator
 *
 * Menguji seluruh layer validasi AI Visibility:
 * - Google AI Eligibility (indexability, GSC inclusion status, snippet eligibility)
 * - Retrieval Readiness (human-first coherence, no micro-chunking penalty)
 * - Answerability (explicit problem answering, no FAQ spam penalty)
 * - Entity Clarity (naming consistency, undefined acronym detection)
 * - Claim Clarity (bounded claims, anti-overclaim guard)
 * - Citation Readiness (evidence traceability, locator completeness)
 * - Source Transparency (author/publisher provenance, date clarity)
 * - Information Gain (non-commodity knowledge, proprietary framework)
 * - Content Accessibility (no paywall, interaction-free, JS review)
 * - Multimodal Readiness (diagrams & alt-text, no mandatory video)
 * - Anti-GEO-Hack Guardrails (no penalty for missing llms.txt, AI schema, etc.)
 * - Scoring, Classification & Master Validation Service Orchestration
 *
 * Menegakkan doktrin:
 * AI VISIBILITY READINESS ≠ AI CITATION GUARANTEE
 * AI VISIBILITY VALIDATOR ≠ SEARCH RANKING PREDICTOR
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import type { ArticleDraft } from '../engines/editorial/article-draft.ts';
import type { ArticleSection } from '../engines/editorial/article-section.ts';
import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../engines/research/orchestrator/research-brief.ts';
import type { ArticleSEOMetadata } from '../engines/seo-validator/article-seo-metadata.ts';
import {
  AIVisibilityValidationService,
  GoogleAIEligibilityValidator,
  RetrievalReadinessValidator,
  AnswerabilityValidator,
  EntityClarityValidator,
  ClaimClarityValidator,
  CitationReadinessValidator,
  SourceTransparencyValidator,
  InformationGainValidator,
  ContentAccessibilityValidator,
  MultimodalReadinessValidator,
  AIVisibilityScoreCalculator,
  AIVisibilityRecommendationEngine,
  MockAIVisibilityProvider,
  AI_VISIBILITY_DIMENSION_WEIGHTS
} from '../engines/ai-visibility/index.ts';

function makeSection(
  id: string,
  heading: string,
  content: string,
  purpose: any,
  order = 1
): ArticleSection {
  return {
    id,
    heading,
    content,
    purpose,
    order,
    claimUsageIds: []
  };
}

describe('Phase 5C Tests: AI Visibility Readiness Validator', () => {
  let sampleDraft: ArticleDraft;
  let sampleTopic: Topic;
  let sampleBrief: ResearchBrief;
  let sampleMetadata: ArticleSEOMetadata;
  let visibilityService: AIVisibilityValidationService;

  beforeEach(() => {
    sampleTopic = {
      id: 'top-ai-vis-001',
      title: 'Arsitektur Informasi untuk Mesin Retrieval dan Grounding Generatif',
      slug: 'arsitektur-informasi-untuk-mesin-retrieval',
      territory: 'STRATEGY',
      status: 'APPROVED',
      editorialRole: 'AUTHORITY',
      audience: {
        segment: 'Pemimpin Rekayasa Informasi & Strategis Konten',
        knowledgeLevel: 'ADVANCED',
        jobToBeDone: 'Penurunan visibilitas pada ringkasan AI dan kekaburan atribusi sumber'
      },
      whyNow: 'Munculnya fitur Google AI Overviews dan AI Mode yang membutuhkan kepakaran terstruktur.',
      problem: 'Bagaimana arsitektur informasi dapat dirancang agar argumen dan data primer dapat diretrieve secara presisi oleh LLM tanpa trik manipulatif?',
      intent: { primary: 'Membangun arsitektur informasi untuk sistem AI retrieval' },
      thesis: 'Sistem retrieval AI memprioritaskan dokumen dengan batas klaim terukur, entitas konsisten, dan bukti yang dapat dilacak secara eksplisit.',
      informationGain: {
        originalityType: ['ORIGINAL_FRAMEWORK', 'ORIGINAL_RESEARCH'],
        expectedContribution: 'Menyajikan kerangka kerja keterlacakan bukti epistemik NexaMOS.',
        commodityRisk: 'LOW'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E2',
        plannedSources: ['Google Search Central'],
        originalEvidenceRequired: true
      },
      businessRelevance: {
        objective: 'Authority positioning',
        funnelRole: 'TOFU'
      },
      recommendedArticleType: 'DEEP_DIVE',
      distributionTargets: ['BLOG', 'NEWSLETTER'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z'
    };

    sampleDraft = {
      id: 'draft-ai-vis-001',
      topicId: 'top-ai-vis-001',
      researchProjectId: 'proj-001',
      title: 'Desain Arsitektur Informasi untuk Retrieval dan Grounding Generatif',
      dek: 'Analisis mengenai cara menyusun konten otoritatif yang terstruktur bagi model bahasa dan sistem penelusuran.',
      slug: 'desain-arsitektur-informasi-untuk-retrieval',
      territory: 'STRATEGY',
      articleType: 'DEEP_DIVE',
      editorialRole: 'AUTHORITY',
      thesis: 'Sistem retrieval AI memprioritaskan dokumen dengan batas klaim terukur, entitas konsisten, dan bukti yang dapat dilacak secara eksplisit.',
      editorialAngle: 'Perspektif rekayasa informasi melawan ilusi optimasi format mikro.',
      sections: [
        makeSection(
          'sec-001',
          'Pergeseran Lanskap Pencarian Menuju Mesin Penjawab',
          'Evolusi mesin pencari modern seperti Google Search dengan fitur Google AI Overviews mengubah cara pengguna memperoleh sintesis informasi.',
          'CONTEXT',
          1
        ),
        makeSection(
          'sec-002',
          'Bukti Keterlacakan Data pada Model Bahasa',
          'Berdasarkan pengujian retensi bukti pada 500 kueri kompleks, kutipan eksplisit dengan locator meningkatkan akurasi sitasi sebesar 40%.',
          'EVIDENCE',
          2
        ),
        makeSection(
          'sec-003',
          'Framework Otoritas Informasi NexaMOS',
          'Kerangka kerja NexaMOS menghubungkan entitas kunci dengan klaim terikat (bounded claims) dan sumber primer.',
          'FRAMEWORK',
          3
        ),
        makeSection(
          'sec-004',
          'Bantahan Terhadap Praktik Micro-Chunking Artifisial',
          'Menulis teks yang dipecah secara artifisial merusak koherensi narasi manusia tanpa memberikan peningkatan retrieval yang berarti.',
          'COUNTERPOINT',
          4
        ),
        makeSection(
          'sec-005',
          'Implikasi Strategis bagi Penerbit Konten Digital',
          'Penerbit perlu memfokuskan investasi pada riset primer dan penamaan entitas yang konsisten untuk membangun otoritas jangka panjang.',
          'IMPLICATION',
          5
        )
      ],
      claimUsages: [],
      citationMap: [
        {
          claimUsageId: 'cu-001',
          claimId: 'cl-001',
          sourceIds: ['src-001'],
          evidenceIds: ['ev-001']
        }
      ],
      status: 'READY_FOR_EDITORIAL_REVIEW',
      generatedAt: '2026-09-10T10:00:00.000Z',
      generatorVersion: 'v1',
      promptVersion: 'v1'
    };

    (sampleDraft as any).references = [
      {
        title: 'Google Search Central Documentation on Generative AI',
        url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
        locator: 'Section 3: Helpful Content Principles'
      }
    ];

    sampleBrief = {
      id: 'brief-001',
      topicId: 'top-ai-vis-001',
      researchProjectId: 'proj-001',
      objective: 'Mengevaluasi arsitektur informasi untuk retrieval',
      answeredQuestions: [],
      openQuestions: [],
      supportedClaims: [],
      partiallySupportedClaims: [],
      disputedClaims: [],
      keyFindings: [],
      limitations: [],
      researchGaps: [],
      sourceIndex: [],
      evidenceIndex: [],
      readiness: 'READY_FOR_EDITORIAL',
      generatedAt: '2026-09-02T00:00:00.000Z'
    };

    sampleMetadata = {
      title: 'Desain Arsitektur Informasi untuk Retrieval dan Grounding Generatif',
      description: 'Panduan menyusun konten dengan arsitektur informasi yang kokoh untuk visibilitas dan sitasi pada mesin AI.',
      slug: 'desain-arsitektur-informasi-untuk-retrieval',
      canonicalUrl: 'https://nexamos.com/blog/desain-arsitektur-informasi-untuk-retrieval',
      robots: {
        index: true,
        follow: true
      },
      author: {
        name: 'Tim Riset Redaksi NexaMOS',
        role: 'Research Directorate'
      },
      publisher: {
        name: 'NexaMOS Editorial Board',
        logoUrl: 'https://nexamos.com/logo.png'
      },
      publishedAt: '2026-09-14T08:00:00.000Z',
      updatedAt: '2026-09-14T12:00:00.000Z'
    };

    visibilityService = new AIVisibilityValidationService();
  });

  // =========================================================================
  // SUITE 1: Google AI Eligibility Validator
  // =========================================================================
  describe('1. Google AI Eligibility Validator', () => {
    const validator = new GoogleAIEligibilityValidator();

    test('Artikel terindeks dan lengkap lolos kelayakan penuh (ELIGIBLE)', () => {
      const res = validator.validate(sampleDraft, sampleMetadata, 'INCLUDED');
      assert.strictEqual(res.eligibility, 'ELIGIBLE');
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
      assert.strictEqual(res.issues.length, 0);
    });

    test('BLOCKED_BY_SITE_CONTROL jika kontrol Search Console disetel EXCLUDED', () => {
      const res = validator.validate(sampleDraft, sampleMetadata, 'EXCLUDED');
      assert.strictEqual(res.eligibility, 'BLOCKED_BY_SITE_CONTROL');
      assert.strictEqual(res.score, 0);
      assert.strictEqual(res.checkResult.status, 'FAIL');
      const issue = res.issues.find((i) => i.code === 'GENERATIVE_AI_SITE_EXCLUDED');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });

    test('INELIGIBLE jika robots direktif menyetel noindex', () => {
      const noindexMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        robots: { index: false, follow: true }
      };
      const res = validator.validate(sampleDraft, noindexMeta, 'INCLUDED');
      assert.strictEqual(res.eligibility, 'INELIGIBLE');
      assert.strictEqual(res.score, 0);
      const issue = res.issues.find((i) => i.code === 'ARTICLE_NOT_INDEXABLE');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });

    test('INELIGIBLE jika naskah tidak memiliki judul atau seksi konten primer', () => {
      const emptyDraft: ArticleDraft = {
        ...sampleDraft,
        title: '',
        sections: []
      };
      const res = validator.validate(emptyDraft, sampleMetadata, 'INCLUDED');
      assert.strictEqual(res.eligibility, 'INELIGIBLE');
      const issue = res.issues.find((i) => i.code === 'PRIMARY_CONTENT_UNAVAILABLE');
      assert.ok(issue);
    });

    test('Peringatan jika direktif max-snippet dibatasi ke 0 (nosnippet)', () => {
      const snippetRestrictedMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        robots: { index: true, follow: true, maxSnippet: 0 } as any
      };
      const res = validator.validate(sampleDraft, snippetRestrictedMeta, 'INCLUDED');
      assert.strictEqual(res.eligibility, 'ELIGIBILITY_WARNING');
      assert.strictEqual(res.score, 7);
      const issue = res.issues.find((i) => i.code === 'SNIPPET_ELIGIBILITY_WARNING');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 2: Retrieval Readiness Validator
  // =========================================================================
  describe('2. Retrieval Readiness Validator', () => {
    const validator = new RetrievalReadinessValidator();

    test('Naskah koheren dengan heading semantis memperoleh skor penuh (12)', () => {
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.retrievability, 'HIGH');
      assert.strictEqual(res.score, 12);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin: Ketiadaan micro-chunking artifisial TIDAK dihukum', () => {
      // Artikel esai alami dengan paragraf lengkap
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.score, 12);
      assert.strictEqual(res.issues.some((i) => i.code === 'RETRIEVAL_COHERENCE_WEAK'), false);
    });

    test('Menandai HEADING_HIERARCHY_AMBIGUOUS jika heading terlalu generik atau pendek', () => {
      const ambiguousDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection('sec-amb-1', 'Hal', 'Uraian tentang sesuatu.', 'CONTEXT', 1),
          makeSection('sec-amb-2', 'Lain-lain', 'Catatan tambahan.', 'CONTEXT', 2)
        ]
      };
      const res = validator.validate(ambiguousDraft, sampleTopic);
      assert.ok(res.score < 12);
      const issue = res.issues.find((i) => i.code === 'HEADING_HIERARCHY_AMBIGUOUS');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 3: Answerability Validator
  // =========================================================================
  describe('3. Answerability Validator', () => {
    const validator = new AnswerabilityValidator();

    test('Naskah dengan masalah audiens jelas dan kesimpulan solutif berstatus STRONG (12)', () => {
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.answerability, 'STRONG');
      assert.strictEqual(res.score, 12);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin: Ketiadaan format FAQ spam TIDAK dihukum', () => {
      // Tidak ada format FAQ di sampleDraft, tetap STRONG
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.answerability, 'STRONG');
      assert.strictEqual(res.score, 12);
    });

    test('Menandai VAGUE_ANSWERABILITY dan MISSING_EXPLICIT_CONCLUSION jika masalah kabur dan tanpa penutup', () => {
      const vagueDraft: ArticleDraft = {
        ...sampleDraft,
        thesis: '',
        sections: [
          makeSection('sec-vag-1', 'Pengantar Awal', 'Hanya narasi awal.', 'CONTEXT', 1)
        ]
      };
      const emptyProblemTopic: Topic = {
        ...sampleTopic,
        problem: ''
      };
      const res = validator.validate(vagueDraft, emptyProblemTopic);
      assert.strictEqual(res.answerability, 'WEAK');
      assert.ok(res.score <= 5);
      assert.ok(res.issues.some((i) => i.code === 'VAGUE_ANSWERABILITY'));
      assert.ok(res.issues.some((i) => i.code === 'MISSING_EXPLICIT_CONCLUSION'));
    });
  });

  // =========================================================================
  // SUITE 4: Entity Clarity Validator
  // =========================================================================
  describe('4. Entity Clarity Validator', () => {
    const validator = new EntityClarityValidator();

    test('Entitas resmi konsisten ("Google AI Overviews", "Google Search") memperoleh skor 10', () => {
      const res = validator.validate(sampleDraft);
      assert.strictEqual(res.entityClarity, 'HIGH');
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai UNDEFINED_ACRONYM jika terdapat singkatan industri tanpa penjelasan awal', () => {
      const acronymDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection(
            'sec-acr-1',
            'Metrik Pertumbuhan',
            'Optimasi nilai CAC dan LTV menjadi tolok ukur utama keberhasilan pemasaran.',
            'CONTEXT',
            1
          )
        ]
      };
      const res = validator.validate(acronymDraft);
      assert.ok(res.score < 10);
      const issue = res.issues.find((i) => i.code === 'UNDEFINED_ACRONYM');
      assert.ok(issue);
    });

    test('Menandai AMBIGUOUS_ENTITY_NAMING jika terdapat variasi nama entitas campur aduk', () => {
      const mixedDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection(
            'sec-mix-1',
            'Perbandingan Fitur',
            'Fitur AI Overview dapat membantu pengguna, sementara AI Overviews terus berkembang.',
            'CONTEXT',
            1
          )
        ]
      };
      const res = validator.validate(mixedDraft);
      assert.ok(res.score < 10);
      const issue = res.issues.find((i) => i.code === 'AMBIGUOUS_ENTITY_NAMING');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 5: Claim Clarity Validator
  // =========================================================================
  describe('5. Claim Clarity Validator', () => {
    const validator = new ClaimClarityValidator();

    test('Klaim terukur dan bernuansa analitis (bounded claim) memperoleh skor 10', () => {
      const res = validator.validate(sampleDraft);
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai OVERCLAIMED_STATEMENT jika ada generalisasi absolut tanpa batasan', () => {
      const overclaimDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection(
            'sec-ovr-1',
            'Dampak Mutlak',
            'Strategi lama ini dijamin 100% pasti hancur total tanpa terkecuali.',
            'CONTEXT',
            1
          )
        ]
      };
      const res = validator.validate(overclaimDraft);
      assert.ok(res.score <= 5);
      const issue = res.issues.find((i) => i.code === 'OVERCLAIMED_STATEMENT');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 6: Citation Readiness Validator
  // =========================================================================
  describe('6. Citation Readiness Validator', () => {
    const validator = new CitationReadinessValidator();

    test('Klaim dengan seksi pembuktian dan referensi ber-locator berstatus FULL (12)', () => {
      const res = validator.validate(sampleDraft, sampleBrief);
      assert.strictEqual(res.claimTraceability, 'FULL');
      assert.strictEqual(res.score, 12);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin Keras: Menilai keterlacakan, bukan menjamin bahwa AI akan mengutip naskah', () => {
      const res = validator.validate(sampleDraft, sampleBrief);
      assert.strictEqual(res.claimTraceability, 'FULL');
      // Tidak ada properti garansi sitasi
      assert.strictEqual((res as any).willBeCitedByAI, undefined);
    });

    test('Menandai UNSUPPORTED_CITATION jika memuat seksi pembuktian tanpa referensi pendukung', () => {
      const ungroundedDraft: ArticleDraft = {
        ...sampleDraft
      };
      delete (ungroundedDraft as any).references;
      ungroundedDraft.citationMap = [];

      const res = validator.validate(ungroundedDraft, null);
      assert.ok(res.score <= 7);
      const issue = res.issues.find((i) => i.code === 'UNSUPPORTED_CITATION');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 7: Source Transparency Validator
  // =========================================================================
  describe('7. Source Transparency Validator', () => {
    const validator = new SourceTransparencyValidator();

    test('Penulis, penerbit, dan tanggal transparan berstatus TRANSPARENT (8)', () => {
      const res = validator.validate(sampleDraft, sampleMetadata);
      assert.strictEqual(res.sourceTransparency, 'TRANSPARENT');
      assert.strictEqual(res.score, 8);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai OPAQUE_AUTHORSHIP jika penulis dan penerbit tidak tercantum', () => {
      const anonymousMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        author: undefined,
        publisher: undefined
      };
      const res = validator.validate(sampleDraft, anonymousMeta);
      assert.ok(res.score < 8);
      const issue = res.issues.find((i) => i.code === 'OPAQUE_AUTHORSHIP');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 8: Information Gain Validator
  // =========================================================================
  describe('8. Information Gain Validator', () => {
    const validator = new InformationGainValidator();

    test('Framework mandiri dan riset primer berstatus HIGH dengan skor 16', () => {
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.informationGain, 'HIGH');
      assert.strictEqual(res.score, 16);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai COMMODITY_CONTENT_RISK jika risiko komoditas tinggi tanpa framework orisinal', () => {
      const commodityTopic: Topic = {
        ...sampleTopic,
        informationGain: {
          originalityType: [],
          expectedContribution: 'Rangkuman umum web.',
          commodityRisk: 'HIGH'
        }
      };
      const shallowDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection('sec-shal-1', 'Rangkuman Umum', 'Hanya rangkuman web.', 'CONTEXT', 1)
        ]
      };
      const res = validator.validate(shallowDraft, commodityTopic);
      assert.strictEqual(res.informationGain, 'LOW');
      assert.ok(res.score <= 4);
      const issue = res.issues.find((i) => i.code === 'COMMODITY_CONTENT_RISK');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 9: Content Accessibility Validator
  // =========================================================================
  describe('9. Content Accessibility Validator', () => {
    const validator = new ContentAccessibilityValidator();

    test('Teks primer terbuka tanpa rintangan memperoleh skor penuh (7)', () => {
      const res = validator.validate(sampleDraft, null);
      assert.strictEqual(res.score, 7);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai PAYWALL_ACCESS_RESTRICTION jika konten terkunci paywall', () => {
      const res = validator.validate(sampleDraft, { isPaywallRestricted: true });
      assert.ok(res.score <= 3);
      const issue = res.issues.find((i) => i.code === 'PAYWALL_ACCESS_RESTRICTION');
      assert.ok(issue);
    });

    test('Doktrin: JavaScript rendering review bersifat info dan bukan pemblokiran mutlak', () => {
      const res = validator.validate(sampleDraft, { reliesExclusivelyOnClientSideRendering: true });
      assert.strictEqual(res.score, 5);
      const issue = res.issues.find((i) => i.code === 'JS_RENDERING_REVIEW');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'INFO');
    });
  });

  // =========================================================================
  // SUITE 10: Multimodal Readiness Validator
  // =========================================================================
  describe('10. Multimodal Readiness Validator', () => {
    const validator = new MultimodalReadinessValidator();

    test('Aset visual dengan diagram konseptual memperoleh skor 3', () => {
      const res = validator.validate(sampleDraft, {
        primaryAsset: { url: 'https://nexamos.com/diag.png', alt: 'Diagram Arsitektur Grounding' },
        hasConceptualDiagram: true
      });
      assert.strictEqual(res.score, 3);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin: Ketiadaan video TIDAK dipotong skornya', () => {
      const res = validator.validate(sampleDraft, {
        primaryAsset: { url: 'https://nexamos.com/diag.png', alt: 'Diagram Arsitektur Grounding' },
        hasConceptualDiagram: true,
        hasVideoAttachment: false // Tanpa video
      });
      assert.strictEqual(res.score, 3);
      assert.strictEqual(res.issues.length, 0);
    });

    test('Menandai MISSING_EXPLANATORY_VISUAL jika tidak ada visual sama sekali', () => {
      const res = validator.validate(sampleDraft, null);
      assert.strictEqual(res.score, 1);
      const issue = res.issues.find((i) => i.code === 'MISSING_EXPLANATORY_VISUAL');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'INFO');
    });
  });

  // =========================================================================
  // SUITE 11: Score & Classification Unit Tests
  // =========================================================================
  describe('11. Score & Classification Tests', () => {
    const calculator = new AIVisibilityScoreCalculator();

    test('Total bobot 10 dimensi tepat 100', () => {
      const totalWeight = Object.values(AI_VISIBILITY_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
      assert.strictEqual(totalWeight, 100);
    });

    test('Klasifikasi bertingkat: STRONG (>=90), READY (80-89), READY_WITH_WARNINGS (70-79)', () => {
      assert.strictEqual(calculator.determineClassification(92, 'ELIGIBLE', []), 'STRONG');
      assert.strictEqual(calculator.determineClassification(85, 'ELIGIBLE', []), 'READY');
      assert.strictEqual(calculator.determineClassification(74, 'ELIGIBLE', []), 'READY_WITH_WARNINGS');
      assert.strictEqual(calculator.determineClassification(65, 'ELIGIBLE', []), 'REVISION_REQUIRED');
    });

    test('Hard blocking issue mutlak mengesampingkan skor numerik menjadi BLOCKED', () => {
      const criticalIssue = {
        code: 'GENERATIVE_AI_SITE_EXCLUDED' as any,
        checkId: 'AI_GOOGLE_ELIGIBILITY' as any,
        dimension: 'GOOGLE_AI_ELIGIBILITY' as any,
        severity: 'CRITICAL' as any,
        message: 'Excluded'
      };
      assert.strictEqual(calculator.determineClassification(98, 'BLOCKED_BY_SITE_CONTROL', [criticalIssue]), 'BLOCKED');
      assert.strictEqual(calculator.determineClassification(98, 'INELIGIBLE', []), 'BLOCKED');
    });
  });

  // =========================================================================
  // SUITE 12: Master AIVisibilityValidationService Orchestration & Anti-GEO Hacks
  // =========================================================================
  describe('12. Master AIVisibilityValidationService & Anti-GEO Hacks', () => {
    test('Artikel optimal memperoleh klasifikasi STRONG dengan skor >= 90', async () => {
      const result = await visibilityService.validate(sampleDraft, {
        topic: sampleTopic,
        brief: sampleBrief,
        metadata: sampleMetadata,
        inclusionStatus: 'INCLUDED',
        multimodalSignals: {
          primaryAsset: { url: 'https://nexamos.com/arch.png', alt: 'Diagram Arsitektur Informasi' },
          hasConceptualDiagram: true
        }
      });

      assert.strictEqual(result.googleEligibility, 'ELIGIBLE');
      assert.strictEqual(result.classification, 'STRONG');
      assert.ok(result.score >= 90);
      assert.strictEqual(result.criticalBlockingReasons.length, 0);
      assert.strictEqual(result.policyVersion, 'AI_VISIBILITY_READINESS_POLICY_V1');
      assert.strictEqual(result.providerNeutralReadiness.retrievability, 'HIGH');
      assert.strictEqual(result.providerNeutralReadiness.answerability, 'STRONG');
      assert.strictEqual(result.providerNeutralReadiness.informationGain, 'HIGH');
    });

    test('Status Search Console EXCLUDED memicu status BLOCKED dengan alasan spesifik', async () => {
      const result = await visibilityService.validate(sampleDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata,
        inclusionStatus: 'EXCLUDED'
      });

      assert.strictEqual(result.googleEligibility, 'BLOCKED_BY_SITE_CONTROL');
      assert.strictEqual(result.classification, 'BLOCKED');
      assert.ok(result.criticalBlockingReasons.some((r) => r.includes('GENERATIVE_AI_SITE_EXCLUDED')));
    });

    test('Anti-GEO-Hack: Ketiadaan llms.txt dan ketiadaan special AI schema TIDAK memotong skor', async () => {
      const result = await visibilityService.validate(sampleDraft, {
        topic: sampleTopic,
        brief: sampleBrief,
        metadata: sampleMetadata,
        inclusionStatus: 'INCLUDED',
        multimodalSignals: {
          primaryAsset: { url: 'https://nexamos.com/arch.png', alt: 'Diagram Arsitektur Informasi' },
          hasConceptualDiagram: true
        }
      });

      // Skor tetap prima (>= 90) tanpa penalti llms.txt
      assert.ok(result.score >= 90);
      assert.strictEqual(result.issues.some((i) => i.code === 'AI_OPTIMIZATION_ABUSE_RISK'), false);
    });

    test('Rekomendasi diarahkan ke domain yang berwenang (EDITORIAL, RESEARCH, SEO_TECHNICAL, VISUAL)', async () => {
      const problematicDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          makeSection('sec-prob-1', 'Hal', 'Penjelasan umum dijamin 100% pasti hancur total.', 'CONTEXT', 1), // Memicu OVERCLAIMED -> EDITORIAL
          makeSection('sec-prob-2', 'Temuan Data Statistik', 'Data analitik menunjukkan perubahan drastis.', 'EVIDENCE', 2)
        ]
      };
      delete (problematicDraft as any).references;
      problematicDraft.citationMap = [];

      const result = await visibilityService.validate(problematicDraft, {
        topic: sampleTopic,
        metadata: { ...sampleMetadata, robots: { index: false, follow: true } } // Memicu noindex -> SEO_TECHNICAL
      });

      const researchRec = result.recommendations.find((r) => r.crossEngineDestination === 'RESEARCH');
      assert.ok(researchRec);

      const editorialRec = result.recommendations.find((r) => r.crossEngineDestination === 'EDITORIAL');
      assert.ok(editorialRec);

      const seoRec = result.recommendations.find((r) => r.crossEngineDestination === 'SEO_TECHNICAL');
      assert.ok(seoRec);
    });

    test('Integrasi dengan MockAIVisibilityProvider mendeteksi klaim berlebihan', async () => {
      const aiProvider = new MockAIVisibilityProvider();
      const result = await visibilityService.validate(sampleDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata,
        aiProvider
      });

      assert.strictEqual(result.classification, 'STRONG');
    });

    test('Doktrin Hard Boundary: Tidak menghasilkan data palsu (Rank Prediction / Citation Probability)', async () => {
      const result = await visibilityService.validate(sampleDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata
      });

      const resKeys = Object.keys(result);
      assert.strictEqual(resKeys.includes('aiRankScore'), false);
      assert.strictEqual(resKeys.includes('geoRank'), false);
      assert.strictEqual(resKeys.includes('citationProbability'), false);
      assert.strictEqual(resKeys.includes('aiTrafficEstimate'), false);
    });
  });
});
