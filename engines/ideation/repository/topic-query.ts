/**
 * NexaMOS Topic Query Model
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 */

import type {
  Topic,
  TopicLifecycleStatus,
  Territory,
  EditorialRole,
  ArticleType,
  PriorityClass,
  DistributionTarget,
  CommodityRisk
} from '../domain/topic.types.ts';

export interface TopicQueryFilter {
  status?: TopicLifecycleStatus | TopicLifecycleStatus[];
  territory?: Territory | Territory[];
  editorialRole?: EditorialRole | EditorialRole[];
  recommendedArticleType?: ArticleType | ArticleType[];
  priorityClass?: PriorityClass | PriorityClass[];
  distributionTarget?: DistributionTarget | DistributionTarget[];
  commodityRisk?: CommodityRisk | CommodityRisk[];
  createdFrom?: string; // ISO 8601 string
  createdTo?: string; // ISO 8601 string
  updatedFrom?: string; // ISO 8601 string
  updatedTo?: string; // ISO 8601 string
}

export type TopicSortField = 'createdAt' | 'updatedAt' | 'priorityOverall' | 'title';
export type SortDirection = 'ASC' | 'DESC';

export interface TopicQuerySort {
  field: TopicSortField;
  direction: SortDirection;
}

export interface TopicPagination {
  limit?: number;
  offset?: number;
}

export interface TopicQueryParams extends TopicQueryFilter {
  filter?: TopicQueryFilter;
  sort?: TopicQuerySort;
  pagination?: TopicPagination;
}

export interface TopicQueryResult {
  items: Topic[];
  total: number;
  limit: number;
  offset: number;
}
