/**
 * NexaMOS Topic Article Relation Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 */

import type { TopicArticleRelation } from '../domain/topic-article-relation.ts';

export interface TopicArticleRelationRepository {
  add(relation: TopicArticleRelation): Promise<TopicArticleRelation>;
  listByTopicId(topicId: string): Promise<TopicArticleRelation[]>;
  listByArticleId(articleId: string): Promise<TopicArticleRelation[]>;
  exists(topicId: string, articleId: string): Promise<boolean>;
}
