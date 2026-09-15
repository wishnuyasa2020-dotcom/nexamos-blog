/**
 * NexaMOS Internal Link Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 */

export interface InternalLinkCandidate {
  targetArticleId: string;
  targetTitle: string;
  targetSlug: string;
  targetTopicId: string;
  relevanceScore: number; // 0 - 100
  suggestedAnchorText: string;
  sourceSectionId?: string | null;
  targetUrl: string;
}

export interface ExistingArticleIndexItem {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  url: string;
  territory?: string;
  status?: string;
  summary?: string;
  keyConcepts?: string[];
}
