/**
 * NexaMOS Editorial Revision Service
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Menjalankan alur revisi bedah (Surgical Revision) terarah, mengevaluasi regresi grounding
 * (Grounding Recheck), dan mendeteksi eskalasi klaim semantik (CLAIM_STRENGTH_ESCALATION).
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ArticleSection } from '../article-section.ts';
import type { ResearchBrief } from '../../research/orchestrator/research-brief.ts';
import type { EditorialReview } from './editorial-review.ts';
import type { EditorialRevisionPlan } from './revision-planner.ts';
import type { AIEditorialReviewProvider } from './ai-editorial-review-provider.ts';
import { EditorialQualityEvaluator } from './editorial-quality-evaluator.ts';
import { RevisionPlanner } from './revision-planner.ts';
import { GroundingGuard } from '../grounding-guard.ts';

export interface RevisionExecutionResult {
  success: boolean;
  originalDraft: ArticleDraft;
  revisedDraft?: ArticleDraft | null;
  revisionPlan?: EditorialRevisionPlan | null;
  initialReview: EditorialReview;
  finalReview?: EditorialReview | null;
  regressionDetected: boolean;
  regressionReasons?: string[];
}

export interface EditorialRevisionServiceDependencies {
  aiReviewProvider: AIEditorialReviewProvider;
  qualityEvaluator?: EditorialQualityEvaluator;
  revisionPlanner?: RevisionPlanner;
  groundingGuard?: GroundingGuard;
}

export class EditorialRevisionService {
  private readonly aiProvider: AIEditorialReviewProvider;
  private readonly qualityEvaluator: EditorialQualityEvaluator;
  private readonly revisionPlanner: RevisionPlanner;
  private readonly groundingGuard: GroundingGuard;

  constructor(deps: EditorialRevisionServiceDependencies) {
    this.aiProvider = deps.aiReviewProvider;
    this.qualityEvaluator = deps.qualityEvaluator || new EditorialQualityEvaluator();
    this.revisionPlanner = deps.revisionPlanner || new RevisionPlanner();
    this.groundingGuard = deps.groundingGuard || new GroundingGuard();
  }

  /**
   * Menjalankan proses review dan revisi bedah terarah secara aman
   */
  public async reviewAndRevise(
    draft: ArticleDraft,
    brief: ResearchBrief
  ): Promise<RevisionExecutionResult> {
    // 1. Jalankan Initial Review
    const initialReview = await this.aiProvider.reviewStyle(draft);

    // Jika sudah PASS dan tidak ada kebutuhan revisi
    if (initialReview.status === 'PASS' && initialReview.issues.length === 0) {
      return {
        success: true,
        originalDraft: draft,
        revisedDraft: draft,
        initialReview,
        finalReview: initialReview,
        regressionDetected: false
      };
    }

    // 2. Susun Rencana Revisi Bedah (Surgical Revision Plan)
    const revisionPlan = this.revisionPlanner.plan(draft, initialReview, brief);

    // Jika tidak ada seksi yang perlu direvisi
    if (revisionPlan.sectionsToRevise.length === 0) {
      return {
        success: true,
        originalDraft: draft,
        revisedDraft: draft,
        revisionPlan,
        initialReview,
        finalReview: initialReview,
        regressionDetected: false
      };
    }

    // 3. Lakukan Revisi Seksi Terarah (Hanya seksi yang ditargetkan)
    const candidateSections: ArticleSection[] = [];
    const regressionReasons: string[] = [];

    for (const sec of draft.sections) {
      if (revisionPlan.sectionsToRevise.includes(sec.id)) {
        try {
          const revisedSection = await this.aiProvider.reviseSection(
            draft,
            sec.id,
            'Tingkatkan kelancaran baca dan hilangkan frasa klise tanpa mengubah angka, fakta, atau kutipan.',
            revisionPlan
          );

          // 4. Semantic Preservation Check: Deteksi Eskalasi Kekuatan Klaim
          const escalation = this.detectClaimStrengthEscalation(sec.content, revisedSection.content);
          if (escalation) {
            regressionReasons.push(`CLAIM_STRENGTH_ESCALATION: ${escalation}`);
          }

          candidateSections.push(revisedSection);
        } catch (err: any) {
          regressionReasons.push(`REVISION_FAILED: ${err.message}`);
          candidateSections.push(sec);
        }
      } else {
        // Seksi yang tidak bermasalah dipertahankan 100% utuh tanpa diubah
        candidateSections.push(sec);
      }
    }

    // Bentuk calon draf hasil revisi
    const candidateDraft: ArticleDraft = {
      ...draft,
      sections: candidateSections,
      generatedAt: new Date().toISOString()
    };

    // 5. Grounding Recheck: Jalankan Grounding Guard Phase 3A lagi
    const groundingRecheck = this.groundingGuard.evaluate(candidateDraft, brief);
    if (groundingRecheck.status === 'FAIL') {
      for (const issue of groundingRecheck.issues) {
        if (issue.severity === 'CRITICAL') {
          regressionReasons.push(`REVISION_GROUNDING_REGRESSION: ${issue.code} - ${issue.message}`);
        }
      }
    }

    // Jika ditemukan regresi grounding atau eskalasi klaim
    if (regressionReasons.length > 0) {
      return {
        success: false,
        originalDraft: draft,
        revisedDraft: null, // Tolak dan jangan ganti draft sebelumnya!
        revisionPlan,
        initialReview,
        regressionDetected: true,
        regressionReasons
      };
    }

    // 6. Jika Lolos: Lakukan Re-evaluasi Kualitas Akhir
    const finalReview = this.qualityEvaluator.evaluate(candidateDraft);

    return {
      success: true,
      originalDraft: draft,
      revisedDraft: candidateDraft,
      revisionPlan,
      initialReview,
      finalReview,
      regressionDetected: false
    };
  }

  /**
   * Mendeteksi apakah revisi mengubah klaim korelasi/saran wajar menjadi klaim kausal mutlak tanpa bukti
   */
  private detectClaimStrengthEscalation(originalText: string, revisedText: string): string | null {
    const extremeAbsolutePatterns = [
      /\b(membuktikan secara mutlak bahwa)\b/i,
      /\bpasti akan hancur dan gagal total tanpa pengecualian\b/i,
      /\bmenjamin 100% kepastian keberhasilan\b/i
    ];

    for (const pattern of extremeAbsolutePatterns) {
      if (pattern.test(revisedText) && !pattern.test(originalText)) {
        return `Revisi menambahkan klaim absolut (${revisedText.match(pattern)?.[0]}) yang tidak ada pada naskah asli.`;
      }
    }

    return null;
  }
}
