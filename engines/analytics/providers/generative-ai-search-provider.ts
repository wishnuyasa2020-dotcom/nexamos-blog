/**
 * NexaMOS Google Generative AI Search Performance Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 8).
 * Current canonical measurable metric: IMPRESSIONS.
 * Dimensions: page, country, device, date.
 * Hard Doctrine:
 * JANGAN mengarang clicks, ctr, citationCount, AI rank, atau answer position
 * jika provider/source tidak memberikan metrik tersebut.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export const GENERATIVE_AI_SEARCH_CAPABILITIES: AnalyticsProviderCapabilities = {
  supportsClicks: false,       // Tidak tersedia metrik klik kanonikal saat ini
  supportsImpressions: true,  // Satu-satunya metrik terukur yang valid
  supportsCTR: false,         // DILARANG dihitung tanpa klik valid
  supportsPosition: false,    // Tidak ada konsep peringkat AI linier yang valid
  supportsPage: true,
  supportsQuery: false,
  supportsCountry: true,
  supportsDevice: true,
  supportsEngagement: false,
  supportsEvents: false
};

export interface GenerativeAISearchPerformanceProvider extends AnalyticsProvider {}

export class MockGenerativeAISearchProvider implements GenerativeAISearchPerformanceProvider {
  public readonly providerName = 'MockGoogleGenerativeAISearch';
  public readonly sourceType = 'GOOGLE_GENERATIVE_AI_SEARCH';
  public readonly capabilities = GENERATIVE_AI_SEARCH_CAPABILITIES;
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
      if (m.sourceType !== 'GOOGLE_GENERATIVE_AI_SEARCH') return false;
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
    if (measurement.sourceType !== 'GOOGLE_GENERATIVE_AI_SEARCH') {
      errors.push(`Invalid source type: expected GOOGLE_GENERATIVE_AI_SEARCH, got ${measurement.sourceType}`);
    }

    // Penegakan doktrin keras: tolak metrik palsu
    const disallowedMetrics = ['clicks', 'ctr', 'citationCount', 'aiRank', 'answerPosition'];
    for (const key of disallowedMetrics) {
      if (key in measurement.rawValues) {
        errors.push(`Metrik tidak didukung: '${key}' tidak diizinkan untuk GOOGLE_GENERATIVE_AI_SEARCH`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
