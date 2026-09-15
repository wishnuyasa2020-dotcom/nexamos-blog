/**
 * NexaMOS Topic State Transition Rules
 *
 * Sourced from NexaMOS Blog Master Reference & IDE Agent Doctrine v1.0 (Phase 1B)
 *
 * Mengatur transisi status siklus hidup topik secara deterministik dan aman:
 * CAPTURED -> SCREENING
 * SCREENING -> RESEARCH_REQUIRED | QUALIFIED | ON_HOLD | REJECTED
 * RESEARCH_REQUIRED -> SCREENING | QUALIFIED | REJECTED
 * QUALIFIED -> PRIORITIZED
 * PRIORITIZED -> APPROVED | ON_HOLD
 * APPROVED -> IN_PRODUCTION
 * IN_PRODUCTION -> PUBLISHED
 * ON_HOLD -> SCREENING | ARCHIVED
 * REJECTED -> ARCHIVED
 */

import type { TopicLifecycleStatus } from './domain/topic-status.ts';

export interface TransitionValidationResult {
  allowed: boolean;
  from: TopicLifecycleStatus;
  to: TopicLifecycleStatus;
  reason?: string;
  error?: string;
}

/**
 * Matriks transisi status yang sah (Canonical Transition Map)
 */
export const ALLOWED_TRANSITIONS: Record<
  TopicLifecycleStatus,
  readonly TopicLifecycleStatus[]
> = {
  CAPTURED: ['SCREENING'],
  SCREENING: ['RESEARCH_REQUIRED', 'QUALIFIED', 'ON_HOLD', 'REJECTED'],
  RESEARCH_REQUIRED: ['SCREENING', 'QUALIFIED', 'REJECTED'],
  QUALIFIED: ['PRIORITIZED'],
  PRIORITIZED: ['APPROVED', 'ON_HOLD'],
  APPROVED: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['PUBLISHED'],
  ON_HOLD: ['SCREENING', 'ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  PUBLISHED: ['ARCHIVED'], // Terbitan arsip jika tidak relevan lagi
  ARCHIVED: [] // Status terminal
};

/**
 * Memvalidasi apakah transisi status dari status awal ke status tujuan diizinkan
 */
export function validateTopicTransition(
  from: TopicLifecycleStatus,
  to: TopicLifecycleStatus
): TransitionValidationResult {
  // Transisi ke status yang sama dianggap no-op yang valid
  if (from === to) {
    return {
      allowed: true,
      from,
      to,
      reason: `Topik sudah berada pada status '${from}'.`
    };
  }

  const validTargets = ALLOWED_TRANSITIONS[from];

  if (!validTargets || !validTargets.includes(to)) {
    const allowedList = validTargets && validTargets.length > 0 ? validTargets.join(', ') : 'Tidak ada (status terminal)';
    return {
      allowed: false,
      from,
      to,
      error: 'INVALID_TRANSITION',
      reason: `Transisi ilegal: status '${from}' tidak dapat langsung berubah menjadi '${to}'. Status tujuan yang diperbolehkan: [${allowedList}].`
    };
  }

  return {
    allowed: true,
    from,
    to,
    reason: `Transisi valid dari '${from}' menuju '${to}'.`
  };
}

/**
 * Helper untuk menguji apakah status adalah status terminal
 */
export function isTerminalStatus(status: TopicLifecycleStatus): boolean {
  return status === 'ARCHIVED';
}
