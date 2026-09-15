/**
 * NexaMOS Jargon Detector
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Mendeteksi buzzword stacking, jargon tanpa konteks, dan istilah konsultan yang tidak perlu.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface JargonDetectionResult {
  score: number;
  issues: ReviewIssue[];
  strengths: string[];
}

export class JargonDetector {
  // Buzzwords konsultan yang dilarang/dihindari jika bertumpuk tanpa konteks
  private readonly buzzwords = [
    'synergize',
    'synergy',
    'leverage',
    'paradigm shift',
    'holistic approach',
    'game changer',
    'boil the ocean',
    'deep dive',
    'move the needle'
  ];

  public evaluate(draft: ArticleDraft): JargonDetectionResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    for (const section of draft.sections) {
      const contentLower = section.content.toLowerCase();

      for (const bw of this.buzzwords) {
        if (contentLower.includes(bw)) {
          issues.push({
            dimension: 'CLARITY',
            code: 'CONSULTANT_BUZZWORD',
            message: `Ditemukan istilah klise konsultan '${bw}' pada seksi '${section.heading || section.id}'.`,
            severity: 'MINOR',
            sectionId: section.id,
            snippet: bw,
            recommendation: `Ganti '${bw}' dengan penjelasan konkret mengenai mekanisme atau dampak tindakan sebenarnya.`
          });
          score -= 5;
        }
      }

      // Deteksi akronim tanpa penjelasan jika tidak lazim (misal 'CPL-TOFU-MoM')
      const obscureAcronyms = section.content.match(/\b[A-Z]{4,}(-[A-Z]{3,})+\b/g) || [];
      for (const acr of obscureAcronyms) {
        issues.push({
          dimension: 'CLARITY',
          code: 'UNDEFINED_OBSCURE_ACRONYM',
          message: `Akronim rumit '${acr}' diperkenalkan tanpa pengantar atau kepanjangan istilah.`,
          severity: 'MINOR',
          sectionId: section.id,
          snippet: acr,
          recommendation: `Tuliskan kepanjangan dari '${acr}' pada penyebutan pertama.`
        });
        score -= 5;
      }
    }

    if (issues.length === 0) {
      strengths.push('Istilah teknis yang digunakan presisi dan bebas dari tumpukan buzzword konsultan.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
