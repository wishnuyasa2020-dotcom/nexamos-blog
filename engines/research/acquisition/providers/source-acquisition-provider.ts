/**
 * NexaMOS Source Acquisition Provider Contract
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Interface standar untuk provider pengambil material konten mentah (HTTP, Mock, Connected, dll).
 */

import type { SourceCandidate } from '../source-candidate.ts';
import type { RawSourceInput } from '../../ingestion/source-ingestion.ts';
import type { AcquisitionOptions } from '../source-acquisition.ts';
import type { Result, ResearchDomainError } from '../../domain/research-result.ts';

export interface SourceAcquisitionProvider {
  readonly providerName: string;
  acquire(
    candidate: SourceCandidate,
    options?: AcquisitionOptions
  ): Promise<Result<RawSourceInput, ResearchDomainError>>;
}
