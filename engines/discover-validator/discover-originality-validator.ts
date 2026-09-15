/**
 * NexaMOS Google Discover Originality Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai sinyal orisinalitas (Original Research, Original Framework, First-hand Observation, dll.)
 * Menandai LOW_DISCOVER_ORIGINALITY jika artikel hanya merekap komoditas generik tanpa added value.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export interface DiscoverOriginalityValidationResult {
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 15
  issues: DiscoverIssue[];
}

export class DiscoverOriginalityValidator {
  private readonly recognizedOriginalityTypes = new Set([
    'ORIGINAL_RESEARCH',
    'ORIGINAL_DATA',
    'ORIGINAL_FRAMEWORK',
    'EXPERT_INTERPRETATION',
    'CASE_STUDY',
    'FIRST_HAND_OBSERVATION',
    'STRONG_POINT_OF_VIEW',
    'CROSS_THEORY_SYNTHESIS',
    'TIMELY_ANALYSIS',
    'PRACTICAL_DECISION_FRAMEWORK'
  ]);

  public validate(
    draft: ArticleDraft,
    topic?: Topic | null,
    brief?: ResearchBrief | null
  ): DiscoverOriginalityValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 15; // Bobot penuh dimensi Originality = 15

    const originalityTypes = topic?.informationGain?.originalityType || [];
    const commodityRisk = topic?.informationGain?.commodityRisk || 'MEDIUM';
    const hasOriginalFramework = draft.sections.some((s) => s.purpose === 'FRAMEWORK');
    const hasEmpiricalEvidence = draft.sections.some((s) => s.purpose === 'EVIDENCE');
    const hasSupportedClaims = brief?.supportedClaims && brief.supportedClaims.length > 0;

    // Evaluasi tipe orisinalitas
    const strongTypesCount = originalityTypes.filter((t) =>
      this.recognizedOriginalityTypes.has(t)
    ).length;

    if (commodityRisk === 'HIGH' && !hasOriginalFramework && !hasEmpiricalEvidence) {
      score = 3;
      issues.push({
        code: 'LOW_DISCOVER_ORIGINALITY',
        checkId: 'DISCOVER_ORIGINALITY',
        dimension: 'ORIGINALITY',
        severity: 'WARNING',
        message: 'Artikel dinilai sebagai konten komoditas generik tanpa framework orisinal atau bukti empiris (Discover 2026 menolak konten kurasi pasif tanpa nilai tambah).',
        location: 'sections',
        recommendation: 'Sertakan kerangka kerja konseptual mandiri atau data riset unik NexaMOS.'
      });
    } else if (strongTypesCount === 0 && !hasOriginalFramework) {
      score = 7;
      issues.push({
        code: 'LOW_DISCOVER_ORIGINALITY',
        checkId: 'DISCOVER_ORIGINALITY',
        dimension: 'ORIGINALITY',
        severity: 'WARNING',
        message: 'Artikel belum memiliki sinyal orisinalitas eksplisit (Original Research / Framework / Case Study).',
        location: 'topic.informationGain.originalityType',
        recommendation: 'Definisikan tipe orisinalitas konten dan integrasikan sintesis teoritis yang khas.'
      });
    } else {
      // Bonus jika memiliki framework orisinal dan bukti/riset primer
      if (hasOriginalFramework && (hasSupportedClaims || hasEmpiricalEvidence || strongTypesCount >= 2)) {
        score = 15;
      } else if (hasOriginalFramework || strongTypesCount >= 2) {
        score = 13;
      } else {
        score = 10;
      }
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_ORIGINALITY',
      dimension: 'ORIGINALITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, score)),
      summary: issues.length === 0
        ? 'Orisinalitas konten tinggi, didukung oleh data riset dan kerangka kerja konseptual orisinal.'
        : `Ditemukan catatan orisinalitas: ${issues[0].message}`
    };

    return {
      checkResult,
      score,
      issues
    };
  }
}
