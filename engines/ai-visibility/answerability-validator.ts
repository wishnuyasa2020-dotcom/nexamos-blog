/**
 * NexaMOS AI Answerability Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai apakah artikel menyajikan jawaban substantif dan terarah atas problem audiens:
 * - Kejelasan masalah/pertanyaan primer
 * - Penjelasan dan argumen solusi eksplisit
 * - Kesimpulan atau implikasi praktis yang tegas
 *
 * DOKTRIN KERAS:
 * Dilarang mengubah naskah menjadi FAQ spam!
 * Ketiadaan format FAQ TIDAK BOLEH dihukum! Naskah esai mendalam yang menjawab pertanyaan secara terstruktur adalah format utama NexaMOS.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export type AnswerabilityLevel = 'STRONG' | 'ADEQUATE' | 'WEAK';

export interface AnswerabilityValidationResult {
  answerability: AnswerabilityLevel;
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 12
  issues: AIVisibilityIssue[];
}

export class AnswerabilityValidator {
  public validate(
    draft: ArticleDraft,
    topic?: Topic | null
  ): AnswerabilityValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 12; // Bobot penuh ANSWERABILITY = 12

    const hasProblemOrQuestion =
      Boolean(topic?.problem && topic.problem.trim().length > 10) ||
      Boolean(draft.thesis && draft.thesis.trim().length > 15);

    const purposes = new Set(draft.sections.map((s) => s.purpose));
    const hasImplicationOrConclusion =
      purposes.has('IMPLICATION') ||
      purposes.has('PRACTICAL_APPLICATION') ||
      purposes.has('TAKEAWAY') ||
      draft.sections.some((s) => /kesimpulan|implikasi|rekomendasi|langkah|solusi|strategi/i.test(s.heading));

    const hasDetailedExplanation =
      purposes.has('EVIDENCE') ||
      purposes.has('FRAMEWORK') ||
      purposes.has('ANALYSIS') ||
      draft.sections.length >= 3;

    // 1. Evaluasi Keberadaan Pertanyaan/Masalah Pokok
    if (!hasProblemOrQuestion) {
      score -= 3;
      issues.push({
        code: 'VAGUE_ANSWERABILITY',
        checkId: 'AI_ANSWERABILITY',
        dimension: 'ANSWERABILITY',
        severity: 'WARNING',
        message: 'Tesis naskah atau rumusan masalah audiens kurang tajam, sehingga inti jawaban sulit diekstraksi secara presisi oleh LLM.',
        location: 'draft.thesis',
        recommendation: 'Perjelas tesis atau problem statement utama artikel.'
      });
    }

    // 2. Evaluasi Keberadaan Kesimpulan / Implikasi Praktis
    if (!hasImplicationOrConclusion) {
      score -= 4;
      issues.push({
        code: 'MISSING_EXPLICIT_CONCLUSION',
        checkId: 'AI_ANSWERABILITY',
        dimension: 'ANSWERABILITY',
        severity: 'WARNING',
        message: 'Artikel belum memiliki seksi kesimpulan, implikasi, atau aplikasi praktis yang tegas.',
        location: 'draft.sections',
        recommendation: 'Sediakan seksi penutup yang merangkum implikasi strategis atau kesimpulan inti.'
      });
    }

    // 3. Evaluasi Kelengkapan Argumen
    if (!hasDetailedExplanation) {
      score -= 3;
    }

    const finalScore = Math.max(0, Math.min(12, score));
    let answerability: AnswerabilityLevel = 'STRONG';
    if (finalScore < 7) {
      answerability = 'WEAK';
    } else if (finalScore < 10) {
      answerability = 'ADEQUATE';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_ANSWERABILITY',
      dimension: 'ANSWERABILITY',
      status: answerability === 'STRONG' ? 'PASS' : answerability === 'ADEQUATE' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: answerability === 'STRONG'
        ? 'Naskah memberikan jawaban eksplisit, mendalam, dan memiliki kesimpulan solutif yang jelas bagi sistem AI.'
        : `Tingkat kelengkapan jawaban: ${answerability}.`
    };

    return {
      answerability,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
