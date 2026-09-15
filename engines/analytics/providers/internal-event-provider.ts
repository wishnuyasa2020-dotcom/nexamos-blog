/**
 * NexaMOS Internal Blog Event Provider Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 12).
 * Contract for internal telemetry and future CRM bridge.
 * Minimal events:
 * ARTICLE_VIEW, CTA_CLICK, SOURCE_LINK_CLICK, RELATED_ARTICLE_CLICK,
 * NEWSLETTER_SIGNUP, KNOWN_PROFILE_CREATED, LEAD_CREATED.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export type InternalBlogEventType =
  | 'ARTICLE_VIEW'
  | 'CTA_CLICK'
  | 'SOURCE_LINK_CLICK'
  | 'RELATED_ARTICLE_CLICK'
  | 'NEWSLETTER_SIGNUP'
  | 'KNOWN_PROFILE_CREATED'
  | 'LEAD_CREATED';

export interface InternalEventPayload {
  eventId: string;
  eventType: InternalBlogEventType;
  articleId: string;
  topicId?: string;
  publicationId?: string;
  timestamp: string; // ISO 8601
  anonymousSessionId: string;
  metadata?: Record<string, any>;
}

export class MockInternalEventProvider implements AnalyticsProvider {
  public readonly providerName = 'MockInternalEventProvider';
  public readonly sourceType = 'INTERNAL_EVENT';
  public readonly capabilities: AnalyticsProviderCapabilities = {
    supportsClicks: true,
    supportsImpressions: false,
    supportsCTR: false,
    supportsPosition: false,
    supportsPage: true,
    supportsQuery: false,
    supportsCountry: false,
    supportsDevice: true,
    supportsEngagement: true,
    supportsEvents: true
  };
  public connectorStatus: LiveConnectorStatus = 'AVAILABLE';

  private events: InternalEventPayload[] = [];

  public trackEvent(event: InternalEventPayload): void {
    this.events.push(event);
  }

  public async fetchMetrics(params: FetchMetricsParams): Promise<RawAnalyticsMeasurement[]> {
    const countsByType: Record<string, number> = {};

    const filtered = this.events.filter((e) => {
      const date = e.timestamp.slice(0, 10);
      if (date < params.startDate || date > params.endDate) return false;
      if (params.pageIdentifiers && params.pageIdentifiers.length > 0) {
        return params.pageIdentifiers.includes(e.articleId);
      }
      return true;
    });

    for (const ev of filtered) {
      countsByType[ev.eventType] = (countsByType[ev.eventType] || 0) + 1;
    }

    return Object.entries(countsByType).map(([evType, count], idx) => ({
      id: `internal-metric-${Date.now()}-${idx}`,
      sourceType: 'INTERNAL_EVENT',
      providerName: 'InternalEventProvider',
      rawPageIdentifier: params.pageIdentifiers ? params.pageIdentifiers[0] : 'all-pages',
      dimensions: {
        date: params.endDate,
        eventType: evType
      },
      rawValues: {
        count
      },
      sourceTimezone: 'UTC',
      ingestedAt: new Date().toISOString()
    }));
  }

  public validateMeasurement(measurement: RawAnalyticsMeasurement): {
    isValid: boolean;
    errors: string[];
  } {
    return {
      isValid: measurement.sourceType === 'INTERNAL_EVENT',
      errors: measurement.sourceType === 'INTERNAL_EVENT' ? [] : ['Source must be INTERNAL_EVENT']
    };
  }
}
