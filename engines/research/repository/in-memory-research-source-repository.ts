/**
 * NexaMOS In-Memory Research Source Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchSource } from '../domain/research-source.ts';
import type { ResearchSourceRepository } from './research-source-repository.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';

export class InMemoryResearchSourceRepository implements ResearchSourceRepository {
  private sources = new Map<string, ResearchSource>();

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(source: ResearchSource): Promise<Result<ResearchSource, ResearchDomainError>> {
    if (this.sources.has(source.id)) {
      return err(
        createResearchDomainError(
          'DUPLICATE_SOURCE_ID',
          `Sumber riset dengan id '${source.id}' sudah terdaftar.`
        )
      );
    }

    const cloned = this.clone(source);
    this.sources.set(source.id, cloned);
    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<ResearchSource | null> {
    const found = this.sources.get(id);
    return found ? this.clone(found) : null;
  }

  async listByProjectId(projectId: string): Promise<ResearchSource[]> {
    return Array.from(this.sources.values())
      .filter((s) => s.researchProjectId === projectId)
      .map((s) => this.clone(s));
  }

  async update(source: ResearchSource): Promise<Result<ResearchSource, ResearchDomainError>> {
    if (!this.sources.has(source.id)) {
      return err(
        createResearchDomainError(
          'SOURCE_NOT_FOUND',
          `Sumber riset dengan id '${source.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    const cloned = this.clone(source);
    this.sources.set(source.id, cloned);
    return ok(this.clone(cloned));
  }

  async existsById(id: string): Promise<boolean> {
    return this.sources.has(id);
  }

  clear(): void {
    this.sources.clear();
  }
}
