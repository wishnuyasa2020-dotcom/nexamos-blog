/**
 * NexaMOS Source Authority Evaluator
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Menilai tingkat otoritas kandidat sumber menggunakan hierarki kanonikal
 * dan sinyal struktural metadata/konteks (bukan hardcoded domain favorit).
 */

import type { SourceType } from '../domain/source-type.ts';
import { SOURCE_HIERARCHY_RANK } from '../domain/source-type.ts';

export interface AuthorityEvaluationInput {
  url?: string | null;
  publisher?: string | null;
  author?: string | null;
  sourceType?: SourceType | null;
  snippet?: string | null;
}

export interface AuthorityAssessment {
  score: number; // 0 - 100
  hierarchyRank: number; // 1 (tertinggi) sampai 7 (terendah)
  rationale: string;
}

export class AuthorityEvaluator {
  evaluate(input: AuthorityEvaluationInput): AuthorityAssessment {
    const sourceType = input.sourceType || 'OTHER';
    const rank = SOURCE_HIERARCHY_RANK[sourceType] || 7;

    let baseScore = 50;

    switch (rank) {
      case 1: // Official, Gov, Regulator, Internal Experiment
        baseScore = 95;
        break;
      case 2: // Primary Research, Academic Paper, Dataset
        baseScore = 90;
        break;
      case 3: // Industry Research
        baseScore = 80;
        break;
      case 4: // Book, Expert Analysis, Company Publication
        baseScore = 70;
        break;
      case 5: // News, Interview
        baseScore = 60;
        break;
      case 6: // Community Discussion
        baseScore = 40;
        break;
      default:
        baseScore = 30;
    }

    // Penyesuaian struktural berbasis konteks & metadata
    let modifier = 0;
    const reasons: string[] = [];

    // Cek domain TLD institusional jika URL ada
    if (input.url) {
      try {
        const parsedUrl = new URL(input.url);
        const host = parsedUrl.hostname.toLowerCase();
        if (host.endsWith('.gov') || host.endsWith('.go.id')) {
          modifier += 5;
          reasons.push('Domain institusi pemerintahan (.gov/.go.id)');
        } else if (host.endsWith('.edu') || host.endsWith('.ac.id')) {
          modifier += 5;
          reasons.push('Domain institusi akademik (.edu/.ac.id)');
        }
      } catch {
        // Abaikan jika URL tidak valid
      }
    }

    // Kehadiran publisher dan author eksplisit meningkatkan verifiabilitas
    if (input.publisher && input.publisher.trim().length > 0) {
      modifier += 3;
    }
    if (input.author && input.author.trim().length > 0) {
      modifier += 2;
    }

    const finalScore = Math.min(100, Math.max(0, baseScore + modifier));
    const rationale = `Otoritas tingkat ${rank} (${sourceType}). Skor dasar: ${baseScore}${
      reasons.length > 0 ? ', bonus: ' + reasons.join(', ') : ''
    }.`;

    return {
      score: finalScore,
      hierarchyRank: rank,
      rationale
    };
  }
}
