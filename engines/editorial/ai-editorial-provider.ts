/**
 * NexaMOS AI Editorial Provider Contract
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Antarmuka provider-agnostic untuk penalaran perencanaan editorial dan penulisan naskah artikel.
 */

import type { EditorialGenerationRequest } from './editorial-generation-request.ts';
import type { EditorialPlan } from './editorial-plan.ts';
import type { ArticleSection } from './article-section.ts';
import type { ClaimUsage } from './claim-usage.ts';
import type { CitationMapEntry } from './citation-map.ts';

export interface GeneratedDraftPayload {
  title: string;
  dek?: string | null;
  slug?: string | null;
  thesis: string;
  editorialAngle: string;
  sections: ArticleSection[];
  claimUsages: ClaimUsage[];
  citationMap: CitationMapEntry[];
  generatorVersion?: string;
  promptVersion?: string;
}

export interface AIEditorialProvider {
  /**
   * Merumuskan rencana editorial terstruktur dari Topic & ResearchBrief
   */
  createEditorialPlan(request: EditorialGenerationRequest): Promise<EditorialPlan>;

  /**
   * Menghasilkan draft artikel lengkap berdasarkan EditorialPlan yang disetujui
   */
  generateArticleDraft(
    request: EditorialGenerationRequest,
    plan: EditorialPlan
  ): Promise<GeneratedDraftPayload>;

  /**
   * Opsional: Merevisi seksi naskah tertentu sesuai instruksi editor
   */
  reviseSection?(
    request: EditorialGenerationRequest,
    section: ArticleSection,
    instruction: string
  ): Promise<ArticleSection>;
}
