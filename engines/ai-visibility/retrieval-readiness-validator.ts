/**
 * NexaMOS AI Retrieval Readiness Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Mengevaluasi kemudahan retrieval semantik dan grounding oleh LLM/mesin pencari:
 * - Kejelasan fokus topik per seksi
 * - Kualitas dan spesifisitas heading semantik
 * - Koherensi alur teks manusiawi
 *
 * DOKTRIN UTAMA:
 * HUMAN COHERENCE → MACHINE RETRIEVABILITY (bukan "WRITE FOR CHUNKS").
 * Dilarang menghukum naskah karena tidak memiliki pemecahan paragraf mikro artifisial (artificial micro-chunking).
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface RetrievalReadinessValidationResult {
  retrievability: 'HIGH' | 'MEDIUM' | 'LOW';
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 12
  issues: AIVisibilityIssue[];
}

export class RetrievalReadinessValidator {
  private readonly ambiguousHeadings = new Set([
    'lain-lain',
    'hal',
    'poin',
    'bagian',
    'bab',
    'catatan',
    'tips',
    'lanjutan'
  ]);

  public validate(
    draft: ArticleDraft,
    topic?: Topic | null
  ): RetrievalReadinessValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 12; // Bobot penuh RETRIEVAL_READINESS = 12

    if (!draft.sections || draft.sections.length === 0) {
      score = 0;
      return {
        retrievability: 'LOW',
        checkResult: {
          checkId: 'AI_RETRIEVAL_READINESS',
          dimension: 'RETRIEVAL_READINESS',
          status: 'FAIL',
          scoreContribution: 0,
          summary: 'Badan artikel kosong, tidak dapat diretrieve oleh sistem AI.'
        },
        score: 0,
        issues: [
          {
            code: 'RETRIEVAL_COHERENCE_WEAK',
            checkId: 'AI_RETRIEVAL_READINESS',
            dimension: 'RETRIEVAL_READINESS',
            severity: 'CRITICAL',
            message: 'Artikel tidak memiliki seksi konten untuk proses AI retrieval.',
            location: 'draft.sections',
            recommendation: 'Sediakan naskah artikel yang terstruktur.'
          }
        ]
      };
    }

    // 1. Evaluasi Spesifisitas dan Semantik Heading
    let ambiguousHeadingCount = 0;
    for (const section of draft.sections) {
      const headingClean = section.heading.trim().toLowerCase();
      if (
        this.ambiguousHeadings.has(headingClean) ||
        headingClean.length < 4 ||
        /^\d+$/.test(headingClean)
      ) {
        ambiguousHeadingCount++;
      }
    }

    if (ambiguousHeadingCount > 0) {
      score -= Math.min(4, ambiguousHeadingCount * 2);
      issues.push({
        code: 'HEADING_HIERARCHY_AMBIGUOUS',
        checkId: 'AI_RETRIEVAL_READINESS',
        dimension: 'RETRIEVAL_READINESS',
        severity: 'WARNING',
        message: `Ditemukan ${ambiguousHeadingCount} heading seksi yang ambigu atau terlalu generik. Heading deskriptif memandu mesin AI mengekstrak konteks secara akurat.`,
        location: 'sections.heading',
        recommendation: 'Ubah heading menjadi frasa deskriptif yang secara eksplisit memuat topik bahasan seksi.'
      });
    }

    // 2. Evaluasi Koherensi Seksi & Alur Argumen
    // Cek apakah naskah memiliki variasi tujuan seksi (bukan hanya 1 seksi monolitik)
    const purposes = new Set(draft.sections.map((s) => s.purpose));
    if (draft.sections.length >= 3 && purposes.size >= 2) {
      // Struktur koheren alami yang memudahkan retrieval
    } else if (draft.sections.length === 1) {
      score -= 3;
      issues.push({
        code: 'RETRIEVAL_COHERENCE_WEAK',
        checkId: 'AI_RETRIEVAL_READINESS',
        dimension: 'RETRIEVAL_READINESS',
        severity: 'WARNING',
        message: 'Artikel hanya terdiri dari satu blok seksi monolitik, menyulitkan mesin AI memetakan sub-argumen.',
        location: 'draft.sections',
        recommendation: 'Pecah naskah menjadi beberapa seksi logis dengan heading yang mencerminkan alur pemikiran.'
      });
    }

    const finalScore = Math.max(0, Math.min(12, score));
    let retrievability: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (finalScore < 7) {
      retrievability = 'LOW';
    } else if (finalScore < 10) {
      retrievability = 'MEDIUM';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_RETRIEVAL_READINESS',
      dimension: 'RETRIEVAL_READINESS',
      status: retrievability === 'HIGH' ? 'PASS' : retrievability === 'MEDIUM' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: retrievability === 'HIGH'
        ? 'Struktur naskah koheren, heading semantis, dan alur pikir terdefinisi dengan sangat baik untuk AI retrieval.'
        : `Tingkat kesiapan retrieval: ${retrievability}.`
    };

    return {
      retrievability,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
