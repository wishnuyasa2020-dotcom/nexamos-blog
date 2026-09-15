/**
 * NexaMOS AI Information Gain Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai bobot pengetahuan non-komoditas (Non-Commodity Knowledge) dalam naskah:
 * - Keberadaan framework konseptual mandiri (NexaMOS proprietary framework)
 * - Riset orisinal / data primer / observasi tangan pertama
 * - Sintesis lintas-teori dan interpretasi pakar
 *
 * DOKTRIN UTAMA:
 * Strong AI visibility readiness harus terutama datang dari NON-COMMODITY KNOWLEDGE,
 * bukan trik format atau manipulasi kata kunci.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface InformationGainValidationResult {
  informationGain: 'HIGH' | 'MEDIUM' | 'LOW';
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 16
  issues: AIVisibilityIssue[];
}

export class InformationGainValidator {
  public validate(
    draft: ArticleDraft,
    topic?: Topic | null
  ): InformationGainValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 16; // Bobot penuh INFORMATION_GAIN = 16

    const originalityTypes = topic?.informationGain?.originalityType || [];
    const commodityRisk = topic?.informationGain?.commodityRisk || 'MEDIUM';
    const hasOriginalFramework = draft.sections.some((s) => s.purpose === 'FRAMEWORK');
    const hasEmpiricalEvidence = draft.sections.some((s) => s.purpose === 'EVIDENCE');

    // 1. Evaluasi Risiko Komoditas
    if (commodityRisk === 'HIGH' && !hasOriginalFramework && !hasEmpiricalEvidence) {
      score = 4;
      issues.push({
        code: 'COMMODITY_CONTENT_RISK',
        checkId: 'AI_INFORMATION_GAIN',
        dimension: 'INFORMATION_GAIN',
        severity: 'WARNING',
        message: 'Naskah berisiko tinggi sebagai konten komoditas generik tanpa framework orisinal atau bukti primer. Sistem AI mendevaluasi konten yang hanya mengulang ringkasan umum web.',
        location: 'sections',
        recommendation: 'Sertakan framework konseptual mandiri atau data riset unik NexaMOS.'
      });
    } else if (originalityTypes.length === 0 && !hasOriginalFramework) {
      score = 8;
      issues.push({
        code: 'LOW_INFORMATION_GAIN',
        checkId: 'AI_INFORMATION_GAIN',
        dimension: 'INFORMATION_GAIN',
        severity: 'WARNING',
        message: 'Artikel belum memiliki tipe orisinalitas eksplisit (Original Framework / Research / Case Study).',
        location: 'topic.informationGain.originalityType',
        recommendation: 'Perkuat nilai tambah informasi (information gain) dengan sintesis analitis yang khas.'
      });
    } else {
      // Nilai tinggi jika ada framework mandiri dan bukti riset
      if (hasOriginalFramework && (hasEmpiricalEvidence || originalityTypes.length >= 2)) {
        score = 16;
      } else {
        score = 13;
      }
    }

    const finalScore = Math.max(0, Math.min(16, score));
    let gainLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (finalScore < 8) {
      gainLevel = 'LOW';
    } else if (finalScore < 13) {
      gainLevel = 'MEDIUM';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_INFORMATION_GAIN',
      dimension: 'INFORMATION_GAIN',
      status: gainLevel === 'HIGH' ? 'PASS' : gainLevel === 'MEDIUM' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: gainLevel === 'HIGH'
        ? 'Naskah menyajikan nilai tambah informasi yang tinggi (non-commodity knowledge) dengan sintesis unik.'
        : `Tingkat information gain: ${gainLevel}.`
    };

    return {
      informationGain: gainLevel,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
