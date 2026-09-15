/**
 * NexaMOS AI Claim Clarity Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai ketepatan dan batas lingkup klaim faktual maupun analitis dalam naskah:
 * - Klaim harus eksplisit, terukur, dan memiliki batasan lingkup (bounded claims)
 * - Mencegah klaim berlebihan tanpa bukti (not overclaimed)
 * - Menilai presisi semantik yang dapat dipahami dan dikutip secara bertanggung jawab oleh LLM
 *
 * Contoh buruk: "AI menghancurkan seluruh industri SEO."
 * Contoh presisi: "AI Overviews dapat mengurangi rasio klik-tayang organik pada sebagian kueri informasional."
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface ClaimClarityValidationResult {
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 10
  issues: AIVisibilityIssue[];
}

export class ClaimClarityValidator {
  // Pola klaim berlebihan / generalisasi absolut tanpa batas (overclaim indicators)
  private readonly overclaimPatterns = [
    /\b(pasti hancur total|dijamin 100%|seluruhnya tanpa terkecuali|mustahil gagal|semua orang sepakat)\b/i,
    /\b(satu-satunya cara|kebohongan mutlak|tidak ada alternatif lain)\b/i
  ];

  public validate(draft: ArticleDraft): ClaimClarityValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 10; // Bobot penuh CLAIM_CLARITY = 10

    const fullContent = [
      draft.title,
      draft.thesis || '',
      ...draft.sections.map((s) => `${s.heading} ${s.content}`)
    ].join(' ');

    // 1. Deteksi Pernyataan Overclaimed / Absolutisme Ekstrem
    let overclaimCount = 0;
    for (const pattern of this.overclaimPatterns) {
      const match = fullContent.match(pattern);
      if (match) {
        overclaimCount += match.length;
      }
    }

    if (overclaimCount > 0) {
      score -= Math.min(5, overclaimCount * 2.5);
      issues.push({
        code: 'OVERCLAIMED_STATEMENT',
        checkId: 'AI_CLAIM_CLARITY',
        dimension: 'CLAIM_CLARITY',
        severity: 'WARNING',
        message: 'Ditemukan klaim generalisasi absolut yang berlebihan. Mesin AI membutuhkan klaim yang terukur dan berkehati-hatian epistemik untuk dijadikan sumber kutipan.',
        location: 'content',
        recommendation: 'Gunakan kualifikasi analitis yang presisi (misal: "cenderung", "dalam banyak kasus", "berdasarkan data tertentu").'
      });
    }

    // 2. Evaluasi Pembatasan Lingkup Tesis (Bounded Thesis)
    if (draft.thesis) {
      const thesis = draft.thesis.trim();
      const isTooBrief = thesis.split(/\s+/).length < 5;
      if (isTooBrief) {
        score -= 2;
        issues.push({
          code: 'UNBOUNDED_ANALYTICAL_CLAIM',
          checkId: 'AI_CLAIM_CLARITY',
          dimension: 'CLAIM_CLARITY',
          severity: 'INFO',
          message: 'Tesis artikel terlalu singkat atau tidak menyertakan batas lingkup kondisi argumen.',
          location: 'draft.thesis',
          recommendation: 'Definisikan batasan premis tesis secara eksplisit.'
        });
      }
    }

    const finalScore = Math.max(0, Math.min(10, score));

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_CLAIM_CLARITY',
      dimension: 'CLAIM_CLARITY',
      status: finalScore >= 9 ? 'PASS' : finalScore >= 6 ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: finalScore >= 9
        ? 'Klaim naskah presisi, memiliki batasan lingkup yang jelas, dan bebas dari sensasionalisme absolut.'
        : `Skor kejelasan klaim: ${finalScore}/10.`
    };

    return {
      checkResult,
      score: finalScore,
      issues
    };
  }
}
