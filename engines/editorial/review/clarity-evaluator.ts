/**
 * NexaMOS Clarity Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Mengevaluasi kejernihan kalimat, ambiguitas referensi, dan kompleksitas yang tidak perlu.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface ClarityEvaluationResult {
  score: number; // 0 - 100
  issues: ReviewIssue[];
  strengths: string[];
}

export class ClarityEvaluator {
  /**
   * Mengevaluasi draf artikel untuk kejernihan bahasa dan struktur kalimat
   */
  public evaluate(draft: ArticleDraft): ClarityEvaluationResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    for (const section of draft.sections) {
      const text = section.content;
      const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        const wordCount = trimmed.split(/\s+/).length;

        // 1. Deteksi kalimat yang sangat berbelit (>= 38 kata dengan klausa bertumpuk ganda)
        const commaCount = (trimmed.match(/,/g) || []).length;
        if (wordCount >= 38 && commaCount >= 3) {
          issues.push({
            dimension: 'CLARITY',
            code: 'RUN_ON_SENTENCE',
            message: `Kalimat memiliki ${wordCount} kata dengan ${commaCount} klausa terpisah; berisiko melelahkan pembaca.`,
            severity: 'MINOR',
            sectionId: section.id,
            snippet: trimmed.slice(0, 100) + '...',
            recommendation: 'Pecah menjadi dua kalimat atau lebih agar ide pokok lebih mudah dipahami.'
          });
          score -= 5;
        }

        // 2. Deteksi referent yang ambigu di awal kalimat (e.g. "Hal ini...", "Hal tersebut...", "Ini...")
        if (/^(Hal ini|Hal tersebut|Ini|Itu)\s+(menyebabkan|membuktikan|menunjukkan)/i.test(trimmed)) {
          // Hanya beri saran jika kalimat sebelumnya cukup panjang/kompleks
          if (wordCount > 25) {
            issues.push({
              dimension: 'CLARITY',
              code: 'AMBIGUOUS_REFERENT',
              message: `Penggunaan pronomina penunjuk di awal kalimat berpotensi ambigu mengenai entitas mana yang dimaksud.`,
              severity: 'INFO',
              sectionId: section.id,
              snippet: trimmed.slice(0, 80) + '...',
              recommendation: 'Sebutkan entitas atau subjek spesifik daripada hanya menggunakan "Hal ini".'
            });
          }
        }

        // 3. Deteksi frasa pasif bertumpuk yang mengaburkan pelaku tindakan
        if (/\b(dapat dipertimbangkan untuk dilakukan proses pengkajian)\b/i.test(trimmed)) {
          issues.push({
            dimension: 'CLARITY',
            code: 'EXCESSIVE_PASSIVE_ABSTRACTION',
            message: 'Kalimat menggunakan bentuk pasif bertumpuk yang berbelit.',
            severity: 'MINOR',
            sectionId: section.id,
            snippet: trimmed,
            recommendation: 'Gunakan kalimat aktif dengan subjek yang jelas.'
          });
          score -= 5;
        }
      }
    }

    if (issues.length === 0) {
      strengths.push('Kalimat tersusun secara lugas, jernih, dan tidak memiliki ambiguitas referensi yang mengganggu.');
    } else if (issues.length <= 2) {
      strengths.push('Tingkat kejernihan secara umum baik dengan struktur kalimat yang mudah diikuti.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
