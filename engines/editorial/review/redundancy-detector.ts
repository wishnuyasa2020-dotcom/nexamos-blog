/**
 * NexaMOS Redundancy Detector
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Membedakan pengulangan ide yang hampa (REDUNDANCY) dari penegasan retoris (USEFUL_REINFORCEMENT).
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface RedundancyDetectionResult {
  score: number;
  issues: ReviewIssue[];
  strengths: string[];
}

export class RedundancyDetector {
  public evaluate(draft: ArticleDraft): RedundancyDetectionResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    const seenSentences = new Map<string, string>(); // normalized text -> sectionId

    for (const section of draft.sections) {
      const sentences = section.content.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10);

      for (const s of sentences) {
        const normalized = s
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .slice(0, 10)
          .join(' ');

        if (normalized.length < 20) continue;

        if (seenSentences.has(normalized)) {
          const prevSectionId = seenSentences.get(normalized)!;
          if (prevSectionId !== section.id) {
            // Periksa apakah ini pengulangan tesis di kesimpulan (yang merupakan useful reinforcement)
            const isConclusion = section.purpose === 'CONCLUSION';

            if (isConclusion) {
              strengths.push(
                `Penegasan premis utama pada seksi kesimpulan berfungsi sebagai USEFUL_REINFORCEMENT retoris.`
              );
            } else {
              issues.push({
                dimension: 'COHERENCE',
                code: 'IDEA_REDUNDANCY',
                message: `Kalimat di seksi '${section.heading || section.id}' mengulang premis yang identik dengan seksi '${prevSectionId}'.`,
                severity: 'MINOR',
                sectionId: section.id,
                snippet: s.slice(0, 80) + '...',
                recommendation: 'Gunakan sudut pandang baru atau hapus pengulangan bila tidak memberi informasi tambahan.'
              });
              score -= 10;
            }
          }
        } else {
          seenSentences.set(normalized, section.id);
        }
      }
    }

    if (issues.length === 0) {
      strengths.push('Naskah bersih dari pengulangan ide hampa; setiap seksi bergerak maju membawa nilai baru.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  }
}
