/**
 * NexaMOS Analytics Metric Domain Models & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - Differentiate: ZERO vs NO_DATA vs NOT_ELIGIBLE vs BELOW_THRESHOLD vs NOT_CONNECTED. Never turn everything into 0.
 * - Sample Sufficiency Guard: Small samples cannot produce strong confidence.
 * - Privacy Guard: Reject PII (email, phone, name, raw IP, personal message).
 * - Synthetic Guard: Fixtures/synthetic test data must NEVER be treated as production data.
 */

import type { AnalyticsSourceType } from './analytics-source.ts';

/**
 * Semantik status nilai metrik
 */
export type MetricSemanticStatus =
  | 'VALUE'
  | 'ZERO'
  | 'NO_DATA'
  | 'NOT_ELIGIBLE'
  | 'BELOW_THRESHOLD'
  | 'NOT_CONNECTED';

/**
 * Evaluasi kecukupan sampel
 */
export type SampleSufficiency =
  | 'SUFFICIENT'
  | 'LOW_SAMPLE'
  | 'INSUFFICIENT';

/**
 * Nilai metrik ternormalisasi dengan metadata semantis
 */
export interface NormalizedMetricValue<T = number> {
  value: T | null;
  semantic: MetricSemanticStatus;
  sampleSufficiency: SampleSufficiency;
  sampleSize?: number;
  rawSourceMetric?: string;
  notes?: string;
}

/**
 * Pengukuran mentah asli dari data provider
 * Mengedepankan sifat immutable: pembaruan/koreksi menggunakan pointer `supersedesId`
 */
export interface RawAnalyticsMeasurement {
  id: string;
  sourceType: AnalyticsSourceType;
  providerName: string;
  rawPageIdentifier: string; // URL, path, atau identifier lain yang dilaporkan provider
  dimensions: {
    page?: string;
    query?: string;
    country?: string;
    device?: string;
    searchAppearance?: string;
    date: string; // YYYY-MM-DD
    [key: string]: any;
  };
  rawValues: Record<string, number | string | boolean>;
  sourceTimezone: string; // e.g. 'UTC', 'America/Los_Angeles', 'Asia/Jakarta'
  ingestedAt: string; // ISO 8601
  supersedesId?: string | null;

  // Safety attributes
  isSyntheticTestData?: boolean;
  fixtureOnly?: boolean;
}

/**
 * Metrik Google Search Standar
 */
export interface NormalizedSearchMetrics {
  impressions: NormalizedMetricValue<number>;
  clicks: NormalizedMetricValue<number>;
  ctr: NormalizedMetricValue<number>; // Dihitung hanya jika impressions > 0 dan clicks valid
  position: NormalizedMetricValue<number>;
}

/**
 * Metrik Google Discover
 */
export interface NormalizedDiscoverMetrics {
  impressions: NormalizedMetricValue<number>;
  clicks: NormalizedMetricValue<number>;
  ctr: NormalizedMetricValue<number>;
  thresholdStatus: 'ABOVE_THRESHOLD' | 'BELOW_THRESHOLD' | 'UNKNOWN';
}

/**
 * Metrik Google Generative AI Search
 * Doktrin Keras: Hanya `impressions` yang dapat diukur secara kanonikal saat ini.
 * JANGAN menambahkan clicks, ctr, citationCount, atau AI rank jika tidak disediakan provider.
 */
export interface NormalizedGenerativeAISearchMetrics {
  impressions: NormalizedMetricValue<number>;
}

/**
 * Metrik Google Generative AI Discover
 */
export interface NormalizedGenerativeAIDiscoverMetrics {
  impressions: NormalizedMetricValue<number>;
  appearanceType?: string;
}

/**
 * Metrik Perilaku Pengguna (GA4 / Web Analytics)
 */
export interface NormalizedBehaviorMetrics {
  users: NormalizedMetricValue<number>;
  sessions: NormalizedMetricValue<number>;
  engagedSessions: NormalizedMetricValue<number>;
  engagementRate: NormalizedMetricValue<number>;
  averageEngagementTimeSeconds: NormalizedMetricValue<number>;
  views: NormalizedMetricValue<number>;
  eventCount: NormalizedMetricValue<number>;
  keyEvents: NormalizedMetricValue<number>;
}

/**
 * Tipe Bisnis / Outcome Masa Depan (Kontrak Jembatan CRM)
 */
export type BusinessOutcomeType =
  | 'ARTICLE_VIEW'
  | 'CTA_CLICK'
  | 'SOURCE_LINK_CLICK'
  | 'RELATED_ARTICLE_CLICK'
  | 'NEWSLETTER_SUBSCRIBED'
  | 'KNOWN_PROFILE_CREATED'
  | 'LEAD_CREATED'
  | 'SALES_OPPORTUNITY_CREATED'
  | 'CUSTOMER_CREATED';

export interface BusinessOutcomeMetric {
  outcomeType: BusinessOutcomeType;
  count: number;
  articleId: string;
  topicId?: string;
  publicationId?: string;
  recordedPeriod: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Daftar field sensitif PII yang dilarang keras masuk dalam rekaman analitik artikel
 */
export const FORBIDDEN_PII_FIELDS = [
  'email',
  'phone',
  'name',
  'raw_ip',
  'ip_address',
  'personal_message',
  'user_real_name'
] as const;

/**
 * Guardrail validasi PII
 */
export function validateAnalyticsPayloadPrivacy(payload: Record<string, any>): {
  hasPII: boolean;
  detectedFields: string[];
} {
  const detected: string[] = [];
  const inspectObject = (obj: Record<string, any>, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_PII_FIELDS.some((pii) => lowerKey.includes(pii))) {
        detected.push(fullKey);
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        inspectObject(value, fullKey);
      }
    }
  };

  inspectObject(payload);
  return {
    hasPII: detected.length > 0,
    detectedFields: detected
  };
}
