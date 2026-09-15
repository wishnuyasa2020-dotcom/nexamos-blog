/**
 * NexaMOS Topic Focus & Drift Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Mengevaluasi kejelasan topik primer, ketiadaan drift, konsistensi terminologi,
 * dan keselarasan heading serta kesimpulan.
 * DILARANG menghitung keyword density sebagai sinyal kualitas utama.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface TopicFocusValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class TopicFocusValidator {
  public validate(draft: ArticleDraft, topic: Topic): TopicFocusValidationResult {
    const issues: SEOIssue[] = [];
    let score = 100;

    // 1. Periksa Kejelasan Topik Primer
    const topicCore = topic.title.toLowerCase();
    const thesisLower = draft.thesis.toLowerCase();
    const titleLower = draft.title.toLowerCase();

    // Apakah tesis secara eksplisit memuat subjek atau konsep yang dibahas topik?
    const topicKeywords = this.getTopicKeyTerms(topic.title);
    const hasCoreSubject = topicKeywords.some((term) => thesisLower.includes(term) || titleLower.includes(term));

    if (!hasCoreSubject) {
      score -= 30;
      issues.push({
        code: 'TOPIC_FOCUS_WEAK',
        checkId: 'TOPIC_FOCUS_AND_CLARITY',
        dimension: 'TOPIC_CLARITY',
        severity: 'WARNING',
        message: `Fokus topik primer kurang tampak tegas pada judul atau tesis naskah. Topik primer: "${topic.title}".`,
        location: 'title / thesis',
        recommendation: 'Perjelas entitas subjek utama yang sedang dibahas pada judul dan rumusan tesis.'
      });
    }

    // 2. Periksa Topic Drift (Seksi yang melenceng jauh dari domain topik)
    const conclusionSection = draft.sections.find((s) => s.purpose === 'CONCLUSION');
    if (conclusionSection) {
      const conclusionLower = conclusionSection.content.toLowerCase();
      // Kesimpulan harus konsisten dengan subjek topik
      const hasTopicPresenceInConclusion = topicKeywords.some((term) => conclusionLower.includes(term));
      if (!hasTopicPresenceInConclusion && topicKeywords.length > 0) {
        score -= 20;
        issues.push({
          code: 'TOPIC_DRIFT',
          checkId: 'TOPIC_FOCUS_AND_CLARITY',
          dimension: 'TOPIC_CLARITY',
          severity: 'WARNING',
          message: 'Kesimpulan naskah kehilangan keterikatan dengan topik primer (terindikasi topic drift).',
          location: `section [${conclusionSection.id}]`,
          recommendation: 'Kaitkan kembali temuan atau rekomendasi akhir secara eksplisit ke pertanyaan topik primer.'
        });
      }
    }

    // 3. Periksa Dukungan Heading Terhadap Topik
    const headings = draft.sections.map((s) => s.heading);
    let offTopicHeadingsCount = 0;

    for (const h of headings) {
      // Jika heading sangat umum atau melenceng tanpa kaitan
      if (h.length < 5) {
        offTopicHeadingsCount++;
      }
    }

    if (offTopicHeadingsCount > 2) {
      score -= 15;
      issues.push({
        code: 'TOPIC_FOCUS_WEAK',
        checkId: 'TOPIC_FOCUS_AND_CLARITY',
        dimension: 'TOPIC_CLARITY',
        severity: 'INFO',
        message: 'Beberapa heading seksi terlalu generik dan kurang mencerminkan sudut pandang topik spesifik.',
        location: 'headings',
        recommendation: 'Buat heading lebih informatif dan relevan dengan topik pembahasan.'
      });
    }

    const checkResult: SEOCheckResult = {
      checkId: 'TOPIC_FOCUS_AND_CLARITY',
      dimension: 'TOPIC_CLARITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, Math.round((score / 100) * 15))), // bobot max 15
      summary: issues.length === 0
        ? 'Fokus topik primer kuat, konsisten, dan bebas dari topic drift.'
        : `Ditemukan ${issues.length} catatan fokus topik.`
    };

    return {
      checkResult,
      issues
    };
  }

  private getTopicKeyTerms(topicTitle: string): string[] {
    const stopwords = new Set([
      'apakah', 'masih', 'relevan', 'di', 'ke', 'dari', 'yang', 'dan', 'atau', 'pada',
      'era', 'saat', 'ini', 'itu', 'bisa', 'bagaimana', 'mengapa', 'adalah', 'untuk'
    ]);

    return topicTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !stopwords.has(w));
  }
}
