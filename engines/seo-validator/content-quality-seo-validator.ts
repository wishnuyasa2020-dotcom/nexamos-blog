/**
 * NexaMOS Content Quality SEO Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Mengonsumsi metrik editorial Phase 3A & 3B tanpa menghitung ulang kualitas penulisan.
 * Menandai LOW_SEARCH_DIFFERENTIATION jika artikel berisiko komoditas tinggi dan minim information gain.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { EditorialReview } from '../editorial/review/editorial-review.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface ContentQualitySEOValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class ContentQualitySEOValidator {
  public validate(
    draft: ArticleDraft,
    topic?: Topic | null,
    editorialReview?: EditorialReview | null
  ): ContentQualitySEOValidationResult {
    const issues: SEOIssue[] = [];
    let score = 100;

    // 1. Baca Editorial Writing Score (Jika tersedia)
    if (editorialReview) {
      if (editorialReview.overallWritingScore < 70) {
        score -= 40;
        issues.push({
          code: 'LOW_SEARCH_DIFFERENTIATION',
          checkId: 'CONTENT_DIFFERENTIATION',
          dimension: 'CONTENT_DIFFERENTIATION',
          severity: 'WARNING',
          message: `Skor penulisan editorial rendah (${editorialReview.overallWritingScore}/100). Google mengutamakan konten yang jernih, bernas, dan berbobot.`,
          location: 'editorialReview',
          recommendation: 'Selesaikan revisi kualitas editorial sebelum mengirimkan artikel ke indeks pencarian.'
        });
      }
    }

    // 2. Evaluasi Information Gain & Commodity Risk
    const commodityRisk = topic?.informationGain?.commodityRisk || 'MEDIUM';
    const hasOriginalFramework = draft.sections.some((s) => s.purpose === 'FRAMEWORK');
    const hasEvidence = draft.sections.some((s) => s.purpose === 'EVIDENCE');

    // Jika topik dinilai berisiko komoditas tinggi dan tidak ada kerangka kerja orisinal atau bukti empiris
    if (commodityRisk === 'HIGH' && !hasOriginalFramework && !hasEvidence) {
      score -= 50;
      issues.push({
        code: 'LOW_SEARCH_DIFFERENTIATION',
        checkId: 'CONTENT_DIFFERENTIATION',
        dimension: 'CONTENT_DIFFERENTIATION',
        severity: 'CRITICAL',
        message: 'Artikel berisiko komoditas tinggi (commodity content) tanpa adanya bukti empiris atau framework orisinal NexaMOS. Berisiko diabaikan oleh Google AI Overviews dan Search.',
        location: 'sections',
        recommendation: 'Sertakan kerangka kerja konseptual atau data riset unik agar artikel memiliki search information gain yang nyata.'
      });
    } else if (commodityRisk === 'HIGH' && !hasOriginalFramework) {
      score -= 20;
      issues.push({
        code: 'LOW_SEARCH_DIFFERENTIATION',
        checkId: 'CONTENT_DIFFERENTIATION',
        dimension: 'CONTENT_DIFFERENTIATION',
        severity: 'WARNING',
        message: 'Artikel menyajikan data namun belum memuat kerangka kerja analitis orisinal untuk memperkuat diferensiasi pencarian.',
        location: 'sections',
        recommendation: 'Sertakan seksi FRAMEWORK orisinal NexaMOS.'
      });
    }

    const checkResult: SEOCheckResult = {
      checkId: 'CONTENT_DIFFERENTIATION',
      dimension: 'CONTENT_DIFFERENTIATION',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: issues.length === 0
        ? 'Diferensiasi pencarian tinggi dengan information gain yang kuat dan bebas dari risiko komoditas.'
        : `Ditemukan ${issues.length} catatan diferensiasi konten.`
    };

    return {
      checkResult,
      issues
    };
  }
}
