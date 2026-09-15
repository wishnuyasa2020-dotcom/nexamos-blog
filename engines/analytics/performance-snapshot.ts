/**
 * NexaMOS Performance Snapshot & Baseline Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principle:
 * - Differentiate COMPLETE, PARTIAL, DELAYED, THRESHOLDED, UNKNOWN.
 * - Multi-dimensional Scorecard: No single artificial "content success score" as truth.
 */

import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';
import type { AnalyticsDataAnomaly } from './analytics-source.ts';
import type {
  NormalizedSearchMetrics,
  NormalizedDiscoverMetrics,
  NormalizedGenerativeAISearchMetrics,
  NormalizedGenerativeAIDiscoverMetrics,
  NormalizedBehaviorMetrics,
  SampleSufficiency
} from './analytics-metric.ts';
import type { PerformanceWindow } from './performance-window.ts';

/**
 * Kelengkapan data analitik yang terkumpul
 */
export type DataCompletenessStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'DELAYED'
  | 'THRESHOLDED'
  | 'UNKNOWN';

export const DATA_COMPLETENESS_STATUSES: readonly DataCompletenessStatus[] = [
  'COMPLETE',
  'PARTIAL',
  'DELAYED',
  'THRESHOLDED',
  'UNKNOWN'
] as const;

/**
 * Snapshot performa artikel untuk rentang waktu tertentu
 */
export interface ArticlePerformanceSnapshot {
  id: string;
  articleId: string;
  publicationId: string;
  topicId: string;
  slug: string;

  window: PerformanceWindow;

  // Dimensi Taksonomi Konten untuk Segmentasi Baseline
  territory: Territory;
  articleType: ArticleType;
  editorialRole?: EditorialRole | null;

  // Metrik Performa per Kanal
  search?: NormalizedSearchMetrics | null;
  discover?: NormalizedDiscoverMetrics | null;
  generativeAISearch?: NormalizedGenerativeAISearchMetrics | null;
  generativeAIDiscover?: NormalizedGenerativeAIDiscoverMetrics | null;
  behavior?: NormalizedBehaviorMetrics | null;

  // Observabilitas & Integritas Data
  dataCompleteness: DataCompletenessStatus;
  overallSampleSufficiency: SampleSufficiency;
  anomaliesDetected: AnalyticsDataAnomaly[];

  createdAt: string; // ISO 8601
}

/**
 * Baseline performa berbasis kohort (Cohort Baseline)
 * Digunakan sebagai pembanding kontekstual, bukan rata-rata global mentah
 */
export interface PerformanceBaseline {
  id: string;
  territory: Territory;
  articleType: ArticleType;
  editorialRole?: EditorialRole | null;
  windowType: string;

  benchmarks: {
    medianSearchImpressions?: number;
    medianSearchCTR?: number;
    medianEngagementTimeSeconds?: number;
    medianEngagementRate?: number;
  };

  sampleArticleCount: number;
  updatedAt: string; // ISO 8601
}

/**
 * Scorecard Performa Multi-Dimensi
 * Setiap dimensi berdiri sendiri; tidak digabungkan menjadi skor numerik tunggal yang menyesatkan.
 */
export interface ArticlePerformanceScorecard {
  articleId: string;
  window: PerformanceWindow;
  dimensions: {
    searchVisibility: 'EMERGING' | 'ESTABLISHED' | 'STRONG' | 'DECLINING' | 'INSUFFICIENT_DATA';
    discoverVisibility: 'ACTIVE' | 'THRESHOLDED' | 'NOT_APPEARING' | 'INSUFFICIENT_DATA';
    aiVisibility: 'DETECTED' | 'NOT_DETECTED' | 'GROWING' | 'INSUFFICIENT_DATA';
    engagementQuality: 'DEEP' | 'BALANCED' | 'SHALLOW' | 'INSUFFICIENT_DATA';
    contentLongevity: 'EVERGREEN' | 'TIMELY_SPIKE' | 'DECAYING' | 'STABLE';
  };
  sampleSufficiency: SampleSufficiency;
  notes: string[];
}

/**
 * Agregasi Performa Klaster Pengetahuan & Teritori
 */
export interface KnowledgeClusterPerformance {
  territory: Territory;
  clusterName?: string;
  articleCount: number;
  aggregateImpressions: number;
  averageEngagementRate: number;
  dominantChannels: string[];
  lastEvaluatedAt: string;
}
