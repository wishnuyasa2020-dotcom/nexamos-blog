/**
 * NexaMOS Publication Event Log Models & Logger
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Mencatat seluruh siklus hidup publikasi secara deterministik tanpa private AI reasoning.
 */

export type PublicationEventType =
  | 'PUBLICATION_PACKAGING_STARTED'
  | 'PUBLICATION_PACKAGE_CREATED'
  | 'PUBLICATION_PREFLIGHT_STARTED'
  | 'PUBLICATION_PREFLIGHT_PASSED'
  | 'PUBLICATION_PREFLIGHT_FAILED'
  | 'PUBLICATION_RELEASE_REQUESTED'
  | 'PUBLICATION_PUBLISHED'
  | 'PUBLICATION_FAILED'
  | 'PUBLICATION_UNPUBLISHED'
  | 'PUBLICATION_ARCHIVED';

export interface PublicationEventRecord {
  id: string;
  publicationId: string;
  articleId: string;
  event: PublicationEventType;
  timestamp: string; // ISO 8601
  actor: string;
  summary: string;
  metadata?: Record<string, any>;
}

export class PublicationEventLogger {
  private readonly events: PublicationEventRecord[] = [];

  public log(params: {
    publicationId: string;
    articleId: string;
    event: PublicationEventType;
    actor?: string;
    summary: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }): PublicationEventRecord {
    const record: PublicationEventRecord = {
      id: `pub-ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      publicationId: params.publicationId,
      articleId: params.articleId,
      event: params.event,
      timestamp: params.timestamp || new Date().toISOString(),
      actor: params.actor || 'System Publisher',
      summary: params.summary,
      metadata: params.metadata
    };

    this.events.push(record);
    return record;
  }

  public getEvents(publicationId?: string): PublicationEventRecord[] {
    if (!publicationId) return [...this.events];
    return this.events.filter((e) => e.publicationId === publicationId);
  }
}
