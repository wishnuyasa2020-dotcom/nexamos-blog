/**
 * NexaMOS Google Discover Performance Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 7).
 * Support: clicks, impressions, ctr.
 * Dimensions: page, country, date, appearanceType.
 * Hard Principle:
 * Jika artikel belum memenuhi ambang batas Discover: tandai 'BELOW_THRESHOLD' atau 'DATA_NOT_AVAILABLE',
 * BUKAN otomatis diartikan 'ZERO_PERFORMANCE'.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export const GOOGLE_DISCOVER_CAPABILITIES: AnalyticsProviderCapabilities = {
  supportsClicks: true,
  supportsImpressions: true,
  supportsCTR: true,
  supportsPosition: false, // Discover tidak memiliki concept search position
  supportsPage: true,
  supportsQuery: false,   // Discover tidak memiliki kueri pencarian
  supportsCountry: true,
  supportsDevice: false,
  supportsEngagement: false,
  supportsEvents: false
};

export interface GoogleDiscoverPerformanceProvider extends AnalyticsProvider {}

export class MockDiscoverProvider implements GoogleDiscoverPerformanceProvider {
  public readonly providerName = 'MockGoogleDiscover';
  public readonly sourceType = 'GOOGLE_DISCOVER';
  public readonly capabilities = GOOGLE_DISCOVER_CAPABILITIES;
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
      if (m.sourceType !== 'GOOGLE_DISCOVER') return false;
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
    if (measurement.sourceType !== 'GOOGLE_DISCOVER') {
      errors.push(`Invalid source type: expected GOOGLE_DISCOVER, got ${measurement.sourceType}`);
    }

    // Discover tidak mendukung query atau position
    if ('position' in measurement.rawValues || measurement.dimensions.query) {
      errors.push('Discover tidak memiliki dimensi kueri atau posisi peringkat');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
