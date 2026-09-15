/**
 * NexaMOS AI Content Accessibility Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai kemudahan akses teks utama artikel oleh bot perayap dan mesin AI:
 * - Teks utama dapat diakses langsung tanpa terkunci interaksi (interaction-locked)
 * - Bebas dari paywall atau pembatasan akses tertutup
 * - Peninjauan risiko rendering JavaScript (JS_RENDERING_REVIEW)
 *
 * DOKTRIN UTAMA:
 * Framework-neutral (tidak menuntut framework tertentu).
 * JavaScript content TIDAK otomatis buruk, namun primary content sebaiknya tersedia langsung dalam HTML awal.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface AccessibilitySignals {
  isPaywallRestricted?: boolean;
  requiresClientInteractionToRead?: boolean;
  reliesExclusivelyOnClientSideRendering?: boolean;
}

export interface ContentAccessibilityValidationResult {
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 7
  issues: AIVisibilityIssue[];
}

export class ContentAccessibilityValidator {
  public validate(
    draft: ArticleDraft,
    signals?: AccessibilitySignals | null
  ): ContentAccessibilityValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 7; // Bobot penuh CONTENT_ACCESSIBILITY = 7

    // 1. Pemeriksaan Paywall / Pembatasan Akses
    if (signals?.isPaywallRestricted) {
      score -= 4;
      issues.push({
        code: 'PAYWALL_ACCESS_RESTRICTION',
        checkId: 'AI_CONTENT_ACCESSIBILITY',
        dimension: 'CONTENT_ACCESSIBILITY',
        severity: 'WARNING',
        message: 'Konten dibatasi oleh paywall atau gerbang registrasi tertutup, membatasi kemampuan bot AI mengindeks teks penuh.',
        location: 'signals.isPaywallRestricted',
        recommendation: 'Sediakan ringkasan terbuka atau pastikan bot search terverifikasi memiliki akses ke teks primer.'
      });
    }

    // 2. Pemeriksaan Konten Terkunci Interaksi
    if (signals?.requiresClientInteractionToRead) {
      score -= 3;
      issues.push({
        code: 'CONTENT_INTERACTION_LOCKED',
        checkId: 'AI_CONTENT_ACCESSIBILITY',
        dimension: 'CONTENT_ACCESSIBILITY',
        severity: 'WARNING',
        message: 'Badan artikel utama disembunyikan di balik interaksi pengguna (misal modal klik, accordion terkunci).',
        location: 'signals.requiresClientInteractionToRead',
        recommendation: 'Sajikan teks primer langsung dalam DOM yang dapat diurai tanpa interaksi.'
      });
    }

    // 3. Peninjauan Risiko JavaScript Rendering
    if (signals?.reliesExclusivelyOnClientSideRendering) {
      score -= 2;
      issues.push({
        code: 'JS_RENDERING_REVIEW',
        checkId: 'AI_CONTENT_ACCESSIBILITY',
        dimension: 'CONTENT_ACCESSIBILITY',
        severity: 'INFO',
        message: 'Teks primer bergantung sepenuhnya pada rendering sisi klien (CSR). Meskipun Google merender JS, ketersediaan HTML awal mempercepat ekstraksi AI.',
        location: 'rendering',
        recommendation: 'Pertimbangkan penyajian teks artikel utama dalam markup HTML awal (SSR atau SSG).'
      });
    }

    const finalScore = Math.max(0, Math.min(7, score));

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_CONTENT_ACCESSIBILITY',
      dimension: 'CONTENT_ACCESSIBILITY',
      status: finalScore >= 6 ? 'PASS' : finalScore >= 4 ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: finalScore >= 6
        ? 'Teks primer dapat diakses secara langsung tanpa rintangan paywall atau penguncian interaksi.'
        : `Skor aksesibilitas konten: ${finalScore}/7.`
    };

    return {
      checkResult,
      score: finalScore,
      issues
    };
  }
}
