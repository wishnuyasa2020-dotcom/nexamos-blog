/**
 * NexaMOS Topic Repository Contract
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 * Abstraksi persistence murni untuk Topic entity (tanpa business logic kualifikasi/scoring).
 */

import type { Topic } from '../domain/topic.types.ts';
import type { Result, DomainError } from '../domain/result.ts';
import type { TopicQueryParams, TopicQueryResult } from './topic-query.ts';

export interface TopicRepository {
  create(topic: Topic): Promise<Result<Topic, DomainError>>;
  getById(id: string): Promise<Topic | null>;
  getBySlug(slug: string): Promise<Topic | null>;
  list(query?: TopicQueryParams): Promise<TopicQueryResult>;
  update(topic: Topic): Promise<Result<Topic, DomainError>>;
  existsById(id: string): Promise<boolean>;
  existsBySlug(slug: string): Promise<boolean>;
}
