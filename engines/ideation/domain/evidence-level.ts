/**
 * NexaMOS Editorial Evidence Levels
 *
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 (Section 12)
 *
 * E0 — Unsupported: Tidak ada evidence.
 * E1 — Common Knowledge: Pengetahuan umum / definisi dasar.
 * E2 — Secondary Evidence: Artikel industri, buku, laporan sekunder.
 * E3 — Primary / Authoritative Evidence: Dokumentasi resmi, paper, regulator, dataset primer.
 * E4 — NexaMOS Original Evidence: Data, observasi, eksperimen, framework, atau kasus milik NexaMOS.
 */

export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export const EVIDENCE_LEVELS: readonly EvidenceLevel[] = [
  'E0',
  'E1',
  'E2',
  'E3',
  'E4'
] as const;

export interface EvidenceLevelDefinition {
  level: EvidenceLevel;
  label: string;
  description: string;
}

export const EVIDENCE_LEVEL_DEFINITIONS: Record<EvidenceLevel, EvidenceLevelDefinition> = {
  E0: {
    level: 'E0',
    label: 'Unsupported',
    description: 'Tidak ada evidence pendukung.'
  },
  E1: {
    level: 'E1',
    label: 'Common Knowledge',
    description: 'Pengetahuan umum atau definisi dasar industri.'
  },
  E2: {
    level: 'E2',
    label: 'Secondary Evidence',
    description: 'Artikel industri, buku, rangkuman eksternal, atau laporan sekunder.'
  },
  E3: {
    level: 'E3',
    label: 'Primary / Authoritative Evidence',
    description: 'Dokumentasi resmi platform, paper akademik, riset otoritatif, dataset primer.'
  },
  E4: {
    level: 'E4',
    label: 'NexaMOS Original Evidence',
    description: 'Data primer, benchmark internal, observasi langsung, eksperimen, atau framework orisinal NexaMOS.'
  }
};
