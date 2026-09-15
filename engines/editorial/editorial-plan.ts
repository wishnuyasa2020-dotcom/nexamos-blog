/**
 * NexaMOS Editorial Plan Model & Validation
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Rencana editorial terstruktur sebelum penulisan naskah artikel.
 */

import type { ArticleSectionPurpose } from './article-section.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';

export interface SectionPlanItem {
  heading: string;
  purpose: ArticleSectionPurpose;
  keyPoints: string[];
  plannedClaimIds: string[];
}

export interface EditorialPlan {
  workingTitle: string;
  thesis: string;
  angle: string;
  readerPromise: string;
  sectionPlan: SectionPlanItem[];
  claimsToUse: string[];
  findingsToUse: string[];
  counterpoints: string[];
  intendedTakeaway: string;
}

export interface EditorialPlanValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validasi kepatuhan Editorial Plan terhadap aturan doktrin editorial.
 */
export function validateEditorialPlan(
  plan: EditorialPlan,
  articleType: ArticleType
): EditorialPlanValidationResult {
  const errors: string[] = [];

  if (!plan.workingTitle || plan.workingTitle.trim().length === 0) {
    errors.push('EDITORIAL_PLAN_INVALID: workingTitle wajib diisi');
  }

  // Thesis rule: wajib diisi kecuali GLOSSARY dan REFERENCE
  const requiresThesis = articleType !== 'GLOSSARY' && articleType !== 'REFERENCE';
  if (requiresThesis) {
    if (!plan.thesis || plan.thesis.trim().length === 0) {
      errors.push(`THESIS_REQUIRED: Artikel tipe ${articleType} wajib memiliki thesis yang jelas dan spesifik`);
    } else if (plan.thesis.trim().length < 15) {
      errors.push(`THESIS_TOO_SHORT: Thesis untuk tipe ${articleType} harus spesifik dan substansial`);
    }
  }

  if (!plan.sectionPlan || plan.sectionPlan.length === 0) {
    errors.push('SECTION_PLAN_EMPTY: Rencana seksi artikel tidak boleh kosong');
  } else {
    for (let i = 0; i < plan.sectionPlan.length; i++) {
      const section = plan.sectionPlan[i];
      if (!section.heading || section.heading.trim().length === 0) {
        errors.push(`SECTION_HEADING_MISSING: Seksi pada indeks ${i} tidak memiliki heading`);
      }
      if (!section.purpose) {
        errors.push(`SECTION_PURPOSE_MISSING: Seksi pada indeks ${i} tidak memiliki purpose`);
      }
    }
  }

  if (!plan.readerPromise || plan.readerPromise.trim().length === 0) {
    errors.push('READER_PROMISE_MISSING: Editorial plan wajib mendefinisikan readerPromise');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
