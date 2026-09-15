/**
 * NexaMOS Research Discovery Provider Contract
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Interface standar untuk provider penemuan sumber eksternal (Google, Bing, Mock, dll).
 */

import type { DiscoveryQuery } from '../source-discovery.ts';
import type { SourceCandidate } from '../source-candidate.ts';

export interface ResearchDiscoveryProvider {
  readonly providerName: string;
  readonly providerVersion: string;
  search(query: DiscoveryQuery): Promise<SourceCandidate[]>;
}
