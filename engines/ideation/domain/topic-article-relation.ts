/**
 * NexaMOS Topic to Article Relation Domain Model
 *
 * Mendukung kardinalitas 1 Topic -> N Articles:
 * Satu topik dapat melahirkan beberapa artikel dengan sudut pandang dan format berbeda.
 */

export type TopicArticleRelationType =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'FOLLOW_UP'
  | 'UPDATE'
  | 'DERIVATIVE';

export const TOPIC_ARTICLE_RELATION_TYPES: readonly TopicArticleRelationType[] = [
  'PRIMARY',
  'SUPPORTING',
  'FOLLOW_UP',
  'UPDATE',
  'DERIVATIVE'
] as const;

export interface TopicArticleRelation {
  topicId: string;
  articleId: string;
  relationType: TopicArticleRelationType;
  createdAt: string; // ISO 8601 string
  notes?: string | null;
}
