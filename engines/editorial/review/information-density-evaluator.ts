/**
 * NexaMOS Information Density Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Mengevaluasi rasio konseptual antara pengetahuan baru terhadap panjang prosa.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface InformationDensityResult {
  score: number;
  issues: ReviewIssue[];
  strengths: string[];
}

export class InformationDensityEvaluator {
  public evaluate(draft: ArticleDraft): InformationDensityResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    for (const section of draft.sections) {
      const words = section.content.trim().split(/\s+/);
      const wordCount = words.length;

      // Filler transitions detection
      const fillerRegex =
        /\b(seperti yang telah kita ketahui bersama|perlu dipahami secara mendalam bahwa|tidak dapat dipungkiri lagi bahwa pada hakikatnya|sebagaimana lazimnya dalam dunia bisnis modern)\b/gi;
      const fillerMatches = section.content.match(fillerRegex) || [];

      // Jika seksi memuat banyak filler dan tanpa klaim/bukti konkret
      const hasClaim = section.claimUsageIds && section.claimUsageIds.length > 0;
      if (wordCount >= 60 && fillerMatches.length >= 2 && !hasClaim) {
        issues.push({
          dimension: 'INFORMATION_DENSITY',
          code: 'LOW_INFORMATION_DENSITY',
          message: `Seksi '${section.heading || section.id}' memiliki ${wordCount} kata namun memuat banyak frasa pengisi (filler) tanpa klaim atau bukti konkret.`,
          severity: 'MAJOR',
          sectionId: section.id,
          recommendation: 'Padatkan kalimat, pangkas basa-basi transisi, dan perbanyak data atau kerangka aksi konkret.'
        });
        score -= 15;
      }
    }

    if (issues.length === 0) {
      strengths.push('Kepadatan informasi tinggi: prosa ringkas, padat gagasan, dan bebas dari basa-basi filler.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
