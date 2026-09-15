/**
 * NexaMOS Heading Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Memastikan heading informatif, semantik, membantu scanning, dan bebas dari label generik usang.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface HeadingEvaluationResult {
  score: number;
  issues: ReviewIssue[];
  strengths: string[];
}

export class HeadingEvaluator {
  private readonly genericHeadings = [
    'pendahuluan',
    'pembahasan',
    'hal yang perlu diketahui',
    'kesimpulan penting',
    'latar belakang',
    'uraian'
  ];

  public evaluate(draft: ArticleDraft): HeadingEvaluationResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    for (const section of draft.sections) {
      if (!section.heading) continue;

      const headingLower = section.heading.trim().toLowerCase();

      // Periksa heading generik
      if (this.genericHeadings.includes(headingLower)) {
        issues.push({
          dimension: 'STRUCTURE',
          code: 'GENERIC_HEADING',
          message: `Heading '${section.heading}' terlalu generik dan tidak memberi sinyal topik spesifik bagi pembaca.`,
          severity: 'MINOR',
          sectionId: section.id,
          snippet: section.heading,
          recommendation: 'Gunakan judul seksi yang lebih deskriptif mengenai argumen atau tema seksi tersebut.'
        });
        score -= 5;
      }
    }

    if (issues.length === 0) {
      strengths.push('Heading setiap seksi dirumuskan secara semantik, informatif, dan memudahkan scanning pembaca.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
