/**
 * NexaMOS In-Memory Research Evidence Repository Implementation
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 */

import type { ResearchEvidence } from '../domain/research-evidence.ts';
import type { ResearchEvidenceRepository } from './research-evidence-repository.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';

export class InMemoryResearchEvidenceRepository implements ResearchEvidenceRepository {
  private evidence = new Map<string, ResearchEvidence>();

  private clone<T>(item: T): T {
    return structuredClone(item);
  }

  async create(evidence: ResearchEvidence): Promise<Result<ResearchEvidence, ResearchDomainError>> {
    if (this.evidence.has(evidence.id)) {
      return err(
        createResearchDomainError(
          'DUPLICATE_EVIDENCE_ID',
          `Bukti riset dengan id '${evidence.id}' sudah terdaftar.`
        )
      );
    }

    const cloned = this.clone(evidence);
    this.evidence.set(evidence.id, cloned);
    return ok(this.clone(cloned));
  }

  async getById(id: string): Promise<ResearchEvidence | null> {
    const found = this.evidence.get(id);
    return found ? this.clone(found) : null;
  }

  async listByProjectId(projectId: string): Promise<ResearchEvidence[]> {
    return Array.from(this.evidence.values())
      .filter((e) => e.researchProjectId === projectId)
      .map((e) => this.clone(e));
  }

  async listBySourceId(sourceId: string): Promise<ResearchEvidence[]> {
    return Array.from(this.evidence.values())
      .filter((e) => e.sourceId === sourceId)
      .map((e) => this.clone(e));
  }

  async update(evidence: ResearchEvidence): Promise<Result<ResearchEvidence, ResearchDomainError>> {
    if (!this.evidence.has(evidence.id)) {
      return err(
        createResearchDomainError(
          'EVIDENCE_NOT_FOUND',
          `Bukti riset dengan id '${evidence.id}' tidak ditemukan untuk diperbarui.`
        )
      );
    }

    const cloned = this.clone(evidence);
    this.evidence.set(evidence.id, cloned);
    return ok(this.clone(cloned));
  }

  async existsById(id: string): Promise<boolean> {
    return this.evidence.has(id);
  }

  clear(): void {
    this.evidence.clear();
  }
}
