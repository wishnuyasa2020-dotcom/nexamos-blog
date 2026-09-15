/**
 * NexaMOS Mock Source Acquisition Provider
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Mengembalikan payload RawSourceInput untuk pengujian tanpa jaringan eksternal.
 */

import type { SourceAcquisitionProvider } from './source-acquisition-provider.ts';
import type { SourceCandidate } from '../source-candidate.ts';
import type { RawSourceInput } from '../../ingestion/source-ingestion.ts';
import type { AcquisitionOptions } from '../source-acquisition.ts';
import type { Result, ResearchDomainError } from '../../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../../domain/research-result.ts';

export class MockSourceAcquisitionProvider implements SourceAcquisitionProvider {
  readonly providerName = 'MockSourceAcquisitionProvider';

  private contentMap = new Map<string, RawSourceInput>();

  registerMockContent(urlOrId: string, rawInput: RawSourceInput): void {
    this.contentMap.set(urlOrId.trim(), rawInput);
  }

  async acquire(
    candidate: SourceCandidate,
    options?: AcquisitionOptions
  ): Promise<Result<RawSourceInput, ResearchDomainError>> {
    // Cek berdasarkan ID kandidat atau URL
    if (this.contentMap.has(candidate.id)) {
      const match = this.contentMap.get(candidate.id)!;
      return ok({
        ...match,
        researchProjectId: candidate.researchProjectId,
        title: candidate.title || match.title,
        url: candidate.url || match.url
      });
    }

    if (this.contentMap.has(candidate.url)) {
      const match = this.contentMap.get(candidate.url)!;
      return ok({
        ...match,
        researchProjectId: candidate.researchProjectId,
        title: candidate.title || match.title,
        url: candidate.url || match.url
      });
    }

    // Default mock response sintetis jika tidak didaftarkan spesifik
    const defaultRaw: RawSourceInput = {
      researchProjectId: candidate.researchProjectId,
      sourceType: candidate.sourceType || 'INDUSTRY_RESEARCH',
      format: 'PLAIN_TEXT',
      title: candidate.title,
      url: candidate.url,
      publisher: candidate.publisher || 'Mock Publisher',
      author: candidate.author || 'Mock Author',
      publicationDate: candidate.publicationDate || new Date().toISOString().split('T')[0],
      language: 'en',
      content: `Material mentah terakuisisi untuk '${candidate.title}'. Berisi temuan riset faktual dan data observasi dari ${candidate.provider}.`
    };

    return ok(defaultRaw);
  }

  clear(): void {
    this.contentMap.clear();
  }
}
