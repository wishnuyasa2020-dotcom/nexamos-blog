/**
 * NexaMOS SEO Validation Service
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Layanan orkestrasi validasi kesiapan SEO artikel editorial (Distribution Validation Layer).
 * Menegakkan prinsip kanonik:
 * - EDITORIAL QUALITY > SEO MECHANICS
 * - SEO adalah distribution validation layer, bukan authority editorial.
 * - Rekomendasi yang memerlukan penulisan ulang substantif dialihkan ke RETURN_TO_EDITORIAL.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { EditorialReview } from '../editorial/review/editorial-review.ts';
import type { ArticleSEOMetadata } from './article-seo-metadata.ts';
import type { ExistingArticleIndexItem } from './internal-link.ts';
import type {
  SEOValidationResult,
  SEOCheckResult,
  SEOIssue,
  SafeSEORecommendation
} from './seo-validation.ts';
import { SearchIntentValidator } from './search-intent-validator.ts';
import { TopicFocusValidator } from './topic-focus-validator.ts';
import { TitleValidator } from './title-validator.ts';
import { MetaDescriptionValidator } from './meta-description-validator.ts';
import { HeadingStructureValidator } from './heading-structure-validator.ts';
import { InternalLinkValidator } from './internal-link-validator.ts';
import { ImageSEOValidator } from './image-seo-validator.ts';
import { StructuredDataValidator } from './structured-data-validator.ts';
import { CanonicalValidator } from './canonical-validator.ts';
import { IndexabilityValidator } from './indexability-validator.ts';
import { ContentQualitySEOValidator } from './content-quality-seo-validator.ts';
import { URLSlugValidator } from './url-slug-validator.ts';
import { SEOReadinessScorer, SEO_VALIDATION_POLICY_VERSION } from './seo-readiness-score.ts';

export interface ValidateSEORequest {
  draft: ArticleDraft;
  metadata?: ArticleSEOMetadata | null;
  topic?: Topic | null;
  editorialReview?: EditorialReview | null;
  availableArticles?: ExistingArticleIndexItem[];
  expectedDomain?: string;
  existingTitles?: string[];
}

export class SEOValidationService {
  private readonly searchIntentValidator = new SearchIntentValidator();
  private readonly topicFocusValidator = new TopicFocusValidator();
  private readonly titleValidator = new TitleValidator();
  private readonly metaDescriptionValidator = new MetaDescriptionValidator();
  private readonly headingStructureValidator = new HeadingStructureValidator();
  private readonly internalLinkValidator = new InternalLinkValidator();
  private readonly imageSEOValidator = new ImageSEOValidator();
  private readonly structuredDataValidator = new StructuredDataValidator();
  private readonly canonicalValidator = new CanonicalValidator();
  private readonly indexabilityValidator = new IndexabilityValidator();
  private readonly contentQualityValidator = new ContentQualitySEOValidator();
  private readonly urlSlugValidator = new URLSlugValidator();
  private readonly readinessScorer = new SEOReadinessScorer();

  public validate(request: ValidateSEORequest): SEOValidationResult {
    const {
      draft,
      metadata,
      topic,
      editorialReview,
      availableArticles = [],
      expectedDomain = 'nexamos.com',
      existingTitles = []
    } = request;

    const allChecks: SEOCheckResult[] = [];
    const allIssues: SEOIssue[] = [];
    const recommendations: SafeSEORecommendation[] = [];

    // Fallback topic jika tidak disediakan
    const effectiveTopic: Topic = topic || {
      id: draft.topicId,
      title: draft.title,
      slug: draft.slug || 'artikel',
      territory: draft.territory,
      status: 'APPROVED',
      editorialRole: draft.editorialRole,
      audience: { segment: 'Umum' },
      problem: draft.editorialAngle,
      intent: { primary: draft.title },
      thesis: draft.thesis,
      whyNow: '',
      informationGain: {
        expectedContribution: 'Analisis mendalam',
        originalityType: ['CROSS_THEORY_SYNTHESIS'],
        commodityRisk: 'LOW'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E2',
        plannedSources: [],
        originalEvidenceRequired: false
      },
      businessRelevance: { objective: 'AWARENESS', funnelRole: 'TOFU' },
      recommendedArticleType: draft.articleType,
      distributionTargets: ['GOOGLE_SEARCH'],
      createdAt: draft.generatedAt,
      updatedAt: draft.generatedAt
    };

    // 1. LAYER CONTENT SEO
    // 1.1 Search Intent Validation
    const intentResult = this.searchIntentValidator.validate(draft, effectiveTopic);
    allChecks.push(intentResult.checkResult);
    allIssues.push(...intentResult.issues);

    // 1.2 Topic Focus & Drift Validation
    const focusResult = this.topicFocusValidator.validate(draft, effectiveTopic);
    allChecks.push(focusResult.checkResult);
    allIssues.push(...focusResult.issues);

    // 1.3 Content Quality & Differentiation Validation
    const diffResult = this.contentQualityValidator.validate(draft, effectiveTopic, editorialReview);
    allChecks.push(diffResult.checkResult);
    allIssues.push(...diffResult.issues);

    // 2. LAYER ON-PAGE SEO
    // 2.1 Title Validation
    const titleResult = this.titleValidator.validate(draft, effectiveTopic, existingTitles);
    allChecks.push(titleResult.checkResult);
    allIssues.push(...titleResult.issues);

    // 2.2 Meta Description Validation
    const metaDescResult = this.metaDescriptionValidator.validate(draft, metadata);
    allChecks.push(metaDescResult.checkResult);
    allIssues.push(...metaDescResult.issues);

    // 2.3 Heading Structure Validation
    const headingResult = this.headingStructureValidator.validate(draft);
    allChecks.push(headingResult.checkResult);
    allIssues.push(...headingResult.issues);

    // 2.4 URL Slug Validation
    const isPublished = metadata?.publicationStatus === 'PUBLISHED';
    const slugResult = this.urlSlugValidator.validate(draft, metadata?.slug, isPublished);
    allIssues.push(...slugResult.issues);

    // 2.5 Image SEO Validation (jika aset visual ada)
    const imageResult = this.imageSEOValidator.validate(
      metadata?.primaryImage,
      metadata?.additionalImages
    );
    allChecks.push(imageResult.checkResult);
    allIssues.push(...imageResult.issues);

    // 3. LAYER TECHNICAL ARTICLE READINESS
    // 3.1 Internal Link Validation
    const internalLinkResult = this.internalLinkValidator.validate(draft, availableArticles);
    allChecks.push(internalLinkResult.checkResult);
    allIssues.push(...internalLinkResult.issues);

    // 3.2 Indexability Validation
    const indexabilityResult = this.indexabilityValidator.validate(draft, metadata);
    allChecks.push(indexabilityResult.checkResult);
    allIssues.push(...indexabilityResult.issues);

    // 3.3 Canonical Integrity Validation
    const canonicalResult = this.canonicalValidator.validate(draft, metadata, expectedDomain);
    allChecks.push(canonicalResult.checkResult);
    allIssues.push(...canonicalResult.issues);

    // 3.4 Structured Data Validation
    const structuredDataResult = this.structuredDataValidator.validate(
      draft,
      metadata?.structuredData
    );
    allChecks.push(structuredDataResult.checkResult);
    allIssues.push(...structuredDataResult.issues);

    // 4. GENERASI REKOMENDASI AMAN (SAFE RECOMMENDATIONS)
    for (const issue of allIssues) {
      if (
        issue.code === 'SEARCH_INTENT_MISMATCH' ||
        issue.code === 'TOPIC_DRIFT' ||
        issue.code === 'TOPIC_FOCUS_WEAK' ||
        issue.code === 'LOW_SEARCH_DIFFERENTIATION'
      ) {
        recommendations.push({
          type: 'CONTENT_CLARIFICATION',
          title: `Penyelarasan Intent & Topik [${issue.code}]`,
          description: issue.message,
          suggestedAction: issue.recommendation || 'Lakukan penyesuaian sudut pandang.',
          requiresEditorialReturn: true // Perubahan substantif wajib dikembalikan ke editorial
        });
      } else if (issue.code === 'STRUCTURED_DATA_FABRICATION' || issue.code === 'STRUCTURED_DATA_SCHEMA_MISMATCH') {
        recommendations.push({
          type: 'STRUCTURED_DATA_FIX',
          title: `Perbaikan Schema [${issue.code}]`,
          description: issue.message,
          suggestedAction: issue.recommendation || 'Perbaiki schema JSON-LD sesuai visible content.',
          requiresEditorialReturn: false
        });
      } else if (issue.code === 'NOINDEX_ON_PUBLISHED_ARTICLE' || issue.code === 'INVALID_CANONICAL' || issue.code === 'CANONICAL_LOOP') {
        recommendations.push({
          type: 'TECHNICAL_FIX',
          title: `Perbaikan Konfigurasi Teknis [${issue.code}]`,
          description: issue.message,
          suggestedAction: issue.recommendation || 'Perbaiki konfigurasi robots atau URL kanonikal.',
          requiresEditorialReturn: false
        });
      } else if (issue.code === 'ORPHAN_ARTICLE_RISK' || issue.code === 'DUPLICATE_ANCHOR_ISSUE') {
        recommendations.push({
          type: 'INTERNAL_LINK_OPPORTUNITY',
          title: `Peluang Tautan Internal [${issue.code}]`,
          description: issue.message,
          suggestedAction: issue.recommendation || 'Tambahkan tautan internal kontekstual.',
          requiresEditorialReturn: false
        });
      } else {
        recommendations.push({
          type: 'METADATA_IMPROVEMENT',
          title: `Optimasi Presentasi Snippet [${issue.code}]`,
          description: issue.message,
          suggestedAction: issue.recommendation || 'Tingkatkan kualitas metadata judul atau deskripsi.',
          requiresEditorialReturn: false
        });
      }
    }

    // Rekomendasi tambahan dari kandidat internal link
    for (const candidate of internalLinkResult.candidates.slice(0, 3)) {
      recommendations.push({
        type: 'INTERNAL_LINK_OPPORTUNITY',
        title: `Tautkan ke Artikel: "${candidate.targetTitle}"`,
        description: `Peluang penguatan relevansi entitas dengan menautkan ke ${candidate.targetUrl}.`,
        suggestedAction: `Sisipkan anchor "${candidate.suggestedAnchorText}" pada pembahasan yang relevan.`,
        requiresEditorialReturn: false
      });
    }

    // 5. SKOR AKHIR DAN KLASIFIKASI
    const computed = this.readinessScorer.compute(allChecks, allIssues);

    return {
      articleId: draft.id,
      checks: allChecks,
      issues: allIssues,
      recommendations,
      score: computed.score,
      dimensionScores: computed.dimensionScores,
      classification: computed.classification,
      criticalErrors: computed.criticalErrors,
      validatedAt: new Date().toISOString(),
      policyVersion: SEO_VALIDATION_POLICY_VERSION
    };
  }
}
