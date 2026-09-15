/**
 * NexaMOS Generative AI Report Import Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 10).
 * Support: CSV, JSON, manual normalized import.
 * Hard Principle:
 * Jangan membuat fake live API. Ingestion laporan pihak ketiga melalui format terstruktur.
 */

import type { AnalyticsProvider, FetchMetricsParams } from './analytics-provider.contract.ts';
import type { AnalyticsProviderCapabilities, LiveConnectorStatus } from '../analytics-source.ts';
import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';

export class GenerativeAIReportImportProvider implements AnalyticsProvider {
  public readonly providerName = 'GenerativeAIReportImportProvider';
  public readonly sourceType = 'MANUAL_IMPORT';
  public readonly capabilities: AnalyticsProviderCapabilities = {
    supportsClicks: false,
    supportsImpressions: true,
    supportsCTR: false,
    supportsPosition: false,
    supportsPage: true,
    supportsQuery: false,
    supportsCountry: true,
    supportsDevice: true,
    supportsEngagement: false,
    supportsEvents: false
  };
  public connectorStatus: LiveConnectorStatus = 'AVAILABLE';

  private importedData: RawAnalyticsMeasurement[] = [];

  /**
   * Mengimpor data dari format JSON
   */
  public importFromJson(
    jsonPayload: Array<{
      url: string;
      impressions: number;
      date: string;
      country?: string;
      device?: string;
      sourceType?: 'GOOGLE_GENERATIVE_AI_SEARCH' | 'GOOGLE_GENERATIVE_AI_DISCOVER';
    }>
  ): RawAnalyticsMeasurement[] {
    const measurements: RawAnalyticsMeasurement[] = jsonPayload.map((item, idx) => ({
      id: `gen-ai-import-json-${Date.now()}-${idx}`,
      sourceType: item.sourceType || 'GOOGLE_GENERATIVE_AI_SEARCH',
      providerName: 'GenerativeAIReportImport',
      rawPageIdentifier: item.url,
      dimensions: {
        page: item.url,
        date: item.date,
        country: item.country || 'GLOBAL',
        device: item.device || 'ALL'
      },
      rawValues: {
        impressions: item.impressions
      },
      sourceTimezone: 'UTC',
      ingestedAt: new Date().toISOString()
    }));

    this.importedData.push(...measurements);
    return measurements;
  }

  /**
   * Mengimpor data dari teks CSV
   * Header yang diharapkan: url,impressions,date[,country,device]
   */
  public importFromCsv(csvText: string): RawAnalyticsMeasurement[] {
    const lines = csvText.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const urlIdx = headers.indexOf('url');
    const impIdx = headers.indexOf('impressions');
    const dateIdx = headers.indexOf('date');
    const countryIdx = headers.indexOf('country');
    const deviceIdx = headers.indexOf('device');

    if (urlIdx === -1 || impIdx === -1 || dateIdx === -1) {
      throw new Error("Format CSV tidak valid: kolom 'url', 'impressions', dan 'date' wajib ada.");
    }

    const measurements: RawAnalyticsMeasurement[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const url = parts[urlIdx];
      const impressions = parseInt(parts[impIdx], 10) || 0;
      const date = parts[dateIdx];
      const country = countryIdx !== -1 ? parts[countryIdx] : 'GLOBAL';
      const device = deviceIdx !== -1 ? parts[deviceIdx] : 'ALL';

      measurements.push({
        id: `gen-ai-import-csv-${Date.now()}-${i}`,
        sourceType: 'GOOGLE_GENERATIVE_AI_SEARCH',
        providerName: 'GenerativeAIReportImport',
        rawPageIdentifier: url,
        dimensions: {
          page: url,
          date,
          country,
          device
        },
        rawValues: {
          impressions
        },
        sourceTimezone: 'UTC',
        ingestedAt: new Date().toISOString()
      });
    }

    this.importedData.push(...measurements);
    return measurements;
  }

  public async fetchMetrics(params: FetchMetricsParams): Promise<RawAnalyticsMeasurement[]> {
    return this.importedData.filter((m) => {
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
    if (!measurement.rawValues || typeof measurement.rawValues.impressions !== 'number') {
      errors.push("Missing or invalid 'impressions' value in imported measurement");
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
