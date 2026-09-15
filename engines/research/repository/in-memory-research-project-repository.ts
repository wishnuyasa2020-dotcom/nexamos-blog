/**
 * NexaMOS In-Memory Research Project Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchProject } from '../domain/research-project.ts';
import type { ResearchProjectRepository } from './research-project-repository.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';

export class InMemoryResearchProjectRepository implements ResearchProjectRepository {
  private projects = new Map<string, ResearchProject>();

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(project: ResearchProject): Promise<Result<ResearchProject, ResearchDomainError>> {
    if (this.projects.has(project.id)) {
      return err(
        createResearchDomainError(
          'DUPLICATE_PROJECT_ID',
          `Proyek riset dengan id '${project.id}' sudah terdaftar.`
        )
      );
    }

    const cloned = this.clone(project);
    this.projects.set(project.id, cloned);
    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<ResearchProject | null> {
    const found = this.projects.get(id);
    return found ? this.clone(found) : null;
  }

  async listByTopicId(topicId: string): Promise<ResearchProject[]> {
    return Array.from(this.projects.values())
      .filter((p) => p.topicId === topicId)
      .map((p) => this.clone(p));
  }

  async update(project: ResearchProject): Promise<Result<ResearchProject, ResearchDomainError>> {
    if (!this.projects.has(project.id)) {
      return err(
        createResearchDomainError(
          'PROJECT_NOT_FOUND',
          `Proyek riset dengan id '${project.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    const cloned = this.clone(project);
    this.projects.set(project.id, cloned);
    return ok(this.clone(cloned));
  }

  async existsById(id: string): Promise<boolean> {
    return this.projects.has(id);
  }

  clear(): void {
    this.projects.clear();
  }
}
