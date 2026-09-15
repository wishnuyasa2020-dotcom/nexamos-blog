/**
 * NexaMOS Google Discover Readiness Validation Service (Master Orchestrator)
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menjalankan validasi Discover komprehensif melintasi 10 dimensi:
 * - Keterindeksan & Kelayakan Dasar (Eligibility)
 * - Orisinalitas (Originality)
 * - Kedalaman Konten (Depth)
 * - Ketepatan Waktu (Timeliness)
 * - Keselarasan Minat (Interest Fit)
 * - Keahlian Topik per Topik (Topical Expertise)
 * - Relevansi Lokal Indonesia (Local Relevance)
 * - Integritas Judul & Anti-Clickbait (Title Integrity)
 * - Kesiapan Aset Visual 1200px & Lanskap (Visual Readiness)
 * - Pengalaman Halaman Empiris (Page Experience)
 * - Kepatuhan Kebijakan Konten (Policy Safety)
 *
 * Doktrin Inti:
 * DISCOVER READINESS ≠ DISCOVER RANK PREDICTION
 * DISCOVER ELIGIBILITY ≠ GUARANTEE OF APPEARANCE
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { ExistingArticleIndexItem } from '../seo-validator/internal-link.ts';
import type {
  DiscoverDimension,
  DiscoverVisualAsset,
  DiscoverValidationResult,
  DiscoverCheckResult,
  DiscoverIssue
} from './discover-validation.ts';
import { DiscoverEligibilityValidator } from './discover-eligibility-validator.ts';
import { DiscoverOriginalityValidator } from './discover-originality-validator.ts';
import { DiscoverDepthValidator } from './discover-depth-validator.ts';
import { DiscoverTimelinessValidator } from './discover-timeliness-validator.ts';
import { DiscoverInterestFitValidator } from './discover-interest-fit-validator.ts';
import { DiscoverTopicExpertiseValidator } from './discover-topic-expertise-validator.ts';
import { DiscoverLocalRelevanceValidator } from './discover-local-relevance-validator.ts';
import { DiscoverTitleValidator } from './discover-title-validator.ts';
import { DiscoverVisualValidator } from './discover-visual-validator.ts';
import {
  DiscoverPageExperienceValidator,
  type PageExperienceSignals
} from './discover-page-experience-validator.ts';
import { DiscoverPolicyRiskValidator } from './discover-policy-risk-validator.ts';
import { DiscoverReadinessScoreCalculator } from './discover-readiness-score.ts';
import { DiscoverRecommendationEngine } from './discover-recommendation.ts';
import type { AIDiscoverProvider } from './ai-discover-provider.ts';

export interface DiscoverValidationOptions {
  topic?: Topic | null;
  brief?: ResearchBrief | null;
  metadata?: ArticleSEOMetadata | null;
  primaryAsset?: DiscoverVisualAsset | null;
  pageExperience?: PageExperienceSignals | null;
  inventory?: ExistingArticleIndexItem[];
  referenceDate?: Date;
  maxImagePreview?: string;
  aiProvider?: AIDiscoverProvider | null;
}

export class DiscoverValidationService {
  private readonly eligibilityValidator = new DiscoverEligibilityValidator();
  private readonly originalityValidator = new DiscoverOriginalityValidator();
  private readonly depthValidator = new DiscoverDepthValidator();
  private readonly timelinessValidator = new DiscoverTimelinessValidator();
  private readonly interestFitValidator = new DiscoverInterestFitValidator();
  private readonly topicExpertiseValidator = new DiscoverTopicExpertiseValidator();
  private readonly localRelevanceValidator = new DiscoverLocalRelevanceValidator();
  private readonly titleValidator = new DiscoverTitleValidator();
  private readonly visualValidator = new DiscoverVisualValidator();
  private readonly pageExperienceValidator = new DiscoverPageExperienceValidator();
  private readonly policyRiskValidator = new DiscoverPolicyRiskValidator();
  private readonly scoreCalculator = new DiscoverReadinessScoreCalculator();
  private readonly recommendationEngine = new DiscoverRecommendationEngine();

  public async validate(
    draft: ArticleDraft,
    options: DiscoverValidationOptions = {}
  ): Promise<DiscoverValidationResult> {
    const {
      topic = null,
      brief = null,
      metadata = null,
      primaryAsset = null,
      pageExperience = null,
      inventory = [],
      referenceDate = new Date(),
      maxImagePreview = 'large',
      aiProvider = null
    } = options;

    const checks: DiscoverCheckResult[] = [];
    const issues: DiscoverIssue[] = [];

    // 1. Kelayakan Dasar (Indexability & Primary Content)
    const eligibilityRes = this.eligibilityValidator.validate(draft, metadata);
    checks.push(eligibilityRes.checkResult);
    issues.push(...eligibilityRes.issues);

    // 2. Orisinalitas
    const originalityRes = this.originalityValidator.validate(draft, topic, brief);
    checks.push(originalityRes.checkResult);
    issues.push(...originalityRes.issues);

    // 3. Kedalaman (In-depth Content)
    const depthRes = this.depthValidator.validate(draft);
    checks.push(depthRes.checkResult);
    issues.push(...depthRes.issues);

    // 4. Ketepatan Waktu & Kesegaran
    const timelinessRes = this.timelinessValidator.validate(topic, metadata, referenceDate);
    checks.push(timelinessRes.checkResult);
    issues.push(...timelinessRes.issues);

    // 5. Keselarasan Minat
    const interestFitRes = this.interestFitValidator.validate(draft, topic);
    checks.push(interestFitRes.checkResult);
    issues.push(...interestFitRes.issues);

    // 6. Keahlian Topik per Topik
    const topicExpertiseRes = this.topicExpertiseValidator.validate(draft, topic, inventory);
    checks.push(topicExpertiseRes.checkResult);
    issues.push(...topicExpertiseRes.issues);

    // 7. Relevansi Lokal Indonesia (Opportunity Signal)
    const localRelevanceRes = this.localRelevanceValidator.validate(draft, topic);
    checks.push(localRelevanceRes.checkResult);
    issues.push(...localRelevanceRes.issues);

    // 8. Integritas Judul & Anti-Clickbait
    const titleRes = this.titleValidator.validate(draft);
    checks.push(titleRes.checkResult);
    issues.push(...titleRes.issues);

    // Opsional: AI review untuk nuansa clickbait atau title improvement
    if (aiProvider && draft.title) {
      try {
        const aiReview = await aiProvider.reviewDiscoverReadiness({
          title: draft.title,
          thesis: draft.thesis,
          editorialAngle: draft.editorialAngle,
          sections: draft.sections.map((s) => ({ heading: s.heading, content: s.content })),
          visualAssetAlt: primaryAsset?.alt
        });

        if (aiReview.isClickbait && !titleRes.isClickbait) {
          issues.push({
            code: 'DISCOVER_CLICKBAIT_RISK',
            checkId: 'DISCOVER_TITLE_INTEGRITY',
            dimension: 'TITLE_INTEGRITY',
            severity: 'WARNING',
            message: aiReview.clickbaitExplanation || 'AI Review mendeteksi gaya clickbait pada judul.',
            location: 'draft.title',
            recommendation: aiReview.suggestedTitleImprovements?.[0] || 'Sesuaikan judul dengan argumen artikel.'
          });
        }
      } catch {
        // AI Review bersifat non-blocking enhancement
      }
    }

    // 9. Kesiapan Aset Visual
    const visualRes = this.visualValidator.validate(primaryAsset, maxImagePreview);
    checks.push(visualRes.checkResult);
    issues.push(...visualRes.issues);

    // 10. Pengalaman Halaman
    const pageExpRes = this.pageExperienceValidator.validate(pageExperience);
    checks.push(pageExpRes.checkResult);
    issues.push(...pageExpRes.issues);

    // 11. Kepatuhan Kebijakan Konten
    const policyRiskRes = this.policyRiskValidator.validate(draft, metadata);
    checks.push(policyRiskRes.checkResult);
    issues.push(...policyRiskRes.issues);

    // Agregasi Nilai Dimensi
    const dimensions: Record<DiscoverDimension, number> = {
      ORIGINALITY: originalityRes.score,
      DEPTH: depthRes.score,
      TIMELINESS: timelinessRes.score,
      TOPICAL_EXPERTISE: topicExpertiseRes.score,
      INTEREST_FIT: interestFitRes.score,
      TITLE_INTEGRITY: titleRes.score,
      VISUAL_READINESS: visualRes.score,
      PAGE_EXPERIENCE: pageExpRes.score,
      LOCAL_RELEVANCE: localRelevanceRes.score,
      POLICY_SAFETY: policyRiskRes.score
    };

    // Kalkulasi Skor Total
    const totalScore = this.scoreCalculator.calculateTotalScore(dimensions);

    // Penentuan Klasifikasi & Alasan Critical
    const criticalIneligibilityReasons = issues
      .filter((i) => i.severity === 'CRITICAL')
      .map((i) => `[${i.code}] ${i.message}`);

    const classification = this.scoreCalculator.determineClassification(
      totalScore,
      eligibilityRes.eligibility,
      issues
    );

    // Generate Rekomendasi
    const recommendations = this.recommendationEngine.generate(issues);

    return {
      articleId: draft.id || 'draft-unassigned',
      checks,
      issues,
      recommendations,
      dimensions,
      score: totalScore,
      classification,
      eligibility: eligibilityRes.eligibility,
      criticalIneligibilityReasons,
      validatedAt: new Date().toISOString(),
      policyVersion: 'DISCOVER_READINESS_POLICY_V1'
    };
  }
}
