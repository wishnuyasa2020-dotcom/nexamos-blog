/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 4A Tests: SEO Validation Engine
 *
 * Menguji seluruh layer validasi SEO: Content SEO, On-Page SEO, dan Technical Readiness.
 * Menegakkan doktrin: EDITORIAL QUALITY > SEO MECHANICS.
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import type { ArticleDraft } from '../engines/editorial/article-draft.ts';
import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { EditorialReview } from '../engines/editorial/review/editorial-review.ts';
import type { ArticleSEOMetadata } from '../engines/seo-validator/article-seo-metadata.ts';
import type { ExistingArticleIndexItem } from '../engines/seo-validator/internal-link.ts';
import {
  SEOValidationService,
  SearchIntentValidator,
  TopicFocusValidator,
  TitleValidator,
  MetaDescriptionValidator,
  HeadingStructureValidator,
  InternalLinkValidator,
  IndexabilityValidator,
  CanonicalValidator,
  StructuredDataValidator,
  ContentQualitySEOValidator,
  ImageSEOValidator,
  MockAISEOProvider
} from '../engines/seo-validator/index.ts';

describe('Phase 4A Tests: SEO Validation Engine', () => {
  let sampleTopic: Topic;
  let sampleDraft: ArticleDraft;
  let sampleMetadata: ArticleSEOMetadata;
  let sampleEditorialReview: EditorialReview;
  let availableArticles: ExistingArticleIndexItem[];
  let seoService: SEOValidationService;

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
        jobToBeDone: 'Memahami apakah blog masih bernilai dan bagaimana strateginya berubah di era AI'
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
            'Perkembangan kecerdasan buatan kerap dinarasikan sebagai akhir dari era blog. Namun fakta di lapangan menunjukkan hal sebaliknya: penurunan hanya terjadi pada artikel agregator komoditas.',
          order: 1,
          claimUsageIds: []
        },
        {
          id: 'sec-2-context',
          heading: 'Pergeseran Nilai dari Komoditas ke Otoritas',
          purpose: 'CONTEXT',
          content:
            'Dalam lanskap pencarian saat ini, jawaban cepat AI mendominasi pertanyaan permukaan, sementara pertanyaan strategis membutuhkan kedalaman analisis riset terstruktur.',
          order: 2,
          claimUsageIds: []
        },
        {
          id: 'sec-3-argument',
          heading: 'Tesis Inti: Blog Sebagai Sistem Otoritas',
          purpose: 'ARGUMENT',
          content:
            'Blog tetap relevan di era AI, tetapi fungsinya bergeser dari sekadar agregator traffic menjadi owned knowledge system yang membangun authority dan demand.',
          order: 3,
          claimUsageIds: []
        },
        {
          id: 'sec-4-evidence',
          heading: 'Bukti Empiris Retensi Trafik Organik',
          purpose: 'EVIDENCE',
          content:
            'Data empiris menunjukkan bahwa blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator komoditas.',
          order: 4,
          claimUsageIds: []
        },
        {
          id: 'sec-5-framework',
          heading: 'Arsitektur NexaMOS Content Moat',
          purpose: 'FRAMEWORK',
          content:
            'NexaMOS Content Moat Framework membagi arsitektur konten menjadi tiga pilar: Proprietary Data, Original Interpretation, dan Direct Relationship.',
          order: 5,
          claimUsageIds: []
        },
        {
          id: 'sec-6-conclusion',
          heading: 'Masa Depan Blog Sebagai Sistem Pengetahuan',
          purpose: 'CONCLUSION',
          content:
            'Sebagai kesimpulan, blog bukan lagi sekadar alat perolehan klik murah di era AI, melainkan sistem saraf pengetahuan inti yang memvalidasi reputasi institusi.',
          order: 6,
          claimUsageIds: []
        }
      ],
      claimUsages: [],
      citationMap: [],
      status: 'READY_FOR_EDITORIAL_REVIEW',
      generatedAt: '2026-03-01T00:00:00.000Z',
      generatorVersion: 'PHASE_3A_V1',
      promptVersion: 'PROMPT_V1'
    };

    sampleMetadata = {
      title: 'Apakah Aktivitas Blog Masih Relevan di Era AI?',
      description:
        'Analisis strategis mengenai pergeseran fungsi blog di era AI dari saluran traffic komoditas menjadi owned knowledge system yang membangun reputasi dan demand.',
      slug: 'apakah-aktivitas-blog-masih-relevan-di-era-ai',
      canonicalUrl: 'https://nexamos.com/blog/apakah-aktivitas-blog-masih-relevan-di-era-ai',
      robots: { index: true, follow: true },
      author: {
        name: 'Tim Riset NexaMOS',
        role: 'Research & Intelligence'
      },
      publisher: {
        name: 'NexaMOS Knowledge Publishing',
        url: 'https://nexamos.com'
      },
      publishedAt: '2026-03-01T00:00:00.000Z',
      primaryImage: {
        url: 'https://nexamos.com/images/nexamos-content-moat-architecture.png',
        alt: 'Diagram Arsitektur NexaMOS Content Moat di Era AI',
        width: 1280,
        height: 720
      },
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Apakah Aktivitas Blog Masih Relevan di Era AI?',
          description:
            'Analisis strategis mengenai pergeseran fungsi blog di era AI menjadi owned knowledge system.',
          author: {
            '@type': 'Organization',
            name: 'Tim Riset NexaMOS'
          }
        }
      ],
      publicationStatus: 'PUBLISHED'
    };

    sampleEditorialReview = {
      articleDraftId: sampleDraft.id,
      qualityScores: {
        CLARITY: 95,
        COHERENCE: 95,
        DEPTH: 90,
        THESIS_ALIGNMENT: 100,
        INFORMATION_DENSITY: 90,
        READER_USEFULNESS: 95,
        STRUCTURE: 95,
        ORIGINALITY: 95,
        TONE_CONSISTENCY: 100,
        GROUNDING_PRESERVATION: 100
      },
      overallWritingScore: 95,
      status: 'PASS',
      issues: [],
      strengths: ['Naskah analitis berbobot dan ter-grounding penuh.'],
      revisionRecommendations: [],
      reviewedAt: '2026-03-01T00:00:00.000Z',
      reviewPolicyVersion: 'EDITORIAL_WRITING_POLICY_V1'
    };

    availableArticles = [
      {
        id: 'art-seo-002',
        topicId: 'top-entity-seo-002',
        title: 'Panduan Entity-First Search Optimization',
        slug: 'panduan-entity-first-search-optimization',
        url: 'https://nexamos.com/blog/panduan-entity-first-search-optimization',
        keyConcepts: ['arsitektur konten', 'entity seo', 'authority']
      }
    ];

    seoService = new SEOValidationService();
  });

  describe('1. Search Intent Validation', () => {
    test('aligned intent passes dengan skor maksimal', () => {
      const validator = new SearchIntentValidator();
      const result = validator.validate(sampleDraft, sampleTopic);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.profile.intentAlignment, 'ALIGNED');
      assert.strictEqual(result.issues.length, 0);
    });

    test('mismatched intent flagged dengan SEARCH_INTENT_MISMATCH bila menyimpang dari tugas pembaca', () => {
      const validator = new SearchIntentValidator();
      const offTopicDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Cara Memilih Jenis Bunga untuk Dekorasi Meja Kantor',
        thesis: 'Bunga mawar dan anggrek memberikan keindahan visual pada ruang kerja.',
        sections: [
          {
            id: 'sec-1',
            heading: 'Memilih Bunga',
            purpose: 'CONTEXT',
            content: 'Tanaman hias memberikan kesegaran ruang tanpa memerlukan teknologi komputer apapun.',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = validator.validate(offTopicDraft, sampleTopic);

      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.strictEqual(result.profile.intentAlignment, 'MISMATCHED');
      assert.ok(result.issues.some((i) => i.code === 'SEARCH_INTENT_MISMATCH'));
    });
  });

  describe('2. Title Quality Evaluation', () => {
    test('descriptive title accepted dan ketiadaan exact-match keyword tidak otomatis gagal', () => {
      const validator = new TitleValidator();
      // Judul editorial bernas tanpa kata kunci persis ("relevan di era AI" disajikan elegan)
      const editorialDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Masa Depan Aktivitas Publikasi Blog Pasca Kehadiran Kecerdasan Buatan'
      };

      const result = validator.validate(editorialDraft, sampleTopic);
      assert.strictEqual(result.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('misleading / formula clickbait title ditolak dengan TITLE_CLICKBAIT_RISK', () => {
      const validator = new TitleValidator();
      const clickbaitDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Kamu Tidak Akan Percaya! Rahasia Gila Ini Bikin Syok Pemilik Blog!!'
      };

      const result = validator.validate(clickbaitDraft, sampleTopic);
      assert.strictEqual(result.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'TITLE_CLICKBAIT_RISK'));
    });

    test('judul duplikat ditolak dengan TITLE_DUPLICATION_RISK', () => {
      const validator = new TitleValidator();
      const result = validator.validate(sampleDraft, sampleTopic, [sampleDraft.title]);

      assert.strictEqual(result.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'TITLE_DUPLICATION_RISK'));
    });
  });

  describe('3. Metadata & Meta Description Validation', () => {
    test('valid description accepted', () => {
      const validator = new MetaDescriptionValidator();
      const result = validator.validate(sampleDraft, sampleMetadata);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('keyword stuffing pada meta description ditandai dengan META_DESCRIPTION_KEYWORD_STUFFING', () => {
      const validator = new MetaDescriptionValidator();
      const stuffedMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        description:
          'Blog AI, blog di era AI, blog AI terbaik, strategi blog AI, blog AI search, blog AI murah, artikel blog AI.'
      };

      const result = validator.validate(sampleDraft, stuffedMetadata);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'META_DESCRIPTION_KEYWORD_STUFFING'));
    });

    test('meta description yang menduplikasi judul kata demi kata ditandai dengan META_DESCRIPTION_DUPLICATE_TITLE', () => {
      const validator = new MetaDescriptionValidator();
      const duplicateMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        description: sampleDraft.title
      };

      const result = validator.validate(sampleDraft, duplicateMetadata);
      assert.strictEqual(result.checkResult.status, 'WARNING');
      assert.ok(result.issues.some((i) => i.code === 'META_DESCRIPTION_DUPLICATE_TITLE'));
    });
  });

  describe('4. Heading Structure Validation', () => {
    test('semantic hierarchy accepted', () => {
      const validator = new HeadingStructureValidator();
      const result = validator.validate(sampleDraft);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('broken hierarchy / ketiadaan judul ditandai HEADING_STRUCTURE_INVALID', () => {
      const validator = new HeadingStructureValidator();
      const emptyTitleDraft: ArticleDraft = {
        ...sampleDraft,
        title: ''
      };

      const result = validator.validate(emptyTitleDraft);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'HEADING_STRUCTURE_INVALID'));
    });

    test('subjudul klise berlebihan ditandai GENERIC_HEADING_EXCESS', () => {
      const validator = new HeadingStructureValidator();
      const genericHeadingDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          { id: 's1', heading: 'Pendahuluan', purpose: 'HOOK', content: 'Teks...', order: 1, claimUsageIds: [] },
          { id: 's2', heading: 'Pembahasan', purpose: 'ARGUMENT', content: 'Teks...', order: 2, claimUsageIds: [] },
          { id: 's3', heading: 'Kesimpulan', purpose: 'CONCLUSION', content: 'Teks...', order: 3, claimUsageIds: [] }
        ]
      };

      const result = validator.validate(genericHeadingDraft);
      assert.ok(result.issues.some((i) => i.code === 'GENERIC_HEADING_EXCESS'));
    });
  });

  describe('5. Internal Linking Validation', () => {
    test('relevant candidate suggested dari repositori artikel nyata', () => {
      const validator = new InternalLinkValidator();
      // Seksi 5 draf memuat "arsitektur konten" yang cocok dengan keyConcepts artikel 'art-seo-002'
      const result = validator.validate(sampleDraft, availableArticles);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.ok(result.candidates.length > 0);
      assert.strictEqual(result.candidates[0].targetArticleId, 'art-seo-002');
    });

    test('nonexistent URL tidak dibuat dan tautan rusak ke artikel tak terdaftar ditandai', () => {
      const validator = new InternalLinkValidator();
      const brokenLinkDraft: ArticleDraft = {
        ...sampleDraft,
        sections: [
          {
            id: 'sec-1',
            heading: 'Pembahasan Tautan',
            purpose: 'CONTEXT',
            content: 'Simak lebih lengkap pada [artikel fiktif kami](/blog/artikel-fiktif-tidak-pernah-ada).',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = validator.validate(brokenLinkDraft, availableArticles);
      assert.ok(result.issues.some((i) => i.code === 'ORPHAN_ARTICLE_RISK'));
    });
  });

  describe('6. Indexability Validation', () => {
    test('artikel publikasi sehat lolos validasi indeksabilitas', () => {
      const validator = new IndexabilityValidator();
      const result = validator.validate(sampleDraft, sampleMetadata);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('published noindex diblokir keras dengan NOINDEX_ON_PUBLISHED_ARTICLE', () => {
      const validator = new IndexabilityValidator();
      const noindexPublishedMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        publicationStatus: 'PUBLISHED',
        robots: { index: false, follow: true }
      };

      const result = validator.validate(sampleDraft, noindexPublishedMetadata);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'NOINDEX_ON_PUBLISHED_ARTICLE'));
      assert.strictEqual(result.issues[0].severity, 'CRITICAL');
    });
  });

  describe('7. Canonical Integrity Validation', () => {
    test('valid self canonical accepted', () => {
      const validator = new CanonicalValidator();
      const result = validator.validate(sampleDraft, sampleMetadata);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('invalid canonical diblokir dengan INVALID_CANONICAL', () => {
      const validator = new CanonicalValidator();
      const invalidCanonicalMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        canonicalUrl: 'bukan-url-valid-http'
      };

      const result = validator.validate(sampleDraft, invalidCanonicalMetadata);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'INVALID_CANONICAL'));
    });

    test('canonical loop / path mismatch ditandai dengan CANONICAL_LOOP', () => {
      const validator = new CanonicalValidator();
      const mismatchCanonicalMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        canonicalUrl: 'https://nexamos.com/blog/artikel-lain-yang-berbeda-total'
      };

      const result = validator.validate(sampleDraft, mismatchCanonicalMetadata);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'CANONICAL_LOOP'));
    });
  });

  describe('8. Structured Data Validation', () => {
    test('valid visible-data schema accepted', () => {
      const validator = new StructuredDataValidator();
      const result = validator.validate(sampleDraft, sampleMetadata.structuredData);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('fabricated schema field diblokir dengan STRUCTURED_DATA_FABRICATION', () => {
      const validator = new StructuredDataValidator();
      const fabricatedSchema = [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Apakah Aktivitas Blog Masih Relevan di Era AI?',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '1500' // Rating fiktif tanpa produk / ulasan di artikel
          }
        }
      ];

      const result = validator.validate(sampleDraft, fabricatedSchema);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'STRUCTURED_DATA_FABRICATION'));
    });
  });

  describe('9. Content Quality & Differentiation Validation', () => {
    test('strong information gain accepted', () => {
      const validator = new ContentQualitySEOValidator();
      const result = validator.validate(sampleDraft, sampleTopic, sampleEditorialReview);

      assert.strictEqual(result.checkResult.status, 'PASS');
      assert.strictEqual(result.issues.length, 0);
    });

    test('commodity article tanpa diferensiasi ditandai LOW_SEARCH_DIFFERENTIATION', () => {
      const validator = new ContentQualitySEOValidator();
      const commodityTopic: Topic = {
        ...sampleTopic,
        informationGain: {
          expectedContribution: 'Rangkuman artikel luar',
          originalityType: [],
          commodityRisk: 'HIGH'
        }
      };

      const commodityDraft: ArticleDraft = {
        ...sampleDraft,
        // Hapus seksi FRAMEWORK dan EVIDENCE
        sections: sampleDraft.sections.filter((s) => s.purpose !== 'FRAMEWORK' && s.purpose !== 'EVIDENCE')
      };

      const result = validator.validate(commodityDraft, commodityTopic);
      assert.strictEqual(result.checkResult.status, 'FAIL');
      assert.ok(result.issues.some((i) => i.code === 'LOW_SEARCH_DIFFERENTIATION'));
    });
  });

  describe('10. Safe Recommendations System', () => {
    test('rekomendasi tidak mengubah makna faktual dan menandai kebutuhan kembali ke editorial bila substantif', () => {
      // Jalankan skenario di mana topik drift memicu rekomendasi yang memerlukan revisi editorial
      const offTopicDraft: ArticleDraft = {
        ...sampleDraft,
        title: 'Memilih Jenis Bunga untuk Kantor',
        thesis: 'Tanaman hias bunga mawar dan anggrek mempercantik meja kantor.',
        editorialAngle: 'Dekorasi kantor alami',
        sections: [
          {
            id: 'sec-1',
            heading: 'Memilih Bunga',
            purpose: 'CONTEXT',
            content: 'Tanaman hias mempercantik meja kantor.',
            order: 1,
            claimUsageIds: []
          }
        ]
      };

      const result = seoService.validate({
        draft: offTopicDraft,
        metadata: sampleMetadata,
        topic: sampleTopic,
        editorialReview: sampleEditorialReview
      });

      const contentRec = result.recommendations.find((r) => r.type === 'CONTENT_CLARIFICATION');
      assert.ok(contentRec);
      assert.strictEqual(
        contentRec?.requiresEditorialReturn,
        true,
        'Rekomendasi yang membutuhkan penulisan ulang substantif wajib mengeskalasi requiresEditorialReturn: true'
      );
    });
  });

  describe('11. Full Flow: Editorial PASS Draft ➔ SEO Validation ➔ READY', () => {
    test('artikel lolos editorial dengan metadata teknis lengkap meraih status READY / EXCELLENT', () => {
      const result = seoService.validate({
        draft: sampleDraft,
        metadata: sampleMetadata,
        topic: sampleTopic,
        editorialReview: sampleEditorialReview,
        availableArticles
      });

      assert.strictEqual(result.classification === 'READY' || result.classification === 'EXCELLENT', true);
      assert.ok(result.score >= 80);
      assert.strictEqual(result.criticalErrors.length, 0);
      assert.strictEqual(result.policyVersion, 'SEO_VALIDATION_POLICY_V1');
    });

    test('kesalahan teknis kritis menghasilkan status BLOCKED terlepas dari skor numerik', () => {
      const blockedMetadata: ArticleSEOMetadata = {
        ...sampleMetadata,
        publicationStatus: 'PUBLISHED',
        robots: { index: false, follow: true } // NOINDEX pada artikel publikasi
      };

      const result = seoService.validate({
        draft: sampleDraft,
        metadata: blockedMetadata,
        topic: sampleTopic,
        editorialReview: sampleEditorialReview,
        availableArticles
      });

      assert.strictEqual(result.classification, 'BLOCKED');
      assert.ok(result.criticalErrors.some((e) => e.includes('NOINDEX_ON_PUBLISHED_ARTICLE')));
    });

    test('AI SEO Provider menyarankan alternatif judul dan deskripsi yang aman', async () => {
      const provider = new MockAISEOProvider();
      const titleSuggestions = await provider.suggestTitles({ draft: sampleDraft, topic: sampleTopic });
      assert.ok(titleSuggestions.length > 0);
      assert.ok(titleSuggestions[0].suggestedTitle.includes(sampleDraft.title));

      const descSuggestion = await provider.suggestDescription({ draft: sampleDraft, topic: sampleTopic });
      assert.ok(descSuggestion.characterCount > 0);
      assert.ok(descSuggestion.suggestedDescription.length > 0);
    });
  });
});
