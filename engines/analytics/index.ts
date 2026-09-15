/**
 * NexaMOS Analytics Engine - Phase 7 Canonical Exports
 *
 * Closing the NexaMOS loop:
 * PUBLISH → MARKET RESPONSE → SIGNAL → ANALYSIS → LEARNING → RECOMMENDATION → NEXT EDITORIAL CYCLE
 */

export * from './analytics-source.ts';
export * from './analytics-metric.ts';
export * from './performance-window.ts';
export * from './performance-snapshot.ts';
export * from './performance-signal.ts';
export * from './performance-diagnosis.ts';
export * from './content-learning.ts';
export * from './feedback-action.ts';

export * from './analytics-normalizer.ts';
export * from './signal-detector.ts';
export * from './performance-diagnosis-service.ts';
export * from './learning-engine.ts';
export * from './feedback-router.ts';
export * from './analytics-service.ts';

export * from './providers/analytics-provider.contract.ts';
export * from './providers/article-identity-resolver.ts';
export * from './providers/google-search-provider.ts';
export * from './providers/google-discover-provider.ts';
export * from './providers/generative-ai-search-provider.ts';
export * from './providers/generative-ai-discover-provider.ts';
export * from './providers/generative-ai-import-provider.ts';
export * from './providers/ga4-analytics-provider.ts';
export * from './providers/internal-event-provider.ts';

export * from './repository/analytics-repository.ts';
