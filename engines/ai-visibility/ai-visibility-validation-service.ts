/**
 * NexaMOS AI Visibility Readiness Validation Service (Master Orchestrator)
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menjalankan validasi menyeluruh melintasi 10 dimensi:
 * - GOOGLE_AI_ELIGIBILITY
 * - RETRIEVAL_READINESS
 * - ANSWERABILITY
 * - ENTITY_CLARITY
 * - CLAIM_CLARITY
 * - CITATION_READINESS
 * - SOURCE_TRANSPARENCY
 * - INFORMATION_GAIN
 * - CONTENT_ACCESSIBILITY
 * - MULTIMODAL_READINESS
 *
 * Serta menghasilkan profil ProviderNeutralAIReadiness.
 *
 * DOKTRIN UTAMA:
 * AI VISIBILITY READINESS ≠ AI CITATION GUARANTEE
 * AI VISIBILITY VALIDATOR ≠ SEARCH RANKING PREDICTOR
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type {
  AIVisibilityDimension,
  GenerativeAIInclusionStatus,
  AIVisibilityValidationResult,
  AIVisibilityCheckResult,
  AIVisibilityIssue,
  ProviderNeutralAIReadiness
} from './ai-visibility-validation.ts';
import { GoogleAIEligibilityValidator } from './google-ai-eligibility-validator.ts';
import { RetrievalReadinessValidator } from './retrieval-readiness-validator.ts';
import { AnswerabilityValidator } from './answerability-validator.ts';
import { EntityClarityValidator } from './entity-clarity-validator.ts';
import { ClaimClarityValidator } from './claim-clarity-validator.ts';
import { CitationReadinessValidator } from './citation-readiness-validator.ts';
import { SourceTransparencyValidator } from './source-transparency-validator.ts';
import { InformationGainValidator } from './information-gain-validator.ts';
import {
  ContentAccessibilityValidator,
  type AccessibilitySignals
} from './content-accessibility-validator.ts';
import {
  MultimodalReadinessValidator,
  type MultimodalSignals
} from './multimodal-readiness-validator.ts';
import { AIVisibilityScoreCalculator } from './ai-visibility-score.ts';
import { AIVisibilityRecommendationEngine } from './ai-visibility-recommendation.ts';
import type { AIVisibilityReviewProvider } from './ai-visibility-provider.ts';

export interface AIVisibilityValidationOptions {
  topic?: Topic | null;
  brief?: ResearchBrief | null;
  metadata?: ArticleSEOMetadata | null;
  inclusionStatus?: GenerativeAIInclusionStatus;
  accessibilitySignals?: AccessibilitySignals | null;
  multimodalSignals?: MultimodalSignals | null;
  aiProvider?: AIVisibilityReviewProvider | null;
}

export class AIVisibilityValidationService {
  private readonly googleEligibilityValidator = new GoogleAIEligibilityValidator();
  private readonly retrievalValidator = new RetrievalReadinessValidator();
  private readonly answerabilityValidator = new AnswerabilityValidator();
  private readonly entityClarityValidator = new EntityClarityValidator();
  private readonly claimClarityValidator = new ClaimClarityValidator();
  private readonly citationValidator = new CitationReadinessValidator();
  private readonly sourceTransparencyValidator = new SourceTransparencyValidator();
  private readonly informationGainValidator = new InformationGainValidator();
  private readonly accessibilityValidator = new ContentAccessibilityValidator();
  private readonly multimodalValidator = new MultimodalReadinessValidator();
  private readonly scoreCalculator = new AIVisibilityScoreCalculator();
  private readonly recommendationEngine = new AIVisibilityRecommendationEngine();

  public async validate(
    draft: ArticleDraft,
    options: AIVisibilityValidationOptions = {}
  ): Promise<AIVisibilityValidationResult> {
    const {
      topic = null,
      brief = null,
      metadata = null,
      inclusionStatus = 'INCLUDED',
      accessibilitySignals = null,
      multimodalSignals = null,
      aiProvider = null
    } = options;

    const checks: AIVisibilityCheckResult[] = [];
    const issues: AIVisibilityIssue[] = [];

    // 1. Google Generative AI Eligibility
    const googleRes = this.googleEligibilityValidator.validate(draft, metadata, inclusionStatus);
    checks.push(googleRes.checkResult);
    issues.push(...googleRes.issues);

    // 2. Retrieval Readiness
    const retrievalRes = this.retrievalValidator.validate(draft, topic);
    checks.push(retrievalRes.checkResult);
    issues.push(...retrievalRes.issues);

    // 3. Answerability
    const answerRes = this.answerabilityValidator.validate(draft, topic);
    checks.push(answerRes.checkResult);
    issues.push(...answerRes.issues);

    // 4. Entity Clarity
    const entityRes = this.entityClarityValidator.validate(draft);
    checks.push(entityRes.checkResult);
    issues.push(...entityRes.issues);

    // 5. Claim Clarity
    const claimRes = this.claimClarityValidator.validate(draft);
    checks.push(claimRes.checkResult);
    issues.push(...claimRes.issues);

    // 6. Citation Readiness
    const citationRes = this.citationValidator.validate(draft, brief);
    checks.push(citationRes.checkResult);
    issues.push(...citationRes.issues);

    // 7. Source Transparency
    const sourceRes = this.sourceTransparencyValidator.validate(draft, metadata);
    checks.push(sourceRes.checkResult);
    issues.push(...sourceRes.issues);

    // 8. Information Gain
    const infoGainRes = this.informationGainValidator.validate(draft, topic);
    checks.push(infoGainRes.checkResult);
    issues.push(...infoGainRes.issues);

    // 9. Content Accessibility
    const accessRes = this.accessibilityValidator.validate(draft, accessibilitySignals);
    checks.push(accessRes.checkResult);
    issues.push(...accessRes.issues);

    // 10. Multimodal Readiness
    const multimodalRes = this.multimodalValidator.validate(draft, multimodalSignals);
    checks.push(multimodalRes.checkResult);
    issues.push(...multimodalRes.issues);

    // Opsional: Bantuan AI Reviewer
    if (aiProvider) {
      try {
        const aiReview = await aiProvider.reviewVisibilityReadiness({
          title: draft.title,
          thesis: draft.thesis,
          problem: topic?.problem,
          sections: draft.sections.map((s) => ({ heading: s.heading || '', content: s.content })),
          claims: (draft as any).references?.map((r: any) => r.title || r.citation).filter(Boolean)
        });

        if (aiReview.overclaimedStatements && aiReview.overclaimedStatements.length > 0) {
          issues.push({
            code: 'OVERCLAIMED_STATEMENT',
            checkId: 'AI_CLAIM_CLARITY',
            dimension: 'CLAIM_CLARITY',
            severity: 'WARNING',
            message: `AI Review mendeteksi klaim berlebihan: ${aiReview.overclaimedStatements.join(', ')}`,
            location: 'content',
            recommendation: aiReview.suggestedClarifications?.[0] || 'Perlunak klaim absolut.'
          });
        }
      } catch {
        // AI Review bersifat non-blocking enhancement
      }
    }

    // Agregasi Dimensi Skor
    const dimensions: Record<AIVisibilityDimension, number> = {
      GOOGLE_AI_ELIGIBILITY: googleRes.score,
      RETRIEVAL_READINESS: retrievalRes.score,
      ANSWERABILITY: answerRes.score,
      ENTITY_CLARITY: entityRes.score,
      CLAIM_CLARITY: claimRes.score,
      CITATION_READINESS: citationRes.score,
      SOURCE_TRANSPARENCY: sourceRes.score,
      INFORMATION_GAIN: infoGainRes.score,
      CONTENT_ACCESSIBILITY: accessRes.score,
      MULTIMODAL_READINESS: multimodalRes.score
    };

    const totalScore = this.scoreCalculator.calculateTotalScore(dimensions);

    const classification = this.scoreCalculator.determineClassification(
      totalScore,
      googleRes.eligibility,
      issues
    );

    const criticalBlockingReasons = issues
      .filter((i) => i.severity === 'CRITICAL')
      .map((i) => `[${i.code}] ${i.message}`);

    const recommendations = this.recommendationEngine.generate(issues);

    // Profil Provider-Neutral
    const providerNeutralReadiness: ProviderNeutralAIReadiness = {
      retrievability: retrievalRes.retrievability,
      answerability: answerRes.answerability,
      entityClarity: entityRes.entityClarity,
      claimTraceability: citationRes.claimTraceability,
      sourceTransparency: sourceRes.sourceTransparency,
      informationGain: infoGainRes.informationGain
    };

    return {
      articleId: draft.id || 'draft-unassigned',
      googleEligibility: googleRes.eligibility,
      providerNeutralReadiness,
      checks,
      issues,
      recommendations,
      dimensions,
      score: totalScore,
      classification,
      criticalBlockingReasons,
      validatedAt: new Date().toISOString(),
      policyVersion: 'AI_VISIBILITY_READINESS_POLICY_V1'
    };
  }
}
