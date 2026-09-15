/**
 * NexaMOS Analytics Provider Base Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - Provider Independence: Core analytics does not hard-code vendor API schemas.
 * - Capabilities dictate what metrics can be fetched. Unsupported metrics are never invented.
 */

import type {
  AnalyticsSourceType,
  AnalyticsProviderCapabilities,
  LiveConnectorStatus
} from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export interface FetchMetricsParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  pageIdentifiers?: string[];
  dimensions?: string[];
}

export interface AnalyticsProvider {
  readonly providerName: string;
  readonly sourceType: AnalyticsSourceType;
  readonly capabilities: AnalyticsProviderCapabilities;
  readonly connectorStatus: LiveConnectorStatus;

  /**
   * Mengambil data performa mentah untuk rentang waktu dan identifier yang diminta
   */
  fetchMetrics(params: FetchMetricsParams): Promise<RawAnalyticsMeasurement[]>;

  /**
   * Memvalidasi apakah rekaman pengukuran mematuhi kapabilitas provider
   */
  validateMeasurement(measurement: RawAnalyticsMeasurement): {
    isValid: boolean;
    errors: string[];
  };
}
