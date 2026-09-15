/**
 * NexaMOS Publication Status State Machine
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Mengatur transisi status publikasi secara deterministik.
 */

import type { PublicationStatus } from './publication.ts';

const ALLOWED_TRANSITIONS: Record<PublicationStatus, readonly PublicationStatus[]> = {
  CANDIDATE: ['PACKAGING', 'PUBLISH_FAILED'],
  PACKAGING: ['PREFLIGHT_FAILED', 'READY_FOR_RELEASE'],
  PREFLIGHT_FAILED: ['PACKAGING', 'ARCHIVED'],
  READY_FOR_RELEASE: ['SCHEDULED', 'RELEASE_REQUESTED', 'ARCHIVED'],
  SCHEDULED: ['RELEASE_REQUESTED', 'READY_FOR_RELEASE', 'ARCHIVED'],
  RELEASE_REQUESTED: ['PUBLISHED', 'PUBLISH_FAILED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED', 'PACKAGING'], // PACKAGING untuk update konten baru
  PUBLISH_FAILED: ['READY_FOR_RELEASE', 'PACKAGING', 'ARCHIVED'],
  UNPUBLISHED: ['READY_FOR_RELEASE', 'ARCHIVED'],
  ARCHIVED: ['UNPUBLISHED']
};

export class PublicationStatusManager {
  /**
   * Memeriksa apakah transisi status diperbolehkan oleh state machine
   */
  public static canTransition(current: PublicationStatus, next: PublicationStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Memvalidasi transisi status dan melempar error jika melanggar aturan state machine
   */
  public static assertTransition(current: PublicationStatus, next: PublicationStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(
        `Transisi status tidak valid dari '${current}' ke '${next}'. Transisi yang diizinkan: [${(
          ALLOWED_TRANSITIONS[current] || []
        ).join(', ')}]`
      );
    }
  }

  /**
   * Mengembalikan status yang merepresentasikan konten yang aktif di mata publik
   */
  public static isPubliclyVisible(status: PublicationStatus): boolean {
    return status === 'PUBLISHED';
  }
}
