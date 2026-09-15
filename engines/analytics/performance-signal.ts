/**
 * NexaMOS Performance Signal Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principles:
 * - SIGNAL ≠ INSIGHT. Sinyal hanyalah bukti empiris dari eksekusi.
 * - Sinyal harus deterministik sejauh mungkin.
 * - Sampel rendah (LOW_SAMPLE / INSUFFICIENT) DILARANG menghasilkan confidence HIGH.
 */

import type { SampleSufficiency } from './analytics-metric.ts';
import type { PerformanceWindow } from './performance-window.ts';

export type PerformanceSignalType =
  | 'SEARCH_IMPRESSIONS_RISING'
  | 'SEARCH_IMPRESSIONS_FALLING'
  | 'HIGH_IMPRESSIONS_LOW_CTR'
  | 'LOW_IMPRESSIONS_HIGH_CTR'
  | 'DISCOVER_VISIBILITY_EMERGING'
  | 'DISCOVER_VISIBILITY_SPIKE'
  | 'DISCOVER_VISIBILITY_DECAY'
  | 'AI_SEARCH_VISIBILITY_EMERGING'
  | 'AI_DISCOVER_VISIBILITY_EMERGING'
  | 'STRONG_ENGAGEMENT'
  | 'WEAK_ENGAGEMENT'
  | 'HIGH_TRAFFIC_LOW_ENGAGEMENT'
  | 'LOW_TRAFFIC_HIGH_ENGAGEMENT'
  | 'CONTENT_DECAY'
  | 'EVERGREEN_STABILITY'
  | 'UPDATE_OPPORTUNITY'
  | 'INTERNAL_LINK_OPPORTUNITY';

export const PERFORMANCE_SIGNAL_TYPES: readonly PerformanceSignalType[] = [
  'SEARCH_IMPRESSIONS_RISING',
  'SEARCH_IMPRESSIONS_FALLING',
  'HIGH_IMPRESSIONS_LOW_CTR',
  'LOW_IMPRESSIONS_HIGH_CTR',
  'DISCOVER_VISIBILITY_EMERGING',
  'DISCOVER_VISIBILITY_SPIKE',
  'DISCOVER_VISIBILITY_DECAY',
  'AI_SEARCH_VISIBILITY_EMERGING',
  'AI_DISCOVER_VISIBILITY_EMERGING',
  'STRONG_ENGAGEMENT',
  'WEAK_ENGAGEMENT',
  'HIGH_TRAFFIC_LOW_ENGAGEMENT',
  'LOW_TRAFFIC_HIGH_ENGAGEMENT',
  'CONTENT_DECAY',
  'EVERGREEN_STABILITY',
  'UPDATE_OPPORTUNITY',
  'INTERNAL_LINK_OPPORTUNITY'
] as const;

export type SignalConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PerformanceSignal {
  id: string;
  articleId: string;
  signalType: PerformanceSignalType;
  confidence: SignalConfidence;
  window: PerformanceWindow;
  sampleSufficiency: SampleSufficiency;
  metricsObserved: Record<string, any>;
  description: string;
  context?: {
    comparisonWindowType?: string;
    percentageDelta?: number;
    baselineComparison?: string;
    hasProviderAnomaly?: boolean;
  };
  detectedAt: string; // ISO 8601
}
