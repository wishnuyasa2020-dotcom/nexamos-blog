/**
 * NexaMOS Content Learning Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principle:
 * - LEARNING ≠ UNIVERSAL RULE.
 * - Pembelajaran operasional harus selalu memiliki batasan cakupan (scope) dan tidak boleh digeneralisasi menjadi aturan mutlak untuk seluruh artikel.
 */

import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { SignalConfidence } from './performance-signal.ts';

export type ContentLearningType =
  | 'TOPIC_LEARNING'
  | 'FORMAT_LEARNING'
  | 'TITLE_LEARNING'
  | 'DISTRIBUTION_LEARNING'
  | 'ENGAGEMENT_LEARNING'
  | 'AUTHORITATIVE_SOURCE_LEARNING'
  | 'VISUAL_LEARNING'
  | 'FRESHNESS_LEARNING'
  | 'AI_VISIBILITY_LEARNING';

export const CONTENT_LEARNING_TYPES: readonly ContentLearningType[] = [
  'TOPIC_LEARNING',
  'FORMAT_LEARNING',
  'TITLE_LEARNING',
  'DISTRIBUTION_LEARNING',
  'ENGAGEMENT_LEARNING',
  'AUTHORITATIVE_SOURCE_LEARNING',
  'VISUAL_LEARNING',
  'FRESHNESS_LEARNING',
  'AI_VISIBILITY_LEARNING'
] as const;

export interface ContentLearningApplicableScope {
  territories?: Territory[];
  articleTypes?: ArticleType[];
  audienceSegment?: string;
  contextualScope: string; // Misal: 'Artikel ANALYSIS bertema AI dengan pembaca Enterprise'
  isUniversalRule: boolean; // HARUS false untuk validitas doktrin
}

export interface ContentLearning {
  id: string;
  articleId: string;
  topicId: string;
  learningType: ContentLearningType;
  statement: string;
  supportingSignals: string[]; // signal IDs
  supportingDiagnoses: string[]; // diagnosis IDs
  confidence: SignalConfidence;
  applicableTo: ContentLearningApplicableScope;
  createdAt: string; // ISO 8601
}

/**
 * Validasi doktrin: Menolak learning yang mengklaim sebagai aturan universal tanpa batasan konteks
 */
export function validateContentLearningScope(learning: ContentLearning): {
  isValid: boolean;
  message?: string;
} {
  if (learning.applicableTo.isUniversalRule) {
    return {
      isValid: false,
      message: 'Learning ditolak: Doktrin NexaMOS melarang penetapan pembelajaran operasional sebagai aturan universal absolut (isUniversalRule must be false).'
    };
  }

  const sweepingPhrases = [
    'semua artikel harus',
    'seluruh konten wajib',
    'all articles must',
    'every post should always'
  ];

  const lower = learning.statement.toLowerCase();
  for (const phrase of sweepingPhrases) {
    if (lower.includes(phrase)) {
      return {
        isValid: false,
        message: `Learning ditolak karena memuat generalisasi mutlak: "${phrase}". Pembelajaran harus terikat konteks teritori, tipe artikel, atau audiens.`
      };
    }
  }

  return { isValid: true };
}
