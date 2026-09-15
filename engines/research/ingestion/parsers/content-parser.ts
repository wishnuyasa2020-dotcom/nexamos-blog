/**
 * NexaMOS Content Parser Contract
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 */

import type { RawSourceInput, NormalizedSourceDocument } from '../source-ingestion.ts';

export interface ContentParser {
  canParse(format: string): boolean;
  parse(input: RawSourceInput): Promise<NormalizedSourceDocument>;
}
