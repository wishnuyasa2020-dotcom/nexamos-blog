/**
 * NexaMOS Google Search Console Performance Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 6).
 * Support metrics: clicks, impressions, ctr, position.
 * Dimensions: page, query, date, country, device, searchAppearance.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export const GOOGLE_SEARCH_CAPABILITIES: AnalyticsProviderCapabilities = {
  supportsClicks: true,
  supportsImpressions: true,
  supportsCTR: true,
  supportsPosition: true,
  supportsPage: true,
  supportsQuery: true,
  supportsCountry: true,
  supportsDevice: true,
  supportsEngagement: false,
  supportsEvents: false
};

export interface GoogleSearchPerformanceProvider extends AnalyticsProvider {}

/**
 * Mock Provider untuk pengujian tanpa ketergantungan koneksi live Google API
 */
export class MockSearchConsoleProvider implements GoogleSearchPerformanceProvider {
  public readonly providerName = 'MockGoogleSearchConsole';
  public readonly sourceType = 'GOOGLE_SEARCH';
  public readonly capabilities = GOOGLE_SEARCH_CAPABILITIES;
  public connectorStatus: LiveConnectorStatus = 'AVAILABLE';

  private mockData: RawAnalyticsMeasurement[] = [];

  constructor(initialData: RawAnalyticsMeasurement[] = []) {
    this.mockData = [...initialData];
  }

  public seedData(measurements: RawAnalyticsMeasurement[]): void {
    this.mockData.push(...measurements);
  }

  public async fetchMetrics(params: FetchMetricsParams): Promise<RawAnalyticsMeasurement[]> {
    return this.mockData.filter((m) => {
      if (m.sourceType !== 'GOOGLE_SEARCH') return false;
      const date = m.dimensions.date;
      if (date < params.startDate || date > params.endDate) return false;
      if (params.pageIdentifiers && params.pageIdentifiers.length > 0) {
        return params.pageIdentifiers.some(
          (pid) => m.rawPageIdentifier.includes(pid) || (m.dimensions.page && m.dimensions.page.includes(pid))
        );
      }
      return true;
    });
  }

  public validateMeasurement(measurement: RawAnalyticsMeasurement): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (measurement.sourceType !== 'GOOGLE_SEARCH') {
      errors.push(`Invalid source type: expected GOOGLE_SEARCH, got ${measurement.sourceType}`);
    }

    // Periksa jika ada metrik engagement yang dimasukkan ke Search Console
    if ('engagedSessions' in measurement.rawValues || 'averageEngagementTime' in measurement.rawValues) {
      errors.push('Search Console tidak mendukung metrik engagement');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
