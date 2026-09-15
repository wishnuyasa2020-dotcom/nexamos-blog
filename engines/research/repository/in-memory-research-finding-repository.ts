/**
 * NexaMOS In-Memory Research Finding Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchFinding } from '../domain/research-finding.ts';
import type { ResearchFindingRepository } from './research-finding-repository.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';

export class InMemoryResearchFindingRepository implements ResearchFindingRepository {
  private findings = new Map<string, ResearchFinding>();

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(finding: ResearchFinding): Promise<Result<ResearchFinding, ResearchDomainError>> {
    if (this.findings.has(finding.id)) {
      return err(
        createResearchDomainError(
          'VALIDATION_FAILED',
          `Temuan riset dengan id '${finding.id}' sudah terdaftar.`
        )
      );
    }

    const cloned = this.clone(finding);
    this.findings.set(finding.id, cloned);
    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<ResearchFinding | null> {
    const found = this.findings.get(id);
    return found ? this.clone(found) : null;
  }

  async listByProjectId(projectId: string): Promise<ResearchFinding[]> {
    return Array.from(this.findings.values())
      .filter((f) => f.researchProjectId === projectId)
      .map((f) => this.clone(f));
  }

  async update(finding: ResearchFinding): Promise<Result<ResearchFinding, ResearchDomainError>> {
    if (!this.findings.has(finding.id)) {
      return err(
        createResearchDomainError(
          'FINDING_NOT_FOUND',
          `Temuan riset dengan id '${finding.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    const cloned = this.clone(finding);
    this.findings.set(finding.id, cloned);
    return ok(this.clone(cloned));
  }

  async existsById(id: string): Promise<boolean> {
    return this.findings.has(id);
  }

  clear(): void {
    this.findings.clear();
  }
}
