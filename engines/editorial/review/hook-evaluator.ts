/**
 * NexaMOS Hook Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Menilai kualitas pembuka artikel (PROBLEM, TENSION, CONTRADICTION, DATA) dan menolak clickbait murah.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface HookEvaluationResult {
  score: number;
  hookType?: string;
  issues: ReviewIssue[];
  strengths: string[];
}

export class HookEvaluator {
  public evaluate(draft: ArticleDraft): HookEvaluationResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    const hookSection = draft.sections.find((s) => s.purpose === 'HOOK') || draft.sections[0];
    if (!hookSection) {
      return {
        score: 50,
        issues: [
          {
            dimension: 'STRUCTURE',
            code: 'MISSING_HOOK',
            message: 'Artikel tidak memiliki seksi pembuka (HOOK) yang jelas.',
            severity: 'MAJOR'
          }
        ],
        strengths: []
      };
    }

    const text = hookSection.content.toLowerCase();

    // 1. Deteksi Clickbait Murah / Fake Urgency
    const clickbaitRegex =
      /\b(anda tidak akan percaya|rahasia mengejutkan yang disembunyikan|baca ini sebelum terlambat|ini akan menghancurkan karir anda|satu-satunya hal yang perlu anda ketahui)\b/i;

    if (clickbaitRegex.test(text)) {
      issues.push({
        dimension: 'TONE_CONSISTENCY',
        code: 'CHEAP_CLICKBAIT_HOOK',
        message: 'Pembuka artikel memuat frasa clickbait sensasional atau urgensi palsu yang melanggar standar NexaMOS.',
        severity: 'CRITICAL',
        sectionId: hookSection.id,
        snippet: hookSection.content.slice(0, 100) + '...',
        recommendation: 'Ganti pembuka dengan ketegangan intelektual nyata, masalah pasar, atau data objektif.'
      });
      score -= 40;
    }

    // 2. Identifikasi Hook Pattern Sah
    let detectedHookType = 'OBSERVATION';
    if (text.includes('namun') || text.includes('kontradiksi') || text.includes('sebaliknya')) {
      detectedHookType = 'CONTRADICTION';
      strengths.push('Hook mengangkat kontradiksi tajam yang memantik rasa ingin tahu intelektual pembaca.');
    } else if (text.includes('masalah') || text.includes('tantangan') || text.includes('kegagalan')) {
      detectedHookType = 'PROBLEM';
      strengths.push('Hook membuka dengan masalah nyata yang dihadapi oleh segmen target.');
    } else if (/\b\d+%\b/.test(text) || text.includes('data')) {
      detectedHookType = 'DATA';
      strengths.push('Hook membuka dengan fakta numerik yang kuat dan relevan.');
    } else {
      strengths.push('Hook menyajikan observasi pasar yang relevan dengan pokok bahasan.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      hookType: detectedHookType,
      issues,
      strengths
    };
  }
}
