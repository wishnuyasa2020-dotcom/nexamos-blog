/**
 * NexaMOS Performance Window
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Hard Principle:
 * Jangan membandingkan artikel baru 2 hari dengan artikel umur 12 bulan tanpa normalisasi konteks.
 */

export type PerformanceWindowType =
  | 'FIRST_24_HOURS'
  | 'FIRST_7_DAYS'
  | 'FIRST_28_DAYS'
  | 'ROLLING_28_DAYS'
  | 'ROLLING_90_DAYS'
  | 'LIFETIME'
  | 'CUSTOM';

export const PERFORMANCE_WINDOW_TYPES: readonly PerformanceWindowType[] = [
  'FIRST_24_HOURS',
  'FIRST_7_DAYS',
  'FIRST_28_DAYS',
  'ROLLING_28_DAYS',
  'ROLLING_90_DAYS',
  'LIFETIME',
  'CUSTOM'
] as const;

export interface PerformanceWindow {
  windowType: PerformanceWindowType;
  startDate: string; // ISO 8601 or YYYY-MM-DD
  endDate: string;   // ISO 8601 or YYYY-MM-DD
  durationDays: number;
  isRolling: boolean;
}

/**
 * Membangun objek PerformanceWindow standar
 */
export function createPerformanceWindow(
  windowType: PerformanceWindowType,
  startDate: string,
  endDate: string
): PerformanceWindow {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  const isRolling = windowType.startsWith('ROLLING_');

  return {
    windowType,
    startDate,
    endDate,
    durationDays: diffDays,
    isRolling
  };
}

/**
 * Mengevaluasi apakah dua window sepadan untuk dibandingkan secara statistik
 */
export function areWindowsComparable(w1: PerformanceWindow, w2: PerformanceWindow): {
  comparable: boolean;
  reason?: string;
} {
  if (w1.windowType !== w2.windowType && (!w1.isRolling || !w2.isRolling)) {
    return {
      comparable: false,
      reason: `Tipe window berbeda: ${w1.windowType} vs ${w2.windowType}. Perbandingan langsung berpotensi bias.`
    };
  }

  const durationDiff = Math.abs(w1.durationDays - w2.durationDays);
  if (durationDiff > 3) {
    return {
      comparable: false,
      reason: `Durasi hari tidak seimbang (${w1.durationDays} hari vs ${w2.durationDays} hari).`
    };
  }

  return { comparable: true };
}
