/**
 * NexaMOS Search Intent Profile & Domain Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Tidak menggunakan taksonomi kaku 4 kuadran (Informational/Navigational/Commercial/Transactional)
 * sebagai satu-satunya kebenaran, melainkan berfokus pada problem intent dan pemenuhan tugas pembaca (reader task).
 */

export type IntentAlignmentStatus = 'ALIGNED' | 'PARTIAL' | 'MISMATCHED';

export interface SearchIntentProfile {
  primaryIntent: string;
  secondaryIntents: string[];
  readerTask: string;
  problemAddressed: string;
  articlePromise: string;
  intentAlignment: IntentAlignmentStatus;
  alignmentReason?: string;
}
