/**
 * NexaMOS AI Editorial Review Provider Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Antarmuka provider-agnostic untuk review gaya dan revisi bedah seksi artikel.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ArticleSection } from '../article-section.ts';
import type { EditorialReview } from './editorial-review.ts';
import type { EditorialRevisionPlan } from './revision-planner.ts';

export interface AIEditorialReviewProvider {
  /**
   * Menilai naskah draf dari sudut pandang gaya, kejelasan, dan retorika
   */
  reviewStyle(draft: ArticleDraft): Promise<EditorialReview>;

  /**
   * Merumuskan rencana revisi bedah
   */
  proposeRevision(draft: ArticleDraft, review: EditorialReview): Promise<EditorialRevisionPlan>;

  /**
   * Merevisi satu seksi tertentu sesuai instruksi dan batasan preservasi
   */
  reviseSection(
    draft: ArticleDraft,
    sectionId: string,
    instruction: string,
    plan: EditorialRevisionPlan
  ): Promise<ArticleSection>;
}
