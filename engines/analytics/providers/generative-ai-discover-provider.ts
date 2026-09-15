/**
 * NexaMOS Google Generative AI Discover Performance Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 9).
 * Support: impressions, page, country, date, appearanceType.
 * Hard Principle:
 * Jangan menyamakan metric contract dengan regular Discover (misal clicks/ctr reguler).
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export const GENERATIVE_AI_DISCOVER_CAPABILITIES: AnalyticsProviderCapabilities = {
  supportsClicks: false,
  supportsImpressions: true,
  supportsCTR: false,
  supportsPosition: false,
  supportsPage: true,
  supportsQuery: false,
  supportsCountry: true,
  supportsDevice: false,
  supportsEngagement: false,
  supportsEvents: false
};

export interface GenerativeAIDiscoverPerformanceProvider extends AnalyticsProvider {}

export class MockGenerativeAIDiscoverProvider implements GenerativeAIDiscoverPerformanceProvider {
  public readonly providerName = 'MockGoogleGenerativeAIDiscover';
  public readonly sourceType = 'GOOGLE_GENERATIVE_AI_DISCOVER';
  public readonly capabilities = GENERATIVE_AI_DISCOVER_CAPABILITIES;
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
      if (m.sourceType !== 'GOOGLE_GENERATIVE_AI_DISCOVER') return false;
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
    if (measurement.sourceType !== 'GOOGLE_GENERATIVE_AI_DISCOVER') {
      errors.push(`Invalid source type: expected GOOGLE_GENERATIVE_AI_DISCOVER, got ${measurement.sourceType}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
