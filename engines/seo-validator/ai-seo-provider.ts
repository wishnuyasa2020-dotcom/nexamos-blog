/**
 * NexaMOS AI SEO Provider Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * AI diperbolehkan menyarankan alternatif judul, deskripsi cuplikan, teks jangkar, dan istilah semantik terkait.
 * AI DILARANG KERAS mengarang search volume, peringkat, data kompetitor, keyword difficulty, atau informasi SERP tanpa data eksternal terverifikasi.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';

export interface TitleSuggestionRequest {
  draft: ArticleDraft;
  topic?: Topic | null;
  count?: number;
}

export interface TitleSuggestion {
  suggestedTitle: string;
  angle: string;
  rationale: string;
}

export interface DescriptionSuggestionRequest {
  draft: ArticleDraft;
  topic?: Topic | null;
}

export interface DescriptionSuggestion {
  suggestedDescription: string;
  characterCount: number;
  rationale: string;
}

export interface InternalLinkSuggestionRequest {
  draft: ArticleDraft;
  availableArticleTitles: string[];
}

export interface InternalLinkAnchorSuggestion {
  targetTitle: string;
  recommendedAnchor: string;
  sectionId?: string;
  contextSnippet?: string;
}

export interface AISEOReviewProvider {
  suggestTitles(request: TitleSuggestionRequest): Promise<TitleSuggestion[]>;
  suggestDescription(request: DescriptionSuggestionRequest): Promise<DescriptionSuggestion>;
  suggestInternalLinkAnchors(
    request: InternalLinkSuggestionRequest
  ): Promise<InternalLinkAnchorSuggestion[]>;
}
