/**
 * NexaMOS Editorial Role
 *
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 & Phase 1B specifications:
 * - FLAGSHIP: Konten pilar kategori, riset orisinal, atau doktrin inti dengan standar pembuktian tertinggi.
 * - AUTHORITY: Analisis ahli, sintesis strategis, atau sudut pandang kuat pembangun otoritas.
 * - SUPPORTING: Konten penjelas, klaster topik, atau prasyarat pemahaman arsitektur topik.
 * - REFERENCE: Glosarium, definisi dasar, atau materi rujukan cepat.
 */

export type EditorialRole = 'FLAGSHIP' | 'AUTHORITY' | 'SUPPORTING' | 'REFERENCE';

export const EDITORIAL_ROLES: readonly EditorialRole[] = [
  'FLAGSHIP',
  'AUTHORITY',
  'SUPPORTING',
  'REFERENCE'
] as const;

export interface EditorialRoleDefinition {
  role: EditorialRole;
  label: string;
  description: string;
  isCommodityExemptionEligible: boolean;
}

export const EDITORIAL_ROLE_DEFINITIONS: Record<EditorialRole, EditorialRoleDefinition> = {
  FLAGSHIP: {
    role: 'FLAGSHIP',
    label: 'Flagship Intellectual Property',
    description: 'Aset pembeda kategori berbasis original research, data primer, atau doktrin NexaMOS.',
    isCommodityExemptionEligible: false
  },
  AUTHORITY: {
    role: 'AUTHORITY',
    label: 'Thought Leadership & Authority',
    description: 'Analisis mendalam, sintesis lintas teori, dan sudut pandang tajam terverifikasi.',
    isCommodityExemptionEligible: false
  },
  SUPPORTING: {
    role: 'SUPPORTING',
    label: 'Supporting Cluster Knowledge',
    description: 'Konten pendukung kelengkapan klaster, internal linking, dan edukasi prasyarat.',
    isCommodityExemptionEligible: true
  },
  REFERENCE: {
    role: 'REFERENCE',
    label: 'Glossary & Fundamental Reference',
    description: 'Entri kamus/glosarium dan definisi teknis untuk ketepatan rujukan pembaca dan mesin.',
    isCommodityExemptionEligible: true
  }
};
