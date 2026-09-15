/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 3B Unit & Integration Test Suite: Editorial Quality & Style Engine
 *
 * Menggunakan Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../engines/research/orchestrator/research-brief.ts';
import type { ArticleDraft } from '../engines/editorial/article-draft.ts';

import {
  EditorialQualityEvaluator,
  RevisionPlanner,
  EditorialRevisionService,
  MockAIEditorialReviewProvider,
  ClarityEvaluator,
  CoherenceEvaluator,
  ThesisAlignmentEvaluator,
  RedundancyDetector,
  InformationDensityEvaluator,
  JargonDetector,
  HookEvaluator,
  HeadingEvaluator,
  AIWritingPatternDetector,
  StyleEvaluator,
  DEFAULT_NEXAMOS_TONE_PROFILE
} from '../engines/editorial/review/index.ts';

describe('Phase 3B Tests: Editorial Quality & Style Engine', () => {
  let sampleTopic: Topic;
  let sampleBrief: ResearchBrief;
  let sampleDraft: ArticleDraft;
  let mockProvider: MockAIEditorialReviewProvider;
  let revisionService: EditorialRevisionService;
  let qualityEvaluator: EditorialQualityEvaluator;

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

    // Fixture sintetis terisolasi
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
      disputedClaims: [],
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

    sampleDraft = {
      id: 'draft-blog-001',
      topicId: sampleTopic.id,
      researchProjectId: sampleTopic.id,
      title: 'Apakah Aktivitas Blog Masih Relevan di Era AI?',
      dek: 'Mengapa era kecerdasan buatan justru meningkatkan nilai kepemilikan pengetahuan dan riset orisinal.',
      slug: sampleTopic.slug,
      territory: 'TACTICAL',
      articleType: 'ANALYSIS',
      editorialRole: 'AUTHORITY',
      thesis:
        'Blog tetap relevan di era AI, tetapi fungsinya bergeser dari sekadar agregator traffic menjadi owned knowledge system yang membangun authority dan demand.',
      editorialAngle: 'Pergeseran nilai dari commodity content ke owned knowledge moat',
      sections: [
        {
          id: 'sec-1-hook',
          heading: 'Disrupsi Pencarian di Era Kecerdasan Buatan',
          purpose: 'HOOK',
          content:
            'Banyak yang memperkirakan bahwa kemunculan AI generatif akan mematikan fungsi blog. Namun fakta di lapangan menunjukkan hal sebaliknya: penurunan hanya terjadi pada artikel agregator komoditas.',
          order: 1,
          claimUsageIds: []
        },
        {
          id: 'sec-2-context',
          heading: 'Pergeseran Nilai dari Komoditas ke Otoritas',
          purpose: 'CONTEXT',
          content:
            'Dalam lanskap pencarian saat ini, jawaban cepat AI mendominasi pertanyaan permukaan, sementara pertanyaan strategis membutuhkan kedalaman analisis yang hanya bisa dihasilkan oleh riset terstruktur.',
          order: 2,
          claimUsageIds: []
        },
        {
          id: 'sec-3-argument',
          heading: 'Tesis Inti dan Argumen Otoritas',
          purpose: 'ARGUMENT',
          content:
            'Blog tetap relevan di era AI, tetapi fungsinya bergeser dari sekadar agregator traffic menjadi owned knowledge system yang membangun authority dan demand.',
          order: 3,
          claimUsageIds: ['cu-1']
        },
        {
          id: 'sec-4-evidence',
          heading: 'Bukti Empiris Retensi Pembaca',
          purpose: 'EVIDENCE',
          content:
            'Data empiris menunjukkan bahwa blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator. "Data dari 10.000 domain menunjukkan blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator."',
          order: 4,
          claimUsageIds: ['cu-2']
        },
        {
          id: 'sec-5-framework',
          heading: 'Kerangka Kerja: NexaMOS Content Moat Architecture',
          purpose: 'FRAMEWORK',
          content:
            'NexaMOS Content Moat Framework membagi arsitektur konten menjadi tiga pilar: Proprietary Data, Original Interpretation, dan Direct Relationship.',
          order: 5,
          claimUsageIds: []
        },
        {
          id: 'sec-6-counterpoint',
          heading: 'Limitasi Metodologis dan Pertimbangan Sumber Daya',
          purpose: 'COUNTERPOINT',
          content:
            'Tentu terdapat limitasi dan pandangan tandingan: tidak semua perusahaan memiliki sumber daya untuk melakukan studi primer berskala besar. Oleh karena itu, batasan metodologi dan asumsi harus selalu transparan diungkapkan.',
          order: 6,
          claimUsageIds: []
        },
        {
          id: 'sec-7-implication',
          heading: 'Implikasi Strategis bagi Penerbitan Modern',
          purpose: 'IMPLICATION',
          content:
            'Implikasi taktis bagi tim editorial adalah menghentikan penulisan berbasis volume dan beralih ke siklus penerbitan yang berbasis evidence grounding.',
          order: 7,
          claimUsageIds: []
        },
        {
          id: 'sec-8-conclusion',
          heading: 'Masa Depan Blog Sebagai Sistem Pengetahuan',
          purpose: 'CONCLUSION',
          content:
            'Sebagai kesimpulan, blog bukan lagi sekadar alat perolehan klik murah, melainkan sistem saraf pengetahuan inti yang memvalidasi reputasi institusi.',
          order: 8,
          claimUsageIds: []
        }
      ],
      claimUsages: [
        {
          id: 'cu-1',
          claimId: 'claim-retention-001',
          sectionId: 'sec-3-argument',
          usageType: 'DIRECT',
          statement:
            'Blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator.'
        },
        {
          id: 'cu-2',
          claimId: 'claim-retention-001',
          sectionId: 'sec-4-evidence',
          usageType: 'DIRECT',
          statement:
            'Blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator.'
        }
      ],
      citationMap: [
        {
          claimUsageId: 'cu-1',
          claimId: 'claim-retention-001',
          sourceIds: ['src-seo-report-2025'],
          evidenceIds: ['ev-seo-report-quote-001']
        },
        {
          claimUsageId: 'cu-2',
          claimId: 'claim-retention-001',
          sourceIds: ['src-seo-report-2025'],
          evidenceIds: ['ev-seo-report-quote-001']
        }
      ],
      status: 'READY_FOR_EDITORIAL_REVIEW',
      generatedAt: '2026-03-01T00:00:00.000Z',
      generatorVersion: 'v1.0',
      promptVersion: 'v1.0'
    };

    mockProvider = new MockAIEditorialReviewProvider();
    qualityEvaluator = new EditorialQualityEvaluator();
    revisionService = new EditorialRevisionService({
      aiReviewProvider: mockProvider,
      qualityEvaluator
    });
  });

  describe('1. Clarity & Jargon Evaluation', () => {
    test('menandai kalimat berbelit (run-on sentence) dan buzzword konsultan', () => {
      const clarityEvaluator = new ClarityEvaluator();
      const jargonDetector = new JargonDetector();

      const messyDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-messy',
            purpose: 'CONTEXT',
            content:
              'Ketika kita berbicara mengenai bagaimana perusahaan harus mengembangkan strategi pemasaran mereka di tengah dinamika pasar yang terus berubah secara cepat dan menuntut adaptasi konstan, para pemimpin bisnis sering kali merasa kebingungan untuk menentukan arah, karena tumpukan laporan yang saling bertentangan, yang pada akhirnya membuat mereka kesulitan mengambil keputusan konkret yang tepat waktu dan efisien. Kita perlu men-leverage paradigma baru untuk mencapai holistic synergy.',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const clarityResult = clarityEvaluator.evaluate(messyDraft);
      assert.ok(clarityResult.issues.some((i) => i.code === 'RUN_ON_SENTENCE'));

      const jargonResult = jargonDetector.evaluate(messyDraft);
      assert.ok(jargonResult.issues.some((i) => i.code === 'CONSULTANT_BUZZWORD'));
    });

    test('menerima naskah jernih dan terminologi domain baku yang presisi', () => {
      const clarityEvaluator = new ClarityEvaluator();
      const jargonDetector = new JargonDetector();

      const clarityResult = clarityEvaluator.evaluate(sampleDraft);
      assert.strictEqual(clarityResult.issues.some((i) => i.code === 'RUN_ON_SENTENCE'), false);

      const jargonResult = jargonDetector.evaluate(sampleDraft);
      assert.strictEqual(jargonResult.issues.some((i) => i.code === 'CONSULTANT_BUZZWORD'), false);
    });
  });

  describe('2. Coherence & Thesis Alignment', () => {
    test('mendeteksi THESIS_DRIFT bila seksi tidak memiliki kaitan dengan tesis', () => {
      const thesisEvaluator = new ThesisAlignmentEvaluator();

      const driftedDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          ...sampleDraft.sections,
          {
            id: 'sec-drift',
            heading: 'Tips Memilih Kursi Kantor Ergonomis',
            purpose: 'CONTEXT',
            content: 'Kenyamanan fisik saat bekerja sangat dipengaruhi oleh kualitas sandaran kursi dan tinggi meja kerja.',
            order: 9,
            claimUsageIds: []
          }
        ]
      };

      const result = thesisEvaluator.evaluate(driftedDraft);
      assert.ok(result.issues.some((i) => i.code === 'THESIS_DRIFT'));
    });

    test('mendeteksi UNPREPARED_CONCLUSION_TOPIC bila kesimpulan membawa topik asing tiba-tiba', () => {
      const coherenceEvaluator = new CoherenceEvaluator();

      const jumpDraft: ArticleDraft = {
        ...sampleDraft,
        sections: sampleDraft.sections.map((s) => {
          if (s.purpose === 'CONCLUSION') {
            return {
              ...s,
              content: 'Kesimpulannya, perusahaan wajib segera beralih mengadopsi blockchain untuk mengamankan data.'
            };
          }
          return s;
        })
      };

      const result = coherenceEvaluator.evaluate(jumpDraft);
      assert.ok(result.issues.some((i) => i.code === 'UNPREPARED_CONCLUSION_TOPIC'));
    });
  });

  describe('3. Redundancy & Information Density', () => {
    test('membedakan penegasan retoris kesimpulan dari pengulangan hampa (IDEA_REDUNDANCY)', () => {
      const redundancyDetector = new RedundancyDetector();

      // Kasus redundansi hampa di seksi tengah
      const redundantDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          sampleDraft.sections[0],
          {
            id: 'sec-repeat',
            purpose: 'CONTEXT',
            content: sampleDraft.sections[0].content, // Mengulang 100% isi hook!
            order: 2,
            claimUsageIds: []
          }
        ]
      };

      const result = redundancyDetector.evaluate(redundantDraft);
      assert.ok(result.issues.some((i) => i.code === 'IDEA_REDUNDANCY'));
    });

    test('menandai LOW_INFORMATION_DENSITY pada seksi panjang yang dipenuhi frasa pengisi', () => {
      const densityEvaluator = new InformationDensityEvaluator();

      const fillerSection = {
        id: 'sec-filler',
        heading: 'Uraian Umum',
        purpose: 'CONTEXT' as const,
        content:
          'Seperti yang telah kita ketahui bersama, dalam dunia yang terus berputar ini, tidak dapat dipungkiri lagi bahwa pada hakikatnya para praktisi sering kali mendiskusikan berbagai hal yang menyangkut kepentingan umum. Sebagaimana lazimnya dalam dunia bisnis modern, kita perlu memahami secara mendalam bahwa segala sesuatunya memerlukan perencanaan yang matang dan pemikiran yang berulang-ulang agar tidak terjadi kesalahan langkah. Hal ini sangat wajar dan lumrah terjadi di mana saja tanpa terkecuali, sebab setiap orang memiliki pandangan masing-masing yang patut dihargai dalam setiap kesempatan perjumpaan profesional yang diselenggarakan oleh berbagai pihak di berbagai tempat yang berbeda-beda.',
        order: 1,
        claimUsageIds: []
      };

      const fillerDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [fillerSection]
      };

      const result = densityEvaluator.evaluate(fillerDraft);
      assert.ok(result.issues.some((i) => i.code === 'LOW_INFORMATION_DENSITY'));
    });
  });

  describe('4. Hook & Heading Quality', () => {
    test('menolak CHEAP_CLICKBAIT_HOOK dengan penalti skor kritis', () => {
      const hookEvaluator = new HookEvaluator();

      const clickbaitDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-1-hook',
            purpose: 'HOOK',
            content: 'Anda tidak akan percaya apa yang terjadi pada strategi SEO ini! Baca ini sebelum terlambat!',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = hookEvaluator.evaluate(clickbaitDraft);
      assert.ok(result.issues.some((i) => i.code === 'CHEAP_CLICKBAIT_HOOK'));
      assert.ok(result.score <= 60);
    });

    test('menandai GENERIC_HEADING pada judul seksi klise seperti "Pendahuluan" atau "Pembahasan"', () => {
      const headingEvaluator = new HeadingEvaluator();

      const genericDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-1',
            heading: 'Pendahuluan',
            purpose: 'HOOK',
            content: 'Isi pendahuluan.',
            order: 1,
            claimUsageIds: []
          },
          {
            id: 'sec-2',
            heading: 'Pembahasan',
            purpose: 'ARGUMENT',
            content: 'Isi pembahasan.',
            order: 2,
            claimUsageIds: []
          }
        ]
      };

      const result = headingEvaluator.evaluate(genericDraft);
      assert.ok(result.issues.some((i) => i.code === 'GENERIC_HEADING'));
    });
  });

  describe('5. AI Writing Pattern Risk (AI_STYLE_RISK)', () => {
    test('menandai pola klise "dalam era digital", "penting untuk dicatat", dan penutup motivasional', () => {
      const patternDetector = new AIWritingPatternDetector();

      const aiFlavoredDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-1',
            purpose: 'HOOK',
            content:
              'Dalam era digital yang berkembang pesat saat ini, penting untuk dicatat bahwa bisnis harus bertransformasi. Semoga artikel ini bermanfaat!',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = patternDetector.evaluate(aiFlavoredDraft);
      assert.ok(result.issues.some((i) => i.code === 'AI_STYLE_RISK'));
      assert.ok(result.riskLevel === 'HIGH' || result.riskLevel === 'MEDIUM');
    });

    test('prosa alami dan bernas tidak diklasifikasikan sebagai berisiko tinggi', () => {
      const patternDetector = new AIWritingPatternDetector();
      const result = patternDetector.evaluate(sampleDraft);
      assert.strictEqual(result.riskLevel, 'LOW');
    });
  });

  describe('6. Tone Adaptation per Article Type', () => {
    test('mengevaluasi kesesuaian tonasi untuk ANALYSIS, HOW_TO, dan REFERENCE', () => {
      const styleEvaluator = new StyleEvaluator(DEFAULT_NEXAMOS_TONE_PROFILE);

      const analysisResult = styleEvaluator.evaluate(sampleDraft);
      assert.strictEqual(analysisResult.expectedTone, 'analytical + argumentative');

      const howToDraft: ArticleDraft = { ...sampleDraft, articleType: 'HOW_TO' };
      const howToResult = styleEvaluator.evaluate(howToDraft);
      assert.strictEqual(howToResult.expectedTone, 'direct + actionable');

      const refDraft: ArticleDraft = { ...sampleDraft, articleType: 'REFERENCE' };
      const refResult = styleEvaluator.evaluate(refDraft);
      assert.strictEqual(refResult.expectedTone, 'neutral + retrievable');
    });

    test('menolak PATRONIZING_TONE yang merendahkan kecerdasan pembaca', () => {
      const styleEvaluator = new StyleEvaluator();

      const patronizingDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-1',
            purpose: 'CONTEXT',
            content: 'Anda mungkin belum tahu hal mendasar ini, tetapi sebagai pemula anda harus paham.',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = styleEvaluator.evaluate(patronizingDraft);
      assert.ok(result.issues.some((i) => i.code === 'PATRONIZING_TONE'));
    });
  });

  describe('7. Surgical Revision & Grounding Regression Protection', () => {
    let draftToRevise: ArticleDraft;

    beforeEach(() => {
      draftToRevise = {
        ...sampleDraft,
        sections: [
          {
            ...sampleDraft.sections[0],
            content:
              'Banyak yang memperkirakan bahwa kemunculan AI generatif akan mematikan fungsi blog. Penting untuk dicatat bahwa penurunan hanya terjadi pada artikel agregator komoditas.'
          },
          ...sampleDraft.sections.slice(1)
        ]
      };
    });

    test('melakukan revisi bedah terarah hanya pada seksi bermasalah sementara seksi lain utuh', async () => {
      const result = await revisionService.reviewAndRevise(draftToRevise, sampleBrief);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.regressionDetected, false);
      assert.ok(result.revisedDraft);

      // Seksi 4 (EVIDENCE) dan seksi 5 (FRAMEWORK) yang tidak bermasalah harus tetap utuh
      assert.strictEqual(
        result.revisedDraft.sections[3].content,
        sampleDraft.sections[3].content,
        'Seksi EVIDENCE yang tidak ditargetkan harus utuh'
      );
    });

    test('menolak revisi jika terjadi perubahan angka persentase faktual (REVISION_GROUNDING_REGRESSION)', async () => {
      mockProvider.setConfig({ injectChangedPercentage: true });

      const result = await revisionService.reviewAndRevise(draftToRevise, sampleBrief);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.regressionDetected, true);
      assert.strictEqual(result.revisedDraft, null, 'Draft revisi harus ditolak dan tidak menggantikan draft asli');
      assert.ok(
        result.regressionReasons?.some((r) => r.includes('REVISION_GROUNDING_REGRESSION'))
      );
    });

    test('menolak revisi jika terjadi eskalasi kekuatan klaim (CLAIM_STRENGTH_ESCALATION)', async () => {
      mockProvider.setConfig({ injectClaimStrengthEscalation: true });

      const result = await revisionService.reviewAndRevise(draftToRevise, sampleBrief);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.regressionDetected, true);
      assert.ok(
        result.regressionReasons?.some((r) => r.includes('CLAIM_STRENGTH_ESCALATION'))
      );
    });

    test('menolak revisi jika menyuntikkan kutipan baru tanpa bukti (UNSUPPORTED_QUOTE)', async () => {
      mockProvider.setConfig({ injectInventedQuote: true });

      const result = await revisionService.reviewAndRevise(draftToRevise, sampleBrief);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.regressionDetected, true);
      assert.ok(
        result.regressionReasons?.some((r) => r.includes('UNSUPPORTED_QUOTE'))
      );
    });
  });

  describe('8. Synthetic Fixture Safety & Isolation', () => {
    test('SYNTHETIC_TEST_DATA cannot become production factual evidence', () => {
      const syntheticEvidence = {
        sampleSize: 10000,
        publisher: 'Search Benchmark Institute',
        retentionRate: '85%',
        fixtureOnly: true,
        verificationStatus: 'SYNTHETIC_TEST_DATA'
      };

      assert.strictEqual(syntheticEvidence.fixtureOnly, true);
      assert.strictEqual(syntheticEvidence.verificationStatus, 'SYNTHETIC_TEST_DATA');

      // Assertion penegakan isolasi produksi
      const isEligibleForProduction = syntheticEvidence.verificationStatus === 'EMPIRICAL_PRODUCTION_EVIDENCE';
      assert.strictEqual(
        isEligibleForProduction,
        false,
        'SYNTHETIC_TEST_DATA dilarang keras dipromosikan sebagai bukti artikel produksi nyata'
      );
    });
  });

  describe('9. Full Flow: Grounded Draft ➔ Review ➔ Revision Plan ➔ Surgical Revision ➔ PASS', () => {
    test('menjalankan siklus review dan perbaikan editorial lengkap hingga berstatus PASS', async () => {
      mockProvider.setConfig({}); // reset ke clean config

      const result = await revisionService.reviewAndRevise(sampleDraft, sampleBrief);

      assert.strictEqual(result.success, true);
      assert.ok(result.revisedDraft);
      assert.ok(result.finalReview);
      assert.ok(result.finalReview.overallWritingScore >= 80);
      assert.strictEqual(result.finalReview.status, 'PASS');
    });
  });
});
