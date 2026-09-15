/**
 * NexaMOS In-Memory Topic Article Relation Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 */

import type { TopicArticleRelation } from '../domain/topic-article-relation.ts';
import type { TopicArticleRelationRepository } from './topic-article-relation-repository.ts';

export class InMemoryTopicArticleRelationRepository
  implements TopicArticleRelationRepository
{
  private relations: TopicArticleRelation[] = [];

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async add(relation: TopicArticleRelation): Promise<TopicArticleRelation> {
    const existing = this.relations.find(
      (r) => r.topicId === relation.topicId && r.articleId === relation.articleId
    );

    if (existing) {
      existing.relationType = relation.relationType;
      existing.createdAt = relation.createdAt;
      return this.clone(existing);
    }

    const cloned = this.clone(relation);
    this.relations.push(cloned);
    return this.clone(cloned);
  }

  async listByTopicId(topicId: string): Promise<TopicArticleRelation[]> {
    return this.relations
      .filter((r) => r.topicId === topicId)
      .map((r) => this.clone(r));
  }

  async listByArticleId(articleId: string): Promise<TopicArticleRelation[]> {
    return this.relations
      .filter((r) => r.articleId === articleId)
      .map((r) => this.clone(r));
  }

  async exists(topicId: string, articleId: string): Promise<boolean> {
    return this.relations.some(
      (r) => r.topicId === topicId && r.articleId === articleId
    );
  }

  clear(): void {
    this.relations = [];
  }
}
