/**
 * NexaMOS Topic Generator Contract
 *
 * Mengelola ideation intake dan pembuatan kandidat topik (TopicCandidate)
 * dari berbagai sumber sinyal pasar dan intelektual internal.
 */

import { Territory } from './domain/territory';
import { ArticleType } from './domain/article-type';
import { DistributionTarget } from './domain/distribution-target';
import { EvidenceLevel } from './domain/evidence-level';
import { OriginalityType, CommodityRisk } from './domain/originality-type';

/**
 * Extensible canonical signal/intake source types
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 (Section 15)
 */
export type KnownTopicSourceType =
  | 'SEARCH_DEMAND'
  | 'SEARCH_CONSOLE'
  | 'SOCIAL_SIGNAL'
  | 'CRM_QUESTION'
  | 'SALES_OBJECTION'
  | 'CUSTOMER_QUESTION'
  | 'COMPETITOR_MOVEMENT'
  | 'REGULATION'
  | 'MARKET_EVENT'
  | 'PRODUCT_DATA'
  | 'INTERNAL_EXPERIMENT'
  | 'FOUNDER_INSIGHT'
  | 'FRAMEWORK_DEVELOPMENT'
  | 'RESEARCH_PAPER'
  | 'INDUSTRY_REPORT'
  | 'AI_SEARCH_TREND'
  | 'MANUAL';

export type TopicSourceType = KnownTopicSourceType | (string & {});

export interface TopicSignalSource {
  sourceType: TopicSourceType;
  rawSignal: string;
  sourceReferenceUrl?: string;
  capturedAt: string; // ISO 8601 string
  metadata?: Record<string, unknown>;
}

export interface TopicGenerationContext {
  targetTerritory?: Territory;
  signalSources: TopicSignalSource[];
  marketObservation?: string;
  audienceContext?: {
    segment?: string;
    jobToBeDone?: string;
  };
  constraints?: {
    minEvidenceLevel?: EvidenceLevel;
    requiredDistribution?: DistributionTarget[];
    preferredArticleTypes?: ArticleType[];
  };
}

export interface TopicCandidate {
  candidateId: string;
  title: string;
  suggestedSlug: string;
  territory: Territory;
  problem: string;
  intent: {
    primary: string;
    secondary?: string[];
  };
  provisionalThesis?: string | null;
  whyNow?: string | null;
  expectedContribution: string;
  suggestedOriginalityTypes: OriginalityType[];
  commodityRisk: CommodityRisk;
  recommendedArticleType: ArticleType;
  primaryDistributionTargets: DistributionTarget[];
  sourceSignalSummary: string;
}

export type TopicGenerationStatus = 'SUCCESS' | 'NOT_IMPLEMENTED' | 'FAILED';

export interface TopicGenerationResult {
  status: TopicGenerationStatus;
  contextSummary?: string;
  candidates: TopicCandidate[];
  error?: string;
}

export interface ITopicGenerator {
  generateCandidates(context: TopicGenerationContext): Promise<TopicGenerationResult>;
}

/**
 * Pure contract function for topic candidate generation.
 *
 * NOTE: Phase 1A provides the type-safe contract interface.
 * Automated heuristic / AI candidate generation will be implemented in subsequent phases.
 */
export async function generateTopicCandidates(
  context: TopicGenerationContext
): Promise<TopicGenerationResult> {
  if (!context.signalSources || context.signalSources.length === 0) {
    return {
      status: 'FAILED',
      candidates: [],
      error: 'AT_LEAST_ONE_SIGNAL_SOURCE_REQUIRED'
    };
  }

  return {
    status: 'NOT_IMPLEMENTED',
    contextSummary: `Received ${context.signalSources.length} signal source(s).`,
    candidates: []
  };
}
