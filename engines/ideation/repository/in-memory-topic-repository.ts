/**
 * NexaMOS In-Memory Topic Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 * Digunakan untuk testing dan proof-of-architecture tanpa mengikat sistem ke database tertentu.
 */

import type { Topic } from '../domain/topic.types.ts';
import type { Result, DomainError } from '../domain/result.ts';
import { ok, err, createDomainError } from '../domain/result.ts';
import type { TopicRepository } from './topic-repository.ts';
import type { TopicQueryParams, TopicQueryResult } from './topic-query.ts';
import { classifyPriority } from '../opportunity-scorer.ts';

export class InMemoryTopicRepository implements TopicRepository {
  private topics: Map<string, Topic> = new Map();
  private slugToId: Map<string, string> = new Map();

  /**
   * Safe deep clone helper to guarantee immutability
   */
  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(topic: Topic): Promise<Result<Topic, DomainError>> {
    if (this.topics.has(topic.id)) {
      return err(
        createDomainError(
          'DUPLICATE_TOPIC_ID',
          `Topic dengan id '${topic.id}' sudah ada di repository.`
        )
      );
    }

    if (this.slugToId.has(topic.slug)) {
      return err(
        createDomainError(
          'DUPLICATE_TOPIC_SLUG',
          `Topic dengan slug '${topic.slug}' sudah ada di repository.`
        )
      );
    }

    const cloned = this.clone(topic);
    this.topics.set(topic.id, cloned);
    this.slugToId.set(topic.slug, topic.id);

    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<Topic | null> {
    const found = this.topics.get(id);
    return found ? this.clone(found) : null;
  }

  async getBySlug(slug: string): Promise<Topic | null> {
    const id = this.slugToId.get(slug);
    if (!id) return null;
    return this.getById(id);
  }

  async existsById(id: string): Promise<boolean> {
    return this.topics.has(id);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.slugToId.has(slug);
  }

  async update(topic: Topic): Promise<Result<Topic, DomainError>> {
    const existing = this.topics.get(topic.id);
    if (!existing) {
      return err(
        createDomainError(
          'TOPIC_NOT_FOUND',
          `Topic dengan id '${topic.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    // Jika slug berubah, periksa keunikan slug baru
    if (existing.slug !== topic.slug) {
      const slugHolderId = this.slugToId.get(topic.slug);
      if (slugHolderId && slugHolderId !== topic.id) {
        return err(
          createDomainError(
            'DUPLICATE_TOPIC_SLUG',
            `Slug baru '${topic.slug}' sudah digunakan oleh topik lain.`
          )
        );
      }
      this.slugToId.delete(existing.slug);
      this.slugToId.set(topic.slug, topic.id);
    }

    const cloned = this.clone(topic);
    this.topics.set(topic.id, cloned);

    return ok(this.clone(cloned));
  }

  async list(query?: TopicQueryParams): Promise<TopicQueryResult> {
    let items = Array.from(this.topics.values());

    if (query) {
      const filter = {
        ...query,
        ...(query.filter || {})
      };

      // 1. Status filter
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        items = items.filter((t) => statuses.includes(t.status));
      }

      // 2. Territory filter
      if (filter.territory) {
        const territories = Array.isArray(filter.territory) ? filter.territory : [filter.territory];
        items = items.filter((t) => territories.includes(t.territory));
      }

      // 3. Editorial role filter
      if (filter.editorialRole) {
        const roles = Array.isArray(filter.editorialRole) ? filter.editorialRole : [filter.editorialRole];
        items = items.filter((t) => t.editorialRole && roles.includes(t.editorialRole));
      }

      // 4. Recommended article type filter
      if (filter.recommendedArticleType) {
        const types = Array.isArray(filter.recommendedArticleType)
          ? filter.recommendedArticleType
          : [filter.recommendedArticleType];
        items = items.filter((t) => types.includes(t.recommendedArticleType));
      }

      // 5. Commodity risk filter
      if (filter.commodityRisk) {
        const risks = Array.isArray(filter.commodityRisk) ? filter.commodityRisk : [filter.commodityRisk];
        items = items.filter((t) => risks.includes(t.informationGain.commodityRisk));
      }

      // 6. Distribution target filter
      if (filter.distributionTarget) {
        const targets = Array.isArray(filter.distributionTarget)
          ? filter.distributionTarget
          : [filter.distributionTarget];
        items = items.filter((t) =>
          t.distributionTargets.some((dt) => targets.includes(dt))
        );
      }

      // 7. Priority class filter
      if (filter.priorityClass) {
        const classes = Array.isArray(filter.priorityClass)
          ? filter.priorityClass
          : [filter.priorityClass];
        items = items.filter((t) => {
          if (t.priority?.overall === undefined || t.priority?.overall === null) return false;
          const pClass = classifyPriority(t.priority.overall);
          return classes.includes(pClass);
        });
      }

      // 8. Date ranges filter
      if (filter.createdFrom) {
        items = items.filter((t) => t.createdAt >= filter.createdFrom!);
      }
      if (filter.createdTo) {
        items = items.filter((t) => t.createdAt <= filter.createdTo!);
      }
      if (filter.updatedFrom) {
        items = items.filter((t) => t.updatedAt >= filter.updatedFrom!);
      }
      if (filter.updatedTo) {
        items = items.filter((t) => t.updatedAt <= filter.updatedTo!);
      }

      // 9. Sorting
      if (query.sort) {
        const { field, direction } = query.sort;
        items.sort((a, b) => {
          let valA: string | number = '';
          let valB: string | number = '';

          switch (field) {
            case 'createdAt':
              valA = a.createdAt;
              valB = b.createdAt;
              break;
            case 'updatedAt':
              valA = a.updatedAt;
              valB = b.updatedAt;
              break;
            case 'title':
              valA = a.title.toLowerCase();
              valB = b.title.toLowerCase();
              break;
            case 'priorityOverall':
              valA = a.priority?.overall ?? -1;
              valB = b.priority?.overall ?? -1;
              break;
          }

          if (valA < valB) return direction === 'ASC' ? -1 : 1;
          if (valA > valB) return direction === 'ASC' ? 1 : -1;
          return 0;
        });
      }
    }

    const total = items.length;
    const limit = query?.pagination?.limit ?? 50;
    const offset = query?.pagination?.offset ?? 0;

    const pagedItems = items.slice(offset, offset + limit).map((t) => this.clone(t));

    return {
      items: pagedItems,
      total,
      limit,
      offset
    };
  }

  // Utility for testing cleanup
  clear(): void {
    this.topics.clear();
    this.slugToId.clear();
  }
}
