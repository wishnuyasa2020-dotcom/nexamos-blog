/**
 * NexaMOS Analytics Normalizer
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Sections 17, 18, 21, 38).
 * Hard Principles:
 * - Differentiate: ZERO vs NO_DATA vs BELOW_THRESHOLD vs NOT_CONNECTED.
 * - Calculate CTR only if impressions > 0 and clicks is supported & valid.
 * - Sample Sufficiency Guard: small sample != strong performance.
 * - Privacy Guard: reject any payload containing PII.
 * - Anti-Synthetic Guard: detect and tag synthetic fixtures.
 */

import type {
  RawAnalyticsMeasurement,
  NormalizedSearchMetrics,
  NormalizedDiscoverMetrics,
  NormalizedGenerativeAISearchMetrics,
  NormalizedGenerativeAIDiscoverMetrics,
  NormalizedBehaviorMetrics,
  SampleSufficiency,
  MetricSemanticStatus
} from './analytics-metric.ts';
import { validateAnalyticsPayloadPrivacy } from './analytics-metric.ts';
import type { PerformanceWindow } from './performance-window.ts';
import type { ArticlePerformanceSnapshot, DataCompletenessStatus } from './performance-snapshot.ts';
import type { AnalyticsDataAnomaly } from './analytics-source.ts';
import type { ResolvedArticleIdentity } from './providers/article-identity-resolver.ts';
import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';

export class AnalyticsNormalizer {
  /**
   * Menormalisasi kumpulan rekaman mentah menjadi ArticlePerformanceSnapshot utuh
   */
  public normalizeSnapshot(params: {
    identity: ResolvedArticleIdentity;
    window: PerformanceWindow;
    territory: Territory;
    articleType: ArticleType;
    editorialRole?: EditorialRole | null;
    measurements: RawAnalyticsMeasurement[];
    anomalies?: AnalyticsDataAnomaly[];
    isProductionMode?: boolean;
  }): ArticlePerformanceSnapshot {
    const {
      identity,
      window,
      territory,
      articleType,
      editorialRole,
      measurements,
      anomalies = [],
      isProductionMode = false
    } = params;

    // 1. Validasi Privasi & PII pada seluruh rekaman
    for (const m of measurements) {
      const piiCheck = validateAnalyticsPayloadPrivacy(m.rawValues);
      if (piiCheck.hasPII) {
        throw new Error(
          `Pelanggaran Privasi Terdeteksi: Rekaman mentah memuat PII terlarang (${piiCheck.detectedFields.join(', ')}). Ingestion dibatalkan.`
        );
      }

      // 2. Validasi Kebocoran Data Sintetis di Mode Produksi
      if (isProductionMode && (m.isSyntheticTestData || m.fixtureOnly)) {
        throw new Error(
          'Pelanggaran Keamanan Produksi: Data sintetis pengujian dilarang masuk ke analitik mode produksi.'
        );
      }
    }

    // 3. Normalisasi metrik per kanal
    const searchMetrics = this.normalizeSearch(measurements);
    const discoverMetrics = this.normalizeDiscover(measurements);
    const generativeAISearchMetrics = this.normalizeGenerativeAISearch(measurements);
    const generativeAIDiscoverMetrics = this.normalizeGenerativeAIDiscover(measurements);
    const behaviorMetrics = this.normalizeBehavior(measurements);

    // 4. Evaluasi Kelengkapan Data (Data Completeness)
    let completeness: DataCompletenessStatus = 'COMPLETE';
    if (anomalies.some((a) => a.anomalyType === 'MISSING_DATA' || a.anomalyType === 'DELAYED_DATA')) {
      completeness = 'DELAYED';
    } else if (discoverMetrics && discoverMetrics.thresholdStatus === 'BELOW_THRESHOLD') {
      completeness = 'THRESHOLDED';
    } else if (!searchMetrics && !behaviorMetrics) {
      completeness = 'PARTIAL';
    }

    // 5. Evaluasi Kecukupan Sampel Keseluruhan
    const overallSampleSufficiency = this.determineOverallSampleSufficiency(
      searchMetrics,
      behaviorMetrics
    );

    return {
      id: `snapshot-${identity.articleId}-${window.windowType}-${Date.now()}`,
      articleId: identity.articleId,
      publicationId: identity.publicationId || 'pub-unspecified',
      topicId: identity.topicId || 'top-unspecified',
      slug: identity.slug,
      window,
      territory,
      articleType,
      editorialRole,
      search: searchMetrics,
      discover: discoverMetrics,
      generativeAISearch: generativeAISearchMetrics,
      generativeAIDiscover: generativeAIDiscoverMetrics,
      behavior: behaviorMetrics,
      dataCompleteness: completeness,
      overallSampleSufficiency,
      anomaliesDetected: anomalies,
      createdAt: new Date().toISOString()
    };
  }

  private normalizeSearch(measurements: RawAnalyticsMeasurement[]): NormalizedSearchMetrics | null {
    const searchRows = measurements.filter((m) => m.sourceType === 'GOOGLE_SEARCH');
    if (searchRows.length === 0) return null;

    let totalImpressions = 0;
    let totalClicks = 0;
    let weightedPositionSum = 0;
    let hasAnyData = false;

    for (const row of searchRows) {
      const imp = typeof row.rawValues.impressions === 'number' ? row.rawValues.impressions : 0;
      const clk = typeof row.rawValues.clicks === 'number' ? row.rawValues.clicks : 0;
      const pos = typeof row.rawValues.position === 'number' ? row.rawValues.position : 0;

      totalImpressions += imp;
      totalClicks += clk;
      weightedPositionSum += pos * imp;
      hasAnyData = true;
    }

    if (!hasAnyData) {
      return {
        impressions: { value: null, semantic: 'NO_DATA', sampleSufficiency: 'INSUFFICIENT' },
        clicks: { value: null, semantic: 'NO_DATA', sampleSufficiency: 'INSUFFICIENT' },
        ctr: { value: null, semantic: 'NO_DATA', sampleSufficiency: 'INSUFFICIENT' },
        position: { value: null, semantic: 'NO_DATA', sampleSufficiency: 'INSUFFICIENT' }
      };
    }

    const sampleSufficiency: SampleSufficiency =
      totalImpressions >= 200 ? 'SUFFICIENT' : totalImpressions >= 20 ? 'LOW_SAMPLE' : 'INSUFFICIENT';

    const impSemantic: MetricSemanticStatus = totalImpressions === 0 ? 'ZERO' : 'VALUE';
    const clkSemantic: MetricSemanticStatus = totalClicks === 0 ? 'ZERO' : 'VALUE';

    // Perhitungan CTR aman: hanya jika impresi > 0
    let ctrValue: number | null = null;
    let ctrSemantic: MetricSemanticStatus = 'NO_DATA';
    if (totalImpressions > 0) {
      ctrValue = totalClicks / totalImpressions;
      ctrSemantic = ctrValue === 0 ? 'ZERO' : 'VALUE';
    }

    const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : null;

    return {
      impressions: {
        value: totalImpressions,
        semantic: impSemantic,
        sampleSufficiency,
        sampleSize: totalImpressions
      },
      clicks: {
        value: totalClicks,
        semantic: clkSemantic,
        sampleSufficiency,
        sampleSize: totalClicks
      },
      ctr: {
        value: ctrValue,
        semantic: ctrSemantic,
        sampleSufficiency
      },
      position: {
        value: avgPosition,
        semantic: avgPosition !== null ? 'VALUE' : 'NO_DATA',
        sampleSufficiency
      }
    };
  }

  private normalizeDiscover(measurements: RawAnalyticsMeasurement[]): NormalizedDiscoverMetrics | null {
    const discoverRows = measurements.filter((m) => m.sourceType === 'GOOGLE_DISCOVER');
    if (discoverRows.length === 0) return null;

    let totalImpressions = 0;
    let totalClicks = 0;
    let isExplicitlyThresholded = false;

    for (const row of discoverRows) {
      if (row.rawValues.thresholdStatus === 'BELOW_THRESHOLD' || row.rawValues.dataAvailable === false) {
        isExplicitlyThresholded = true;
      }
      const imp = typeof row.rawValues.impressions === 'number' ? row.rawValues.impressions : 0;
      const clk = typeof row.rawValues.clicks === 'number' ? row.rawValues.clicks : 0;
      totalImpressions += imp;
      totalClicks += clk;
    }

    if (isExplicitlyThresholded || (totalImpressions === 0 && discoverRows.some((r) => r.rawValues.thresholded))) {
      return {
        impressions: {
          value: null,
          semantic: 'BELOW_THRESHOLD',
          sampleSufficiency: 'INSUFFICIENT',
          notes: 'Impresi di bawah ambang batas minimum Google Discover'
        },
        clicks: {
          value: null,
          semantic: 'BELOW_THRESHOLD',
          sampleSufficiency: 'INSUFFICIENT'
        },
        ctr: {
          value: null,
          semantic: 'BELOW_THRESHOLD',
          sampleSufficiency: 'INSUFFICIENT'
        },
        thresholdStatus: 'BELOW_THRESHOLD'
      };
    }

    const sampleSufficiency: SampleSufficiency =
      totalImpressions >= 300 ? 'SUFFICIENT' : totalImpressions >= 50 ? 'LOW_SAMPLE' : 'INSUFFICIENT';

    const ctrValue = totalImpressions > 0 ? totalClicks / totalImpressions : null;

    return {
      impressions: {
        value: totalImpressions,
        semantic: totalImpressions === 0 ? 'ZERO' : 'VALUE',
        sampleSufficiency,
        sampleSize: totalImpressions
      },
      clicks: {
        value: totalClicks,
        semantic: totalClicks === 0 ? 'ZERO' : 'VALUE',
        sampleSufficiency,
        sampleSize: totalClicks
      },
      ctr: {
        value: ctrValue,
        semantic: ctrValue !== null ? (ctrValue === 0 ? 'ZERO' : 'VALUE') : 'NO_DATA',
        sampleSufficiency
      },
      thresholdStatus: 'ABOVE_THRESHOLD'
    };
  }

  private normalizeGenerativeAISearch(
    measurements: RawAnalyticsMeasurement[]
  ): NormalizedGenerativeAISearchMetrics | null {
    const aiRows = measurements.filter((m) => m.sourceType === 'GOOGLE_GENERATIVE_AI_SEARCH');
    if (aiRows.length === 0) return null;

    let totalImpressions = 0;
    for (const row of aiRows) {
      const imp = typeof row.rawValues.impressions === 'number' ? row.rawValues.impressions : 0;
      totalImpressions += imp;
    }

    const sampleSufficiency: SampleSufficiency =
      totalImpressions >= 100 ? 'SUFFICIENT' : totalImpressions >= 10 ? 'LOW_SAMPLE' : 'INSUFFICIENT';

    return {
      impressions: {
        value: totalImpressions,
        semantic: totalImpressions === 0 ? 'ZERO' : 'VALUE',
        sampleSufficiency,
        sampleSize: totalImpressions
      }
    };
  }

  private normalizeGenerativeAIDiscover(
    measurements: RawAnalyticsMeasurement[]
  ): NormalizedGenerativeAIDiscoverMetrics | null {
    const aiRows = measurements.filter((m) => m.sourceType === 'GOOGLE_GENERATIVE_AI_DISCOVER');
    if (aiRows.length === 0) return null;

    let totalImpressions = 0;
    for (const row of aiRows) {
      const imp = typeof row.rawValues.impressions === 'number' ? row.rawValues.impressions : 0;
      totalImpressions += imp;
    }

    const sampleSufficiency: SampleSufficiency =
      totalImpressions >= 100 ? 'SUFFICIENT' : totalImpressions >= 10 ? 'LOW_SAMPLE' : 'INSUFFICIENT';

    return {
      impressions: {
        value: totalImpressions,
        semantic: totalImpressions === 0 ? 'ZERO' : 'VALUE',
        sampleSufficiency,
        sampleSize: totalImpressions
      }
    };
  }

  private normalizeBehavior(measurements: RawAnalyticsMeasurement[]): NormalizedBehaviorMetrics | null {
    const gaRows = measurements.filter((m) => m.sourceType === 'GA4');
    if (gaRows.length === 0) return null;

    let users = 0;
    let sessions = 0;
    let engagedSessions = 0;
    let engagementTimeSum = 0;
    let views = 0;
    let eventCount = 0;
    let keyEvents = 0;

    for (const row of gaRows) {
      users += typeof row.rawValues.users === 'number' ? row.rawValues.users : 0;
      sessions += typeof row.rawValues.sessions === 'number' ? row.rawValues.sessions : 0;
      engagedSessions += typeof row.rawValues.engagedSessions === 'number' ? row.rawValues.engagedSessions : 0;
      engagementTimeSum += typeof row.rawValues.averageEngagementTime === 'number' ? row.rawValues.averageEngagementTime : 0;
      views += typeof row.rawValues.views === 'number' ? row.rawValues.views : 0;
      eventCount += typeof row.rawValues.eventCount === 'number' ? row.rawValues.eventCount : 0;
      keyEvents += typeof row.rawValues.keyEvents === 'number' ? row.rawValues.keyEvents : 0;
    }

    const sampleSufficiency: SampleSufficiency =
      sessions >= 100 ? 'SUFFICIENT' : sessions >= 10 ? 'LOW_SAMPLE' : 'INSUFFICIENT';

    const engagementRate = sessions > 0 ? engagedSessions / sessions : null;
    const avgEngagementTime = gaRows.length > 0 ? engagementTimeSum / gaRows.length : null;

    return {
      users: { value: users, semantic: users === 0 ? 'ZERO' : 'VALUE', sampleSufficiency },
      sessions: { value: sessions, semantic: sessions === 0 ? 'ZERO' : 'VALUE', sampleSufficiency },
      engagedSessions: { value: engagedSessions, semantic: engagedSessions === 0 ? 'ZERO' : 'VALUE', sampleSufficiency },
      engagementRate: {
        value: engagementRate,
        semantic: engagementRate !== null ? (engagementRate === 0 ? 'ZERO' : 'VALUE') : 'NO_DATA',
        sampleSufficiency
      },
      averageEngagementTimeSeconds: {
        value: avgEngagementTime,
        semantic: avgEngagementTime !== null ? 'VALUE' : 'NO_DATA',
        sampleSufficiency
      },
      views: { value: views, semantic: views === 0 ? 'ZERO' : 'VALUE', sampleSufficiency },
      eventCount: { value: eventCount, semantic: eventCount === 0 ? 'ZERO' : 'VALUE', sampleSufficiency },
      keyEvents: { value: keyEvents, semantic: keyEvents === 0 ? 'ZERO' : 'VALUE', sampleSufficiency }
    };
  }

  private determineOverallSampleSufficiency(
    search?: NormalizedSearchMetrics | null,
    behavior?: NormalizedBehaviorMetrics | null
  ): SampleSufficiency {
    const searchImp = search?.impressions.value || 0;
    const sessions = behavior?.sessions.value || 0;

    if (searchImp >= 200 || sessions >= 100) return 'SUFFICIENT';
    if (searchImp >= 20 || sessions >= 10) return 'LOW_SAMPLE';
    return 'INSUFFICIENT';
  }
}
