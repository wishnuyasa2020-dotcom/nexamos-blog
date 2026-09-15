/**
 * NexaMOS Article Draft Model
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Naskah draft artikel yang dihasilkan oleh Editorial Generator.
 */

import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';
import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleSection } from './article-section.ts';
import type { ClaimUsage } from './claim-usage.ts';
import type { CitationMapEntry } from './citation-map.ts';

export type DraftStatus =
  | 'GENERATED'
  | 'GROUNDING_REVIEW_REQUIRED'
  | 'READY_FOR_EDITORIAL_REVIEW'
  | 'REJECTED';

export const DRAFT_STATUSES: readonly DraftStatus[] = [
  'GENERATED',
  'GROUNDING_REVIEW_REQUIRED',
  'READY_FOR_EDITORIAL_REVIEW',
  'REJECTED'
] as const;

export interface ArticleDraft {
  id: string;
  topicId: string;
  researchProjectId: string;

  title: string;
  dek?: string | null;
  slug?: string | null;

  territory: Territory;
  articleType: ArticleType;
  editorialRole: EditorialRole;

  thesis: string;
  editorialAngle: string;

  sections: ArticleSection[];

  claimUsages: ClaimUsage[];
  citationMap: CitationMapEntry[];

  status: DraftStatus;

  generatedAt: string; // ISO 8601
  generatorVersion: string;
  promptVersion: string;
  reviewNotes?: string[];
}
