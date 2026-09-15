/**
 * NexaMOS Mock Research Discovery Provider
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Digunakan untuk pengujian deterministic offline tanpa API eksternal.
 */

import type { ResearchDiscoveryProvider } from './research-discovery-provider.ts';
import type { DiscoveryQuery } from '../source-discovery.ts';
import type { SourceCandidate } from '../source-candidate.ts';

export class MockResearchDiscoveryProvider implements ResearchDiscoveryProvider {
  readonly providerName = 'MockResearchDiscoveryProvider';
  readonly providerVersion = '1.0.0';

  private queryResultMap = new Map<string, SourceCandidate[]>();
  private defaultResults: SourceCandidate[] = [];

  registerResults(querySubstring: string, candidates: SourceCandidate[]): void {
    this.queryResultMap.set(querySubstring.toLowerCase().trim(), candidates);
  }

  setDefaultResults(candidates: SourceCandidate[]): void {
    this.defaultResults = candidates;
  }

  async search(query: DiscoveryQuery): Promise<SourceCandidate[]> {
    const qLower = query.query.toLowerCase().trim();

    for (const [key, candidates] of this.queryResultMap.entries()) {
      if (qLower.includes(key)) {
        return candidates.map((c) => ({
          ...c,
          queryId: query.id,
          researchProjectId: query.researchProjectId,
          discoveredAt: new Date().toISOString()
        }));
      }
    }

    return this.defaultResults.map((c) => ({
      ...c,
      queryId: query.id,
      researchProjectId: query.researchProjectId,
      discoveredAt: new Date().toISOString()
    }));
  }

  clear(): void {
    this.queryResultMap.clear();
    this.defaultResults = [];
  }
}
