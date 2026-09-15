/**
 * NexaMOS AI Entity Clarity Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai kejelasan dan ketegasan entitas semantik dalam naskah:
 * - Konsistensi penamaan entitas (misal: Google Search, AI Overviews, CRM, NexaMOS)
 * - Identifikasi akronim tanpa definisi awal
 * - Pencegahan ambiguitas penamaan dan relasi entitas
 *
 * DOKTRIN KERAS:
 * Dilarang membuat entity schema fiktif atau menjejali artikel dengan nama entitas berulang (entity stuffing)!
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface EntityClarityValidationResult {
  entityClarity: 'HIGH' | 'MEDIUM' | 'LOW';
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 10
  issues: AIVisibilityIssue[];
}

export class EntityClarityValidator {
  // Akronim teknis/bisnis yang lazim membutuhkan klarifikasi jika muncul mandiri tanpa konteks
  private readonly technicalAcronyms = ['AOV', 'LTV', 'CAC', 'ROAS', 'GEO', 'AEO', 'MOM', 'YOY'];

  public validate(draft: ArticleDraft): EntityClarityValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 10; // Bobot penuh ENTITY_CLARITY = 10

    const fullContent = [
      draft.title,
      draft.thesis || '',
      ...draft.sections.map((s) => `${s.heading} ${s.content}`)
    ].join(' ');

    // 1. Deteksi Akronim Tanpa Definisi atau Konteks Penjelas
    const undefinedAcronyms: string[] = [];
    for (const acronym of this.technicalAcronyms) {
      const regex = new RegExp(`\\b${acronym}\\b`, 'g');
      if (regex.test(fullContent)) {
        // Cek apakah ada ekspansi/penjelasan dalam kurung atau sekitarnya
        const definitionPattern = new RegExp(`(${acronym}\\s*\\([^)]+\\)|\\([^)]+\\)\\s*${acronym})`, 'i');
        if (!definitionPattern.test(fullContent)) {
          undefinedAcronyms.push(acronym);
        }
      }
    }

    if (undefinedAcronyms.length > 0) {
      score -= Math.min(3, undefinedAcronyms.length);
      issues.push({
        code: 'UNDEFINED_ACRONYM',
        checkId: 'AI_ENTITY_CLARITY',
        dimension: 'ENTITY_CLARITY',
        severity: 'INFO',
        message: `Ditemukan akronim (${undefinedAcronyms.join(', ')}) yang digunakan tanpa penyebutan kepanjangan eksplisit pada kemunculan pertama.`,
        location: 'content',
        recommendation: 'Sertakan kepanjangan akronim pada penyebutan pertama untuk memudahkan disambiguasi oleh LLM.'
      });
    }

    // 2. Deteksi Inkonsistensi Penamaan Entitas Kunci
    // Contoh: mencampurkan variasi tidak standar seperti "AI Overview" vs "AI Overviews"
    const hasSingularOverview = /\bAI Overview\b/g.test(fullContent);
    const hasPluralOverview = /\bAI Overviews\b/g.test(fullContent);
    if (hasSingularOverview && hasPluralOverview) {
      score -= 2;
      issues.push({
        code: 'AMBIGUOUS_ENTITY_NAMING',
        checkId: 'AI_ENTITY_CLARITY',
        dimension: 'ENTITY_CLARITY',
        severity: 'WARNING',
        message: 'Ditemukan inkonsistensi penamaan fitur resmi Google: percampuran antara "AI Overview" dan "AI Overviews".',
        location: 'content',
        recommendation: 'Gunakan nama resmi entitas secara konsisten ("Google AI Overviews").'
      });
    }

    const finalScore = Math.max(0, Math.min(10, score));
    let clarity: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (finalScore < 6) {
      clarity = 'LOW';
    } else if (finalScore < 9) {
      clarity = 'MEDIUM';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_ENTITY_CLARITY',
      dimension: 'ENTITY_CLARITY',
      status: clarity === 'HIGH' ? 'PASS' : clarity === 'MEDIUM' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: clarity === 'HIGH'
        ? 'Entitas, produk, dan konsep dinamai secara konsisten dan terdefinisi dengan jelas untuk pemahaman mesin AI.'
        : `Tingkat kejelasan entitas: ${clarity}.`
    };

    return {
      entityClarity: clarity,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
