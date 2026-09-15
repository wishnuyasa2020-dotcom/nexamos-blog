/**
 * NexaMOS Editorial Revision Planner
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Menyusun rencana revisi bedah terarah (SURGICAL REVISION) dengan batasan preservasi
 * data, angka, kutipan, dan klaim yang ketat.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { EditorialReview, ReviewIssue } from './editorial-review.ts';
import type { ResearchBrief } from '../../research/orchestrator/research-brief.ts';

export interface EditorialRevisionPlan {
  articleDraftId: string;
  issuesToFix: ReviewIssue[];
  sectionsToRevise: string[];
  preserveClaims: string[];
  preserveCitations: string[];
  preserveQuotes: string[];
  preserveNumbers: string[];
  preserveLimitations: string[];
  preserveCounterEvidence: string[];
}

export class RevisionPlanner {
  /**
   * Menyusun EditorialRevisionPlan dari draft dan review
   */
  public plan(
    draft: ArticleDraft,
    review: EditorialReview,
    brief?: ResearchBrief | null
  ): EditorialRevisionPlan {
    // Kumpulkan seksi yang memiliki masalah
    const targetSectionIds = new Set<string>();
    const issuesToFix: ReviewIssue[] = [];

    for (const issue of review.issues) {
      if (issue.severity === 'MINOR' || issue.severity === 'MAJOR' || issue.severity === 'CRITICAL') {
        issuesToFix.push(issue);
        if (issue.sectionId) {
          targetSectionIds.add(issue.sectionId);
        }
      }
    }

    // Ekstraksi entitas yang wajib dipreservasi secara mutlak
    const preserveClaims = draft.claimUsages.map((cu) => cu.claimId);
    const preserveCitations = draft.citationMap.flatMap((c) => [...c.sourceIds, ...c.evidenceIds]);

    // Ekstraksi angka dan persentase yang ada pada seksi yang akan direvisi
    const preserveNumbers: string[] = [];
    const preserveQuotes: string[] = [];

    for (const sec of draft.sections) {
      if (targetSectionIds.has(sec.id)) {
        // Angka & persentase
        const numbers = sec.content.match(/\b\d+(\.\d+)?%|\b\d{1,3}([,.]\d{3})+\b/g) || [];
        preserveNumbers.push(...numbers);

        // Kutipan
        const quotes = sec.content.match(/["“]([^"”]{10,})["”]/g) || [];
        preserveQuotes.push(...quotes.map((q) => q.replace(/["“”]/g, '')));
      }
    }

    const preserveLimitations = brief?.limitations ? [...brief.limitations] : [];
    const preserveCounterEvidence = brief?.disputedClaims
      ? brief.disputedClaims.map((c) => c.statement)
      : [];

    return {
      articleDraftId: draft.id,
      issuesToFix,
      sectionsToRevise: Array.from(targetSectionIds),
      preserveClaims,
      preserveCitations,
      preserveQuotes,
      preserveNumbers,
      preserveLimitations,
      preserveCounterEvidence
    };
  }
}
