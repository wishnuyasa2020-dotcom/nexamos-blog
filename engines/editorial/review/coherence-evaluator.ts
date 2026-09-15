/**
 * NexaMOS Coherence Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Memeriksa kesinambungan logika dari tesis hingga kesimpulan.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface CoherenceEvaluationResult {
  score: number;
  issues: ReviewIssue[];
  strengths: string[];
}

export class CoherenceEvaluator {
  public evaluate(draft: ArticleDraft): CoherenceEvaluationResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    const purposes = draft.sections.map((s) => s.purpose);

    // 1. Periksa alur bukti ke interpretasi / analisis
    const evidenceIndices: number[] = [];
    purposes.forEach((p, idx) => {
      if (p === 'EVIDENCE') evidenceIndices.push(idx);
    });

    for (const evIdx of evidenceIndices) {
      // Periksa apakah seksi setelahnya atau seksi itu sendiri memuat analisis/framework/interpretasi
      const hasFollowingInterpretation =
        evIdx + 1 < purposes.length &&
        ['ANALYSIS', 'FRAMEWORK', 'IMPLICATION', 'COUNTERPOINT', 'CONCLUSION'].includes(
          purposes[evIdx + 1]
        );

      const currentSectionContent = draft.sections[evIdx].content.toLowerCase();
      const hasInternalAnalysis =
        currentSectionContent.includes('menunjukkan') ||
        currentSectionContent.includes('implikasi') ||
        currentSectionContent.includes('artinya') ||
        currentSectionContent.includes('makna');

      if (!hasFollowingInterpretation && !hasInternalAnalysis) {
        issues.push({
          dimension: 'COHERENCE',
          code: 'EVIDENCE_WITHOUT_INTERPRETATION',
          message: `Seksi EVIDENCE pada urutan ${evIdx + 1} tidak disertai atau diikuti oleh interpretasi makna data yang memadai.`,
          severity: 'MAJOR',
          sectionId: draft.sections[evIdx].id,
          recommendation: 'Jelaskan arti strategis data tersebut bagi pembaca daripada membiarkan angka berdiri sendiri.'
        });
        score -= 15;
      }
    }

    // 2. Periksa apakah kesimpulan memuat klaim baru yang tidak pernah dibahas sebelumnya
    const conclusionSection = draft.sections.find((s) => s.purpose === 'CONCLUSION');
    if (conclusionSection) {
      const priorText = draft.sections
        .filter((s) => s.purpose !== 'CONCLUSION')
        .map((s) => s.content)
        .join(' ')
        .toLowerCase();

      const conclusionText = conclusionSection.content.toLowerCase();

      // Periksa apakah ada istilah teknologi/strategi asing yang tiba-tiba muncul hanya di kesimpulan
      const candidateNewTopics = ['blockchain', 'quantum computing', 'metaverse', 'tiktok shop', 'affiliate network'];
      for (const topicWord of candidateNewTopics) {
        if (conclusionText.includes(topicWord) && !priorText.includes(topicWord)) {
          issues.push({
            dimension: 'COHERENCE',
            code: 'UNPREPARED_CONCLUSION_TOPIC',
            message: `Kesimpulan memperkenalkan konsep baru ('${topicWord}') yang tidak pernah dibangun dalam argumen sebelumnya.`,
            severity: 'MAJOR',
            sectionId: conclusionSection.id,
            recommendation: 'Hapus konsep tersebut atau bangun landasannya terlebih dahulu di seksi analisis.'
          });
          score -= 15;
        }
      }
    }

    if (issues.length === 0) {
      strengths.push('Alur narasi mengalir teratur dari pembukaan masalah, pembuktian data, hingga implikasi kesimpulan.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
