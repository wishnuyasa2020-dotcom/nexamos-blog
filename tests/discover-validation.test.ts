/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 4B Tests: Google Discover Readiness Validator
 *
 * Menguji seluruh dimensi validasi Discover:
 * - Eligibility, Originality, Depth, Timeliness, Interest Fit,
 *   Topical Expertise, Local Relevance, Title Integrity, Visual Readiness,
 *   Page Experience, dan Policy Safety.
 *
 * Menegakkan doktrin:
 * DISCOVER READINESS ≠ DISCOVER RANK PREDICTION
 * DISCOVER ELIGIBILITY ≠ GUARANTEE OF APPEARANCE
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import type { ArticleDraft } from '../engines/editorial/article-draft.ts';
import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../engines/research/orchestrator/research-brief.ts';
import type { ArticleSEOMetadata } from '../engines/seo-validator/article-seo-metadata.ts';
import type { ExistingArticleIndexItem } from '../engines/seo-validator/internal-link.ts';
import {
  DiscoverValidationService,
  DiscoverEligibilityValidator,
  DiscoverOriginalityValidator,
  DiscoverDepthValidator,
  DiscoverTimelinessValidator,
  DiscoverInterestFitValidator,
  DiscoverTopicExpertiseValidator,
  DiscoverLocalRelevanceValidator,
  DiscoverTitleValidator,
  DiscoverVisualValidator,
  DiscoverPageExperienceValidator,
  DiscoverPolicyRiskValidator,
  DiscoverReadinessScoreCalculator,
  DiscoverRecommendationEngine,
  MockAIDiscoverProvider,
  type DiscoverVisualAsset
} from '../engines/discover-validator/index.ts';

describe('Phase 4B Tests: Google Discover Readiness Validator', () => {
  let sampleDraft: ArticleDraft;
  let sampleTopic: Topic;
  let sampleBrief: ResearchBrief;
  let sampleMetadata: ArticleSEOMetadata;
  let sampleVisualAsset: DiscoverVisualAsset;
  let inventory: ExistingArticleIndexItem[];
  let discoverService: DiscoverValidationService;

  beforeEach(() => {
    sampleTopic = {
      id: 'top-ai-discover-001',
      title: 'Arsitektur Informasi di Era Search Generatif dan Feed Penemuan',
      slug: 'arsitektur-informasi-di-era-search-generatif',
      territory: 'STRATEGY',
      status: 'APPROVED',
      editorialRole: 'AUTHORITY',
      audience: {
        segment: 'Pemimpin Teknologi & Strategis Konten',
        knowledgeLevel: 'ADVANCED',
        corePainPoints: ['Komoditisasi konten generik', 'Ketergantungan algoritma distribusi']
      },
      whyNow: 'Perubahan paradigma Google Discover 2026 yang mengutamakan otoritas topik per topik.',
      problem: 'Banyak publikasi kehilangan jangkauan karena menyajikan artikel dangkal yang tidak memiliki kedalaman sintesis.',
      informationGain: {
        originalityType: ['ORIGINAL_FRAMEWORK', 'ORIGINAL_RESEARCH'],
        primaryValueAdd: 'Menyajikan framework arsitektur informasi terintegrasi.',
        commodityRisk: 'LOW',
        synthesisLevel: 'HIGH'
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z'
    };

    sampleDraft = {
      id: 'draft-ai-discover-001',
      topicId: 'top-ai-discover-001',
      title: 'Mengapa AI Membunuh Konten Komoditas, Bukan Kepakaran Mendalam',
      dek: 'Analisis struktural tentang dinamika feed Google Discover dan pergeseran menuju otoritas topik.',
      thesis: 'Di era AI, distribusi berbasis minat hanya memprioritaskan kepakaran substantif dan sintesis orisinal.',
      editorialAngle: 'Perspektif rekayasa informasi melawan ilusi volume artikel massal.',
      sections: [
        {
          heading: 'Krisis Kelebihan Konten di Feed Minat',
          content: 'Volume publikasi daring yang melonjak pesat telah memicu saturasi informasi di feed algoritma.',
          purpose: 'CONTEXT'
        },
        {
          heading: 'Temuan Empiris Mengenai Retensi Minat Pengguna',
          content: 'Berdasarkan observasi data analitik pada kuartal ketiga 2026, artikel yang memiliki bukti primer mengalami retensi pembaca 2.4 kali lebih tinggi.',
          purpose: 'EVIDENCE'
        },
        {
          heading: 'Framework Arsitektur Kluster Pengetahuan NexaMOS',
          content: 'Kerangka kerja keterikatan topik menghubungkan setiap naskah ke territory inti organisasi.',
          purpose: 'FRAMEWORK'
        },
        {
          heading: 'Bantahan Terhadap Asumsi Agregator Berita Cepat',
          content: 'Meskipun kecepatan unggah sempat menjadi faktor utama, perubahan sistem Discover terkini justru mendevaluasi artikel dangkal.',
          purpose: 'COUNTERPOINT'
        },
        {
          heading: 'Implikasi Strategis bagi Pemimpin Redaksi di Indonesia',
          content: 'Organisasi penerbitan di Indonesia perlu mengalihkan investasi dari produksi kuantitas ke riset domain mendalam.',
          purpose: 'IMPLICATION'
        }
      ],
      references: [],
      targetAudience: 'Pemimpin Teknologi & Strategis Konten',
      editorialFormat: 'ANALYSIS',
      territory: 'STRATEGY',
      revisionCount: 1,
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-14T12:00:00.000Z'
    };

    sampleBrief = {
      topicId: 'top-ai-discover-001',
      targetAudience: 'Pemimpin Teknologi & Strategis Konten',
      coreQuestions: ['Bagaimana model Discover menilai otoritas topik?'],
      keyClaims: [],
      evidenceCandidates: [],
      synthesisRecommendations: ['Gunakan framework konseptual terstruktur.'],
      generatedAt: '2026-09-02T00:00:00.000Z'
    };

    sampleMetadata = {
      title: 'Mengapa AI Membunuh Konten Komoditas, Bukan Kepakaran Mendalam',
      metaDescription: 'Analisis mendalam mengenai pergeseran Google Discover menuju otoritas topik dan konten substantif.',
      slug: 'mengapa-ai-membunuh-konten-komoditas',
      primaryKeyword: 'otoritas topik google discover',
      secondaryKeywords: ['arsitektur informasi', 'feed penemuan ai'],
      robots: {
        index: true,
        follow: true
      },
      canonicalUrl: 'https://nexamos.com/blog/mengapa-ai-membunuh-konten-komoditas',
      publishedAt: '2026-09-14T08:00:00.000Z',
      updatedAt: '2026-09-14T12:00:00.000Z'
    };

    sampleVisualAsset = {
      url: 'https://nexamos.com/assets/visuals/arsitektur-discover-2026.png',
      width: 1920,
      height: 1080,
      totalPixels: 2073600,
      aspectRatio: '16:9',
      alt: 'Diagram kerangka kerja otoritas topik dan feed Google Discover',
      isGeneric: false,
      isLogo: false,
      textDensity: 'LOW'
    };

    inventory = [
      {
        id: 'art-001',
        slug: 'fondasi-editorial-ai-era',
        title: 'Fondasi Editorial di Era AI',
        keywords: ['arsitektur informasi', 'editorial ai'],
        summary: 'Panduan membangun pilar otoritas konten.'
      },
      {
        id: 'art-002',
        slug: 'strategi-kluster-pengetahuan',
        title: 'Strategi Kluster Pengetahuan Mandiri',
        keywords: ['kluster pengetahuan', 'strategi'],
        summary: 'Hubungan antar territory pengetahuan.'
      }
    ];

    discoverService = new DiscoverValidationService();
  });

  // =========================================================================
  // SUITE 1: Discover Eligibility Validator
  // =========================================================================
  describe('1. Discover Eligibility Validator', () => {
    const validator = new DiscoverEligibilityValidator();

    test('Lolos kelayakan penuh (ELIGIBLE) jika naskah lengkap dan terindeks', () => {
      const res = validator.validate(sampleDraft, sampleMetadata);
      assert.strictEqual(res.eligibility, 'ELIGIBLE');
      assert.strictEqual(res.checkResult.status, 'PASS');
      assert.strictEqual(res.issues.length, 0);
    });

    test('INELIGIBLE jika direktif robots menandai noindex', () => {
      const noindexMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        robots: { index: false, follow: true }
      };
      const res = validator.validate(sampleDraft, noindexMeta);
      assert.strictEqual(res.eligibility, 'INELIGIBLE');
      assert.strictEqual(res.checkResult.status, 'FAIL');
      const issue = res.issues.find((i) => i.code === 'CONTENT_NOT_INDEXABLE');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });

    test('INELIGIBLE jika naskah tidak memiliki judul atau seksi konten primer', () => {
      const emptyDraft: ArticleDraft = {
        ...sampleDraft,
        title: '',
        sections: []
      };
      const res = validator.validate(emptyDraft, sampleMetadata);
      assert.strictEqual(res.eligibility, 'INELIGIBLE');
      const issue = res.issues.find((i) => i.code === 'MISSING_PRIMARY_CONTENT');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });

    test('Peringatan jika artikel belum memiliki metadata publikasi resmi', () => {
      const res = validator.validate(sampleDraft, null);
      assert.strictEqual(res.eligibility, 'ELIGIBILITY_WARNING');
      assert.strictEqual(res.checkResult.status, 'WARNING');
    });
  });

  // =========================================================================
  // SUITE 2: Discover Originality Validator
  // =========================================================================
  describe('2. Discover Originality Validator', () => {
    const validator = new DiscoverOriginalityValidator();

    test('Memberikan skor penuh (15) untuk konten dengan framework orisinal dan riset primer', () => {
      const res = validator.validate(sampleDraft, sampleTopic, sampleBrief);
      assert.strictEqual(res.score, 15);
      assert.strictEqual(res.checkResult.status, 'PASS');
      assert.strictEqual(res.issues.length, 0);
    });

    test('Menandai LOW_DISCOVER_ORIGINALITY dan memotong skor jika risiko komoditas tinggi', () => {
      const commodityTopic: Topic = {
        ...sampleTopic,
        informationGain: {
          originalityType: [],
          primaryValueAdd: '',
          commodityRisk: 'HIGH',
          synthesisLevel: 'LOW'
        }
      };
      const shallowDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          { heading: 'Ringkasan', content: 'Ringkasan umum tanpa riset.', purpose: 'CONTEXT' }
        ]
      };
      const res = validator.validate(shallowDraft, commodityTopic, null);
      assert.ok(res.score < 10);
      const issue = res.issues.find((i) => i.code === 'LOW_DISCOVER_ORIGINALITY');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'WARNING');
    });
  });

  // =========================================================================
  // SUITE 3: Discover Depth Validator
  // =========================================================================
  describe('3. Discover Depth Validator', () => {
    const validator = new DiscoverDepthValidator();

    test('Menilai IN_DEPTH dengan skor 15 jika memiliki komponen konteks, bukti, framework, dan implikasi', () => {
      const res = validator.validate(sampleDraft);
      assert.strictEqual(res.depthLevel, 'IN_DEPTH');
      assert.strictEqual(res.score, 15);
      assert.strictEqual(res.checkResult.status, 'PASS');
      assert.strictEqual(res.issues.length, 0);
    });

    test('Doktrin: Depth BUKAN word count - menandai SHALLOW jika komponen substansi minim', () => {
      const repetitiveDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          { heading: 'Bagian 1', content: 'Teks sangat panjang namun hanya berisi opini tanpa bukti.', purpose: 'CONTEXT' }
        ]
      };
      const res = validator.validate(repetitiveDraft);
      assert.strictEqual(res.depthLevel, 'SHALLOW');
      assert.ok(res.score <= 5);
      const issue = res.issues.find((i) => i.code === 'INSUFFICIENT_TOPIC_DEPTH');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 4: Discover Timeliness Validator
  // =========================================================================
  describe('4. Discover Timeliness Validator', () => {
    const validator = new DiscoverTimelinessValidator();
    const testNow = new Date('2026-09-14T12:00:00.000Z');

    test('Status CURRENT dengan skor maksimal untuk naskah yang baru diperbarui dengan whyNow jelas', () => {
      const res = validator.validate(sampleTopic, sampleMetadata, testNow);
      assert.strictEqual(res.timelinessStatus, 'CURRENT');
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin: OLD != AUTOMATIC FAIL - artikel 6 bulan lalu berstatus evergreen tetap memiliki skor layak', () => {
      const oldMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        publishedAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z'
      };
      const evergreenTopic: Topic = {
        ...sampleTopic,
        whyNow: '' // Tidak bergantung pada breaking event
      };
      const res = validator.validate(evergreenTopic, oldMeta, testNow);
      assert.strictEqual(res.timelinessStatus, 'EVERGREEN_RELEVANT');
      assert.ok(res.score >= 8);
    });

    test('Menandai STALE_TIME_SENSITIVE_CONTENT jika topik mendesak namun tanggal publikasi usang', () => {
      const staleMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        publishedAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };
      const timeSensitiveTopic: Topic = {
        ...sampleTopic,
        whyNow: 'Pembaruan algoritma terkini yang membutuhkan tindakan segera.'
      };
      const res = validator.validate(timeSensitiveTopic, staleMeta, testNow);
      assert.strictEqual(res.timelinessStatus, 'STALE');
      assert.ok(res.score <= 4);
      const issue = res.issues.find((i) => i.code === 'STALE_TIME_SENSITIVE_CONTENT');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 5: Discover Interest Fit Validator
  // =========================================================================
  describe('5. Discover Interest Fit Validator', () => {
    const validator = new DiscoverInterestFitValidator();

    test('Status SUPPORTED_BY_CONTEXT jika urgensi waktu dan masalah audiens terartikulasi', () => {
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.interestFitStatus, 'SUPPORTED_BY_CONTEXT');
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin Keras: Tidak mengarang tren - ketiadaan konteks menghasilkan UNKNOWN dengan skor netral', () => {
      const emptyContextTopic: Topic = {
        ...sampleTopic,
        whyNow: '',
        problem: ''
      };
      const res = validator.validate(sampleDraft, emptyContextTopic);
      assert.strictEqual(res.interestFitStatus, 'UNKNOWN');
      assert.strictEqual(res.score, 5);
      const issue = res.issues.find((i) => i.code === 'WEAK_INTEREST_ALIGNMENT');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 6: Discover Topical Expertise Validator
  // =========================================================================
  describe('6. Discover Topical Expertise Validator', () => {
    const validator = new DiscoverTopicExpertiseValidator();

    test('Status ESTABLISHED jika territory valid dan didukung kluster pengetahuan pada inventory', () => {
      const res = validator.validate(sampleDraft, sampleTopic, inventory);
      assert.strictEqual(res.expertiseStatus, 'ESTABLISHED');
      assert.strictEqual(res.score, 15);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menandai ISOLATED_TOPIC_RISK jika topik berada di luar territory resmi', () => {
      const invalidTerritoryTopic: Topic = {
        ...sampleTopic,
        territory: 'ENTERTAINMENT' as any
      };
      const rogueDraft: ArticleDraft = {
        ...sampleDraft,
        territory: undefined
      };
      const res = validator.validate(rogueDraft, invalidTerritoryTopic, []);
      assert.strictEqual(res.expertiseStatus, 'UNKNOWN');
      assert.ok(res.score <= 6);
      const issue = res.issues.find((i) => i.code === 'ISOLATED_TOPIC_RISK');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 7: Discover Local Relevance Validator
  // =========================================================================
  describe('7. Discover Local Relevance Validator', () => {
    const validator = new DiscoverLocalRelevanceValidator();

    test('Memberikan sinyal lokal INDONESIA jika naskah memuat konteks nasional', () => {
      const res = validator.validate(sampleDraft, sampleTopic);
      assert.strictEqual(res.localScope, 'INDONESIA');
      assert.strictEqual(res.score, 2);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Doktrin: LOCAL != WAJIB - Artikel global tetap mendapatkan skor valid tanpa dipotong diskriminatif', () => {
      const globalDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          { heading: 'Global Data Layer', content: 'Universal framework applicable to worldwide teams.', purpose: 'FRAMEWORK' }
        ]
      };
      const res = validator.validate(globalDraft, sampleTopic);
      assert.strictEqual(res.localScope, 'GLOBAL');
      assert.strictEqual(res.score, 2);
      assert.strictEqual(res.issues.length, 0);
    });
  });

  // =========================================================================
  // SUITE 8: Discover Title & Headline Validator
  // =========================================================================
  describe('8. Discover Title & Headline Validator', () => {
    const validator = new DiscoverTitleValidator();

    test('Membolehkan Strong Provocative Hook intelektual yang didukung bukti', () => {
      const validProvocativeDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'AI Tidak Membunuh Blog. Ia Membunuh Blog Generik.',
        thesis: 'Teknologi AI tidak membunuh media blog, melainkan menghapus blog berkonten generik.',
        sections: [
          ...sampleDraft.sections,
          {
            heading: 'Distingsi Blog Generik versus Otoritas Domain',
            content: 'Publikasi blog yang hanya mengulang komoditas generik akan terbunuh oleh model bahasa besar.',
            purpose: 'COUNTERPOINT'
          }
        ]
      };
      const res = validator.validate(validProvocativeDraft);
      assert.strictEqual(res.isClickbait, false);
      assert.strictEqual(res.score, 10);
      assert.strictEqual(res.checkResult.status, 'PASS');
    });

    test('Menolak formula clickbait murahan (DISCOVER_CLICKBAIT_RISK)', () => {
      const clickbaitDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Bikin Syok! Rahasia Gila Nomor 3 Ini yang Mereka Sembunyikan dari Kamu!!!'
      };
      const res = validator.validate(clickbaitDraft);
      assert.strictEqual(res.isClickbait, true);
      assert.ok(res.score <= 3);
      const issue = res.issues.find((i) => i.code === 'DISCOVER_CLICKBAIT_RISK');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'WARNING');
    });

    test('Menandai CRITICAL_TITLE_DECEPTION jika judul kosong', () => {
      const emptyTitleDraft: ArticleDraft = {
        ...sampleDraft,
        title: ''
      };
      const res = validator.validate(emptyTitleDraft);
      assert.strictEqual(res.score, 0);
      const issue = res.issues.find((i) => i.code === 'CRITICAL_TITLE_DECEPTION');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });
  });

  // =========================================================================
  // SUITE 9: Discover Visual Readiness Validator
  // =========================================================================
  describe('9. Discover Visual Readiness Validator', () => {
    const validator = new DiscoverVisualValidator();

    test('Status OPTIMAL (skor 15) untuk gambar beresolusi 1920x1080, lanskap 16:9, dan max-image-preview:large', () => {
      const res = validator.validate(sampleVisualAsset, 'large');
      assert.strictEqual(res.visualReadiness, 'OPTIMAL');
      assert.strictEqual(res.score, 15);
      assert.strictEqual(res.checkResult.status, 'PASS');
      assert.strictEqual(res.issues.length, 0);
    });

    test('Menandai VISUAL_LOW_RESOLUTION jika lebar gambar di bawah 1200 piksel', () => {
      const lowResAsset: DiscoverVisualAsset = {
        ...sampleVisualAsset,
        width: 800,
        height: 450,
        totalPixels: 360000
      };
      const res = validator.validate(lowResAsset, 'large');
      assert.ok(res.score <= 10);
      const issue = res.issues.find((i) => i.code === 'VISUAL_LOW_RESOLUTION');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'WARNING');
    });

    test('Menandai VISUAL_GENERIC_LOGO jika gambar terdeteksi sebagai logo perusahaan', () => {
      const logoAsset: DiscoverVisualAsset = {
        ...sampleVisualAsset,
        isLogo: true
      };
      const res = validator.validate(logoAsset, 'large');
      const issue = res.issues.find((i) => i.code === 'VISUAL_GENERIC_LOGO');
      assert.ok(issue);
    });

    test('Menandai LARGE_IMAGE_PREVIEW_RESTRICTED jika direktif dibatasi (misal standard / none)', () => {
      const res = validator.validate(sampleVisualAsset, 'standard');
      const issue = res.issues.find((i) => i.code === 'LARGE_IMAGE_PREVIEW_RESTRICTED');
      assert.ok(issue);
    });

    test('Menandai VISUAL_ASSET_MISSING jika aset visual tidak disediakan', () => {
      const res = validator.validate(null);
      assert.strictEqual(res.visualReadiness, 'MISSING');
      assert.strictEqual(res.score, 0);
      const issue = res.issues.find((i) => i.code === 'VISUAL_ASSET_MISSING');
      assert.ok(issue);
    });
  });

  // =========================================================================
  // SUITE 10: Page Experience & Policy Risk Validators
  // =========================================================================
  describe('10. Page Experience & Policy Risk Validators', () => {
    test('Doktrin: Ketiadaan data empiris CWV menghasilkan UNKNOWN (bukan kelulusan palsu)', () => {
      const peValidator = new DiscoverPageExperienceValidator();
      const res = peValidator.validate(null);
      assert.strictEqual(res.experienceStatus, 'UNKNOWN');
      assert.strictEqual(res.score, 3);
      const issue = res.issues.find((i) => i.code === 'UNVERIFIED_PAGE_EXPERIENCE');
      assert.ok(issue);
    });

    test('Menolak pelanggaran konten keras dengan severity CRITICAL (INELIGIBLE)', () => {
      const policyValidator = new DiscoverPolicyRiskValidator();
      const violationDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Panduan Menang Judi Online dan Slot Gacor Setiap Hari'
      };
      const res = policyValidator.validate(violationDraft, sampleMetadata);
      assert.strictEqual(res.policyRisk, 'INELIGIBLE');
      assert.strictEqual(res.score, 0);
      const issue = res.issues.find((i) => i.code === 'DISCOVER_POLICY_INELIGIBLE');
      assert.ok(issue);
      assert.strictEqual(issue.severity, 'CRITICAL');
    });
  });

  // =========================================================================
  // SUITE 11: End-to-End Discover Validation Service Orchestration
  // =========================================================================
  describe('11. Master DiscoverValidationService Orchestration', () => {
    test('Artikel optimal memperoleh klasifikasi STRONG dengan skor >= 90', async () => {
      const result = await discoverService.validate(sampleDraft, {
        topic: sampleTopic,
        brief: sampleBrief,
        metadata: sampleMetadata,
        primaryAsset: sampleVisualAsset,
        pageExperience: { mobileFriendly: true, secureTransport: true, intrusiveInterstitialRisk: false },
        inventory,
        maxImagePreview: 'large'
      });

      assert.strictEqual(result.eligibility, 'ELIGIBLE');
      assert.strictEqual(result.classification, 'STRONG');
      assert.ok(result.score >= 90);
      assert.strictEqual(result.criticalIneligibilityReasons.length, 0);
      assert.strictEqual(result.policyVersion, 'DISCOVER_READINESS_POLICY_V1');
      assert.ok(result.checks.length >= 10);
    });

    test('Artikel dengan robots noindex diklasifikasikan sebagai INELIGIBLE', async () => {
      const noindexMeta: ArticleSEOMetadata = {
        ...sampleMetadata,
        robots: { index: false, follow: true }
      };

      const result = await discoverService.validate(sampleDraft, {
        topic: sampleTopic,
        metadata: noindexMeta,
        primaryAsset: sampleVisualAsset
      });

      assert.strictEqual(result.eligibility, 'INELIGIBLE');
      assert.strictEqual(result.classification, 'INELIGIBLE');
      assert.ok(result.criticalIneligibilityReasons.some((r) => r.includes('CONTENT_NOT_INDEXABLE')));
    });

    test('Rekomendasi lintas-mesin diarahkan dengan tepat sesuai domain masalah', async () => {
      const clickbaitAndMissingAssetDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Bikin Syok! Rahasia Gila Yang Disembunyikan!!'
      };

      const result = await discoverService.validate(clickbaitAndMissingAssetDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata,
        primaryAsset: null // Missing asset
      });

      // Harus ada rekomendasi TITLE_IMPROVEMENT ke EDITORIAL
      const titleRec = result.recommendations.find((r) => r.type === 'TITLE_IMPROVEMENT');
      assert.ok(titleRec);
      assert.strictEqual(titleRec.crossEngineDestination, 'EDITORIAL');

      // Harus ada rekomendasi VISUAL_IMPROVEMENT ke VISUAL_DESIGN
      const visualRec = result.recommendations.find((r) => r.type === 'VISUAL_IMPROVEMENT');
      assert.ok(visualRec);
      assert.strictEqual(visualRec.crossEngineDestination, 'VISUAL_DESIGN');
    });

    test('Integrasi dengan MockAIDiscoverProvider untuk mendeteksi headline riskan', async () => {
      const aiProvider = new MockAIDiscoverProvider();
      const clickbaitDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Rahasia Gila Memperoleh Ribuan Klik Otomatis'
      };

      const result = await discoverService.validate(clickbaitDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata,
        primaryAsset: sampleVisualAsset,
        aiProvider
      });

      assert.ok(result.issues.some((i) => i.code === 'DISCOVER_CLICKBAIT_RISK'));
    });

    test('Doktrin Hard Boundary: Tidak menghasilkan data palsu (Rank Prediction / Appearance Guarantee)', async () => {
      const result = await discoverService.validate(sampleDraft, {
        topic: sampleTopic,
        metadata: sampleMetadata,
        primaryAsset: sampleVisualAsset
      });

      const resKeys = Object.keys(result);
      assert.strictEqual(resKeys.includes('rankPrediction'), false);
      assert.strictEqual(resKeys.includes('appearanceProbability'), false);
      assert.strictEqual(resKeys.includes('ctrEstimate'), false);
    });
  });
});
