/**
 * NexaMOS Title Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Mengevaluasi kejernihan, relevansi topik, janji pembaca, risiko panjang karakter,
 * risiko duplikasi, dan risiko umpan klik (clickbait).
 * DILARANG memaksa exact-match keyword. Judul editorial yang bernas dan jelas diterima.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { SEOCheckResult, SEOIssue, SEOCheckStatus } from './seo-validation.ts';

export interface TitleValidationResult {
  checkResult: SEOCheckResult;
  status: SEOCheckStatus; // PASS | WARNING | FAIL
  issues: SEOIssue[];
}

export class TitleValidator {
  private readonly clickbaitPatterns = [
    /\b(bikin syok|bikin kaget|wajib tahu sebelum terlambat|rahasia gila|nomor \d+ bikin geleng-geleng)\b/i,
    /\b(kamu tidak akan percaya|jangan baca ini jika|terkuak sudah)\b/i,
    /!{2,}/
  ];

  public validate(
    draft: ArticleDraft,
    topic?: Topic | null,
    existingTitles: string[] = []
  ): TitleValidationResult {
    const issues: SEOIssue[] = [];
    const title = draft.title?.trim() || '';
    let score = 100;

    // 1. Validasi Keberadaan & Panjang Karakter (Length Risk)
    if (!title) {
      issues.push({
        code: 'TITLE_MISLEADING',
        checkId: 'TITLE_QUALITY',
        dimension: 'TITLE_QUALITY',
        severity: 'CRITICAL',
        message: 'Judul artikel kosong.',
        location: 'title',
        recommendation: 'Tetapkan judul artikel yang jelas dan berwibawa.'
      });
      score = 0;
    } else {
      if (title.length < 20) {
        score -= 25;
        issues.push({
          code: 'TITLE_LENGTH_RISK',
          checkId: 'TITLE_QUALITY',
          dimension: 'TITLE_QUALITY',
          severity: 'WARNING',
          message: `Judul terlalu pendek (${title.length} karakter). Judul berisiko kurang deskriptif di hasil pencarian.`,
          location: 'title',
          recommendation: 'Perluas judul (disarankan 40–65 karakter) agar mencerminkan topik dan nilai artikel secara utuh.'
        });
      } else if (title.length > 70) {
        score -= 15;
        issues.push({
          code: 'TITLE_LENGTH_RISK',
          checkId: 'TITLE_QUALITY',
          dimension: 'TITLE_QUALITY',
          severity: 'INFO',
          message: `Judul agak panjang (${title.length} karakter) dan mungkin terpotong di SERP desktop/mobile (> 60-70 karakter).`,
          location: 'title',
          recommendation: 'Pertimbangkan meringkas judul tanpa mengurangi kejelasan topik dan sudut pandang.'
        });
      }
    }

    // 2. Clickbait Risk
    for (const pattern of this.clickbaitPatterns) {
      if (pattern.test(title)) {
        score -= 40;
        issues.push({
          code: 'TITLE_CLICKBAIT_RISK',
          checkId: 'TITLE_QUALITY',
          dimension: 'TITLE_QUALITY',
          severity: 'CRITICAL',
          message: 'Judul mengandung formula sensasionalis/clickbait murahan yang melanggar standar NexaMOS.',
          location: 'title',
          recommendation: 'Ganti judul dengan rumusan masalah atau proposisi intelektual yang berbobot.'
        });
        break;
      }
    }

    // 3. Topic Relevance & Misleading Check (Jika topic disediakan)
    if (topic && title) {
      const topicTerms = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const titleLower = title.toLowerCase();
      const topicRelevance = topicTerms.filter((term) => titleLower.includes(term)).length;

      // Jika judul benar-benar tidak berkaitan dengan topik yang ditentukan
      if (topicTerms.length > 0 && topicRelevance === 0 && !titleLower.includes(topic.slug.replace(/-/g, ' '))) {
        score -= 35;
        issues.push({
          code: 'TITLE_MISLEADING',
          checkId: 'TITLE_QUALITY',
          dimension: 'TITLE_QUALITY',
          severity: 'WARNING',
          message: `Judul ("${title}") tampak tidak relevan dengan topik yang direncanakan ("${topic.title}").`,
          location: 'title',
          recommendation: 'Pastikan judul mencerminkan subjek bahasan topik riset.'
        });
      }
    }

    // 4. Duplication Risk
    if (title && existingTitles.length > 0) {
      const normalizedTitle = title.toLowerCase().trim();
      const isDuplicate = existingTitles.some(
        (t) => t.toLowerCase().trim() === normalizedTitle
      );
      if (isDuplicate) {
        score -= 50;
        issues.push({
          code: 'TITLE_DUPLICATION_RISK',
          checkId: 'TITLE_QUALITY',
          dimension: 'TITLE_QUALITY',
          severity: 'CRITICAL',
          message: `Judul artikel ini identik dengan artikel lain yang sudah terdaftar.`,
          location: 'title',
          recommendation: 'Gunakan judul yang unik untuk membedakan artikel ini dalam portofolio blog.'
        });
      }
    }

    const status: SEOCheckStatus = issues.some((i) => i.severity === 'CRITICAL')
      ? 'FAIL'
      : issues.some((i) => i.severity === 'WARNING')
      ? 'WARNING'
      : 'PASS';

    const checkResult: SEOCheckResult = {
      checkId: 'TITLE_QUALITY',
      dimension: 'TITLE_QUALITY',
      status,
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: status === 'PASS'
        ? 'Judul artikel jernih, relevan, proporsional, dan bebas dari clickbait.'
        : `Ditemukan catatan kualitas judul (${status}).`
    };

    return {
      checkResult,
      status,
      issues
    };
  }
}
