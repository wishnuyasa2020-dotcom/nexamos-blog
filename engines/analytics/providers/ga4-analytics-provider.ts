/**
 * NexaMOS GA4 Analytics Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 11).
 * Core metrics: users, sessions, engagedSessions, engagementRate, averageEngagementTime, views, eventCount, keyEvents.
 * Useful dimensions: pagePath, pageLocation, landingPage, date, deviceCategory, sessionSource, sessionMedium, country.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export const GA4_CAPABILITIES: AnalyticsProviderCapabilities = {
  supportsClicks: false,
  supportsImpressions: false,
  supportsCTR: false,
  supportsPosition: false,
  supportsPage: true,
  supportsQuery: false,
  supportsCountry: true,
  supportsDevice: true,
  supportsEngagement: true,
  supportsEvents: true
};

export interface GA4AnalyticsProvider extends AnalyticsProvider {}

export class MockGA4Provider implements GA4AnalyticsProvider {
  public readonly providerName = 'MockGA4';
  public readonly sourceType = 'GA4';
  public readonly capabilities = GA4_CAPABILITIES;
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
      if (m.sourceType !== 'GA4') return false;
      const date = m.dimensions.date;
      if (date < params.startDate || date > params.endDate) return false;
      if (params.pageIdentifiers && params.pageIdentifiers.length > 0) {
        return params.pageIdentifiers.some(
          (pid) =>
            m.rawPageIdentifier.includes(pid) ||
            (m.dimensions.pagePath && m.dimensions.pagePath.includes(pid)) ||
            (m.dimensions.page && m.dimensions.page.includes(pid))
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
    if (measurement.sourceType !== 'GA4') {
      errors.push(`Invalid source type: expected GA4, got ${measurement.sourceType}`);
    }

    // GA4 tidak mendukung rank position
    if ('position' in measurement.rawValues) {
      errors.push('GA4 tidak memiliki metrik posisi peringkat (position)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
