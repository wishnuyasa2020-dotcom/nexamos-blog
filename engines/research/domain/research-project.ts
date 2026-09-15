/**
 * NexaMOS Canonical Research Project Entity
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 2A specifications
 * Definition: Proyek investigasi/riset yang mengumpulkan sumber, mengekstraksi
 * evidence, dan memverifikasi claims untuk satu Topic editorial tertentu.
 * Relasi: 1 Topic -> N ResearchProjects.
 */

import type { ResearchStatus } from './research-status.ts';
import type { ResearchQuestion } from './research-question.ts';
import type { EvidenceLevel } from '../../ideation/domain/evidence-level.ts';

export interface ResearchProject {
  id: string;
  topicId: string;
  title: string;
  objective: string;
  researchQuestions: ResearchQuestion[];
  status: ResearchStatus;
  requiredEvidenceLevel: EvidenceLevel;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export type CreateResearchProjectInput = Omit<
  ResearchProject,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'completedAt'
> & {
  id?: string;
  status?: ResearchStatus;
};

export type UpdateResearchProjectInput = Partial<
  Omit<ResearchProject, 'id' | 'topicId' | 'createdAt'>
>;
