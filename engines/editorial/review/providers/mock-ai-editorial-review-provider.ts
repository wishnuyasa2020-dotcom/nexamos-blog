/**
 * NexaMOS Mock AI Editorial Review Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Implementasi mock AI deterministik untuk evaluasi review dan revisi bedah tanpa API eksternal.
 */

import type { AIEditorialReviewProvider } from '../ai-editorial-review-provider.ts';
import type { ArticleDraft } from '../../article-draft.ts';
import type { ArticleSection } from '../../article-section.ts';
import type { EditorialReview } from '../editorial-review.ts';
import type { EditorialRevisionPlan } from '../revision-planner.ts';
import { EditorialQualityEvaluator } from '../editorial-quality-evaluator.ts';
import { RevisionPlanner } from '../revision-planner.ts';

export interface MockAIReviewProviderConfig {
  injectChangedPercentage?: boolean;
  injectClaimStrengthEscalation?: boolean;
  injectInventedQuote?: boolean;
  injectOmittedLimitation?: boolean;
}

export class MockAIEditorialReviewProvider implements AIEditorialReviewProvider {
  private config: MockAIReviewProviderConfig;
  private readonly qualityEvaluator = new EditorialQualityEvaluator();
  private readonly revisionPlanner = new RevisionPlanner();

  constructor(config: MockAIReviewProviderConfig = {}) {
    this.config = config;
  }

  public setConfig(config: MockAIReviewProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  public async reviewStyle(draft: ArticleDraft): Promise<EditorialReview> {
    return this.qualityEvaluator.evaluate(draft);
  }

  public async proposeRevision(
    draft: ArticleDraft,
    review: EditorialReview
  ): Promise<EditorialRevisionPlan> {
    return this.revisionPlanner.plan(draft, review);
  }

  public async reviseSection(
    draft: ArticleDraft,
    sectionId: string,
    instruction: string,
    plan: EditorialRevisionPlan
  ): Promise<ArticleSection> {
    const section = draft.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section with id ${sectionId} not found in draft.`);
    }

    let revisedContent = section.content;

    // Skenario 1: Sengaja ubah angka persentase untuk test grounding regression
    if (this.config.injectChangedPercentage) {
      if (revisedContent.includes('85%')) {
        revisedContent = revisedContent.replace(/\b85%\b/g, '95%');
      } else {
        revisedContent = `${revisedContent} Tingkat retensi diprediksi berubah secara drastis sebesar 99.9% tanpa rujukan.`;
      }
      return {
        ...section,
        content: revisedContent
      };
    }

    // Skenario 2: Sengaja eskalasi korelasi menjadi klaim mutlak / sebab-akibat ekstrem
    if (this.config.injectClaimStrengthEscalation) {
      revisedContent = `${revisedContent} Hasil ini membuktikan secara mutlak bahwa tanpa blog, seluruh bisnis pasti akan hancur dan gagal total tanpa pengecualian.`;
      return {
        ...section,
        content: revisedContent
      };
    }

    // Skenario 3: Sengaja suntik kutipan karangan
    if (this.config.injectInventedQuote) {
      revisedContent = `${revisedContent} Pakar riset menambahkan: "Tidak ada satu pun strategi konten konvensional yang dapat bertahan di masa kini."`;
      return {
        ...section,
        content: revisedContent
      };
    }

    // Revisi normal (bersih & presisi)
    // Hapus klise "dalam era digital", "penting untuk dicatat bahwa", dsb.
    revisedContent = revisedContent
      .replace(/Banyak yang memperkirakan bahwa kemunculan AI generatif akan mematikan fungsi blog\./g, 'Perkembangan kecerdasan buatan kerap dinarasikan sebagai akhir dari era blog.')
      .replace(/penting untuk dicatat bahwa\s*/gi, '')
      .replace(/dalam era modern ini\s*,?\s*/gi, '');

    return {
      ...section,
      content: revisedContent
    };
  }
}
