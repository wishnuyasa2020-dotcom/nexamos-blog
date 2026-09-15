/**
 * NexaMOS Search Intent Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Mengevaluasi query/problem intent, reader task, article promise, dan article type.
 * Menandai SEARCH_INTENT_MISMATCH bila naskah tidak menyelesaikan tugas pembaca.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { SearchIntentProfile, IntentAlignmentStatus } from './search-intent.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface SearchIntentValidationResult {
  checkResult: SEOCheckResult;
  profile: SearchIntentProfile;
  issues: SEOIssue[];
}

export class SearchIntentValidator {
  public validate(draft: ArticleDraft, topic: Topic): SearchIntentValidationResult {
    const issues: SEOIssue[] = [];
    const primaryIntent = topic.intent?.primary || topic.title;
    const secondaryIntents = topic.intent?.secondary || [];
    const readerTask = topic.audience?.jobToBeDone || topic.problem || primaryIntent;
    const articlePromise = draft.dek || draft.editorialAngle || draft.thesis;

    // Evaluasi keselarasan semantik antara Intent Topik dan Isi Naskah
    let alignment: IntentAlignmentStatus = 'ALIGNED';
    let alignmentReason = 'Naskah secara langsung menjawab pertanyaan dan tugas pembaca.';
    let score = 100;

    // Normalisasi teks untuk evaluasi semantik
    const fullDraftText = [
      draft.title,
      draft.thesis,
      draft.editorialAngle,
      ...draft.sections.map((s) => `${s.heading} ${s.content}`)
    ].join(' ').toLowerCase();

    const topicKeywords = this.extractCoreKeywords(topic.title);
    
    // Periksa apakah konsep inti topik hadir dan dibahas secara substansial
    let matchedKeywords = 0;
    for (const kw of topicKeywords) {
      if (fullDraftText.includes(kw)) {
        matchedKeywords++;
      }
    }

    const keywordRatio = topicKeywords.length > 0 ? matchedKeywords / topicKeywords.length : 1;

    // Deteksi jika draft menyimpang total dari problem / intent topik
    if (keywordRatio < 0.3) {
      alignment = 'MISMATCHED';
      alignmentReason = `Naskah tidak menjawab pertanyaan/masalah inti topik ("${topic.title}"). Hanya ${matchedKeywords} dari ${topicKeywords.length} konsep topik utama yang dibahas.`;
      score = 30;

      issues.push({
        code: 'SEARCH_INTENT_MISMATCH',
        checkId: 'SEARCH_INTENT_ALIGNMENT',
        dimension: 'INTENT_ALIGNMENT',
        severity: 'CRITICAL',
        message: alignmentReason,
        location: 'thesis / sections',
        recommendation: 'Reorientasikan tesis dan seksi artikel agar secara langsung menyelesaikan tugas pencari informasi (reader task).'
      });
    } else if (keywordRatio < 0.6) {
      alignment = 'PARTIAL';
      alignmentReason = `Naskah menjawab sebagian maksud pencarian, namun tugas pembaca (${readerTask}) belum terjawab secara tuntas.`;
      score = 70;

      issues.push({
        code: 'SEARCH_INTENT_MISMATCH',
        checkId: 'SEARCH_INTENT_ALIGNMENT',
        dimension: 'INTENT_ALIGNMENT',
        severity: 'WARNING',
        message: alignmentReason,
        location: 'sections',
        recommendation: 'Perkuat pembahasan solusi konkret terhadap masalah utama pencari.'
      });
    }

    // Validasi pemenuhan tugas berdasarkan ArticleType
    if (draft.articleType === 'HOW_TO') {
      const hasActionable = draft.sections.some(
        (s) => s.purpose === 'PRACTICAL_APPLICATION' || s.purpose === 'FRAMEWORK'
      );
      if (!hasActionable) {
        score -= 20;
        issues.push({
          code: 'SEARCH_INTENT_MISMATCH',
          checkId: 'SEARCH_INTENT_ALIGNMENT',
          dimension: 'INTENT_ALIGNMENT',
          severity: 'WARNING',
          message: 'Tipe artikel HOW_TO wajib menyediakan panduan langkah atau kerangka kerja aplikatif.',
          location: 'sections',
          recommendation: 'Tambahkan seksi PRACTICAL_APPLICATION yang memandu langkah implementasi.'
        });
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'SEARCH_INTENT_ALIGNMENT',
      dimension: 'INTENT_ALIGNMENT',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, Math.round((score / 100) * 15))), // bobot max 15
      summary: alignmentReason
    };

    const profile: SearchIntentProfile = {
      primaryIntent,
      secondaryIntents,
      readerTask,
      problemAddressed: topic.problem || '',
      articlePromise,
      intentAlignment: alignment,
      alignmentReason
    };

    return {
      checkResult,
      profile,
      issues
    };
  }

  private extractCoreKeywords(text: string): string[] {
    const stopwords = new Set([
      'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'adalah', 'ini', 'itu',
      'dengan', 'atau', 'dalam', 'bisa', 'akan', 'masih', 'apakah', 'era', 'saat',
      'the', 'and', 'in', 'of', 'to', 'a', 'is', 'for', 'with', 'on', 'at'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => (w.length > 2 || w === 'ai') && !stopwords.has(w));

    return Array.from(new Set(words));
  }
}
