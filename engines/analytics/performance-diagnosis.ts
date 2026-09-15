/**
 * NexaMOS Performance Diagnosis Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - CORRELATION ≠ CAUSATION.
 * - UNSUPPORTED_CAUSAL_ATTRIBUTION: Klaim kausal tanpa bukti terkontrol dilarang keras.
 * - Multi-metric diagnosis: Mengombinasikan visibilitas + klik + engagement.
 * - Provider anomalies menurunkan confidence secara otomatis.
 */

import type { PerformanceSignal, SignalConfidence } from './performance-signal.ts';
import type { AnalyticsDataAnomaly } from './analytics-source.ts';

export type PerformanceDiagnosisType =
  | 'SEARCH_PRESENTATION_WEAKNESS'
  | 'SEARCH_DEMAND_WEAKNESS'
  | 'DISCOVER_PRESENTATION_OPPORTUNITY'
  | 'STRONG_CONTENT_WEAK_DISTRIBUTION'
  | 'STRONG_DISTRIBUTION_WEAK_ENGAGEMENT'
  | 'CONTENT_REFRESH_OPPORTUNITY'
  | 'TOPIC_AUTHORITY_GAIN'
  | 'AI_VISIBILITY_GAIN';

export const PERFORMANCE_DIAGNOSIS_TYPES: readonly PerformanceDiagnosisType[] = [
  'SEARCH_PRESENTATION_WEAKNESS',
  'SEARCH_DEMAND_WEAKNESS',
  'DISCOVER_PRESENTATION_OPPORTUNITY',
  'STRONG_CONTENT_WEAK_DISTRIBUTION',
  'STRONG_DISTRIBUTION_WEAK_ENGAGEMENT',
  'CONTENT_REFRESH_OPPORTUNITY',
  'TOPIC_AUTHORITY_GAIN',
  'AI_VISIBILITY_GAIN'
] as const;

export interface PerformanceDiagnosis {
  id: string;
  articleId: string;
  signals: PerformanceSignal[];
  diagnosisType: PerformanceDiagnosisType;
  summary: string;
  confidence: SignalConfidence;
  evidence: string[];
  limitations: string[];
  anomaliesConsidered: AnalyticsDataAnomaly[];
  createdAt: string; // ISO 8601
}

/**
 * Validasi doktrin kausalitas: Memastikan narasi diagnosis tidak memuat klaim kausal yang tidak berdasar
 */
export function validateCausalAttribution(statement: string): {
  isValid: boolean;
  issueCode?: 'UNSUPPORTED_CAUSAL_ATTRIBUTION';
  message?: string;
} {
  const disallowedCausalPhrases = [
    'pasti menyebabkan',
    'secara langsung menyebabkan',
    'terbukti menyebabkan',
    'definitely caused',
    'directly caused',
    'proves that changing'
  ];

  const lower = statement.toLowerCase();
  for (const phrase of disallowedCausalPhrases) {
    if (lower.includes(phrase)) {
      return {
        isValid: false,
        issueCode: 'UNSUPPORTED_CAUSAL_ATTRIBUTION',
        message: `Klaim kausalitas "${phrase}" dilarang tanpa pengujian terkontrol. Gunakan terminologi "berkorelasi dengan" atau "teramati setelah".`
      };
    }
  }

  return { isValid: true };
}
