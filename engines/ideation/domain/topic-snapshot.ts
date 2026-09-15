/**
 * NexaMOS Topic Snapshot (Read Model)
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 * Read model terpadu untuk inspeksi status topik, hasil kualifikasi, prioritas, relasi artikel, dan event terakhir.
 */

import type { Topic, TopicPriority, TopicQualificationResult } from './topic.types.ts';
import type { TopicArticleRelation } from './topic-article-relation.ts';
import type { TopicEvent } from './topic-event.ts';

export interface TopicSnapshot {
  topic: Topic;
  qualification?: TopicQualificationResult | null;
  priority?: TopicPriority | null;
  articleRelations: TopicArticleRelation[];
  lastEvent?: TopicEvent | null;
}
