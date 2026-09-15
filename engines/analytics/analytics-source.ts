/**
 * NexaMOS Analytics Source & Provider Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - Data Source Independence: Providers expose different metrics; never invent unsupported metrics.
 * - Signal ≠ Insight, Metric ≠ Strategy, Correlation ≠ Causation.
 */

export type AnalyticsSourceType =
  | 'GOOGLE_SEARCH'
  | 'GOOGLE_DISCOVER'
  | 'GOOGLE_GENERATIVE_AI_SEARCH'
  | 'GOOGLE_GENERATIVE_AI_DISCOVER'
  | 'GA4'
  | 'INTERNAL_EVENT'
  | 'MANUAL_IMPORT'
  | 'OTHER';

export const ANALYTICS_SOURCE_TYPES: readonly AnalyticsSourceType[] = [
  'GOOGLE_SEARCH',
  'GOOGLE_DISCOVER',
  'GOOGLE_GENERATIVE_AI_SEARCH',
  'GOOGLE_GENERATIVE_AI_DISCOVER',
  'GA4',
  'INTERNAL_EVENT',
  'MANUAL_IMPORT',
  'OTHER'
] as const;

/**
 * Status konektor live provider
 */
export type LiveConnectorStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'AUTH_ERROR'
  | 'AVAILABLE';

export const LIVE_CONNECTOR_STATUSES: readonly LiveConnectorStatus[] = [
  'NOT_CONFIGURED',
  'CONFIGURED',
  'AUTH_ERROR',
  'AVAILABLE'
] as const;

/**
 * Kapabilitas eksplisit tiap provider
 * Mencegah asumsi salah bahwa semua provider menyediakan metrik yang sama
 */
export interface AnalyticsProviderCapabilities {
  supportsClicks: boolean;
  supportsImpressions: boolean;
  supportsCTR: boolean;
  supportsPosition: boolean;
  supportsPage: boolean;
  supportsQuery: boolean;
  supportsCountry: boolean;
  supportsDevice: boolean;
  supportsEngagement: boolean;
  supportsEvents: boolean;
}

/**
 * Anomali data dari provider
 * Digunakan untuk menurunkan tingkat keyakinan (confidence) diagnosis tanpa merusak raw data
 */
export type AnalyticsDataAnomalyType =
  | 'PROVIDER_LOGGING_ISSUE'
  | 'MISSING_DATA'
  | 'DELAYED_DATA'
  | 'THRESHOLD_EFFECT'
  | 'OUTLIER'
  | 'UNKNOWN';

export interface AnalyticsDataAnomaly {
  anomalyType: AnalyticsDataAnomalyType;
  sourceType: AnalyticsSourceType;
  description: string;
  affectedPeriod?: {
    startDate: string; // ISO 8601 or YYYY-MM-DD
    endDate: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  identifiedAt: string; // ISO 8601
  notes?: string;
}

/**
 * Tipe Audit Event untuk siklus hidup Analytics
 */
export type AnalyticsAuditEventType =
  | 'ANALYTICS_INGESTION_STARTED'
  | 'ANALYTICS_DATA_IMPORTED'
  | 'ANALYTICS_NORMALIZED'
  | 'PERFORMANCE_SNAPSHOT_CREATED'
  | 'SIGNAL_DETECTED'
  | 'DIAGNOSIS_CREATED'
  | 'LEARNING_CREATED'
  | 'FEEDBACK_ACTION_PROPOSED'
  | 'FEEDBACK_ROUTED';

export interface AnalyticsAuditEvent {
  eventId: string;
  eventType: AnalyticsAuditEventType;
  articleId?: string;
  timestamp: string; // ISO 8601
  details: Record<string, any>;
}
