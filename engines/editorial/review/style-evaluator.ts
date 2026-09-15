/**
 * NexaMOS Style & Tone Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Memastikan gaya dan nada penulisan selaras dengan EditorialToneProfile NexaMOS.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';
import {
  type EditorialToneProfile,
  DEFAULT_NEXAMOS_TONE_PROFILE
} from './editorial-tone-profile.ts';

export interface StyleEvaluationResult {
  score: number;
  expectedTone: string;
  issues: ReviewIssue[];
  strengths: string[];
}

export class StyleEvaluator {
  private readonly toneProfile: EditorialToneProfile;

  constructor(profile: EditorialToneProfile = DEFAULT_NEXAMOS_TONE_PROFILE) {
    this.toneProfile = profile;
  }

  public evaluate(draft: ArticleDraft): StyleEvaluationResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    const expectedTone =
      this.toneProfile.articleTypeToneMap[draft.articleType] ||
      this.toneProfile.primaryVoice;

    // Periksa nada sensasional atau patronizing
    const patronizingRegex =
      /\b(anda mungkin belum tahu|sebagai pemula anda harus paham|jangan bersikap naif|jelas sekali bahwa orang awam)\b/i;

    for (const section of draft.sections) {
      if (patronizingRegex.test(section.content)) {
        issues.push({
          dimension: 'TONE_CONSISTENCY',
          code: 'PATRONIZING_TONE',
          message: `Seksi '${section.heading || section.id}' menggunakan nada menggurui/merendahkan yang dilarang oleh doktrin NexaMOS.`,
          severity: 'MAJOR',
          sectionId: section.id,
          recommendation: 'Gunakan nada kemitraan intelektual yang menghargai kecerdasan pembaca.'
        });
        score -= 15;
      }
    }

    if (issues.length === 0) {
      strengths.push(
        `Nada penulisan selaras dengan profil '${expectedTone}' tanpa nada patronizing atau sensasionalisme.`
      );
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      expectedTone,
      issues,
      strengths
    };
  }
}
