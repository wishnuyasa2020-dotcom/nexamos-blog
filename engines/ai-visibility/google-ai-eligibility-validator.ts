/**
 * NexaMOS Google Generative AI Eligibility Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Mengevaluasi kelayakan dasar untuk Google AI Overviews, AI Mode, dan fitur Generative AI di Discover:
 * - Keterindeksan (indexability) & direktif robots
 * - Kontrol Inklusi Search Console (GenerativeAIInclusionStatus)
 * - Kelayakan Cuplikan (Snippet Eligibility)
 * - Integritas Canonical URL
 * - Ketersediaan Konten Primer
 *
 * DOKTRIN KERAS: Google resmi TIDAK memerlukan tag khusus AI, AI schema khusus, atau llms.txt.
 * Dilarang menciptakan persyaratan artifisial!
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type {
  GenerativeAIInclusionStatus,
  GoogleAIEligibilityStatus,
  AIVisibilityCheckResult,
  AIVisibilityIssue
} from './ai-visibility-validation.ts';

export interface GoogleAIEligibilityValidationResult {
  eligibility: GoogleAIEligibilityStatus;
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 10
  issues: AIVisibilityIssue[];
}

export class GoogleAIEligibilityValidator {
  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null,
    inclusionStatus: GenerativeAIInclusionStatus = 'INCLUDED'
  ): GoogleAIEligibilityValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let isBlockedBySiteControl = false;
    let isHardIneligible = false;
    let hasWarning = false;
    let score = 10; // Bobot penuh GOOGLE_AI_ELIGIBILITY = 10

    // 1. Verifikasi Search Generative AI Control (GSC Setting)
    if (inclusionStatus === 'EXCLUDED') {
      isBlockedBySiteControl = true;
      score = 0;
      issues.push({
        code: 'GENERATIVE_AI_SITE_EXCLUDED',
        checkId: 'AI_GOOGLE_ELIGIBILITY',
        dimension: 'GOOGLE_AI_ELIGIBILITY',
        severity: 'CRITICAL',
        message: 'Situs atau direktori disetel EXCLUDED dari Google Generative AI features (AI Overviews & AI Mode) via Search Console control.',
        location: 'site_controls.generative_ai_inclusion',
        recommendation: 'Aktifkan status INCLUDED pada kontrol Search Console jika ingin halaman memenuhi syarat fitur AI Generatif Google.'
      });
    }

    // 2. Verifikasi Keterindeksan (Robots Directives)
    if (metadata?.robots && !metadata.robots.index) {
      isHardIneligible = true;
      score = 0;
      issues.push({
        code: 'ARTICLE_NOT_INDEXABLE',
        checkId: 'AI_GOOGLE_ELIGIBILITY',
        dimension: 'GOOGLE_AI_ELIGIBILITY',
        severity: 'CRITICAL',
        message: 'Halaman disetel dengan direktif "noindex". Halaman yang tidak dapat diindeks Google Search otomatis gugur dari AI Overviews dan grounding.',
        location: 'metadata.robots.index',
        recommendation: 'Aktifkan robots.index: true di layer teknis SEO.'
      });
    }

    // 3. Verifikasi Keberadaan Konten Primer
    if (!draft.title || !draft.sections || draft.sections.length === 0) {
      isHardIneligible = true;
      score = 0;
      issues.push({
        code: 'PRIMARY_CONTENT_UNAVAILABLE',
        checkId: 'AI_GOOGLE_ELIGIBILITY',
        dimension: 'GOOGLE_AI_ELIGIBILITY',
        severity: 'CRITICAL',
        message: 'Naskah artikel tidak memiliki judul atau badan seksi primer.',
        location: 'draft.sections',
        recommendation: 'Sediakan naskah artikel yang lengkap dengan seksi konten primer.'
      });
    }

    // 4. Verifikasi Integritas URL Kanonikal
    if (metadata?.canonicalUrl) {
      try {
        const parsed = new URL(metadata.canonicalUrl);
        if (!parsed.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
      } catch {
        isHardIneligible = true;
        score = Math.min(score, 2);
        issues.push({
          code: 'CRITICAL_CANONICAL_CONFLICT',
          checkId: 'AI_GOOGLE_ELIGIBILITY',
          dimension: 'GOOGLE_AI_ELIGIBILITY',
          severity: 'CRITICAL',
          message: `URL kanonikal ("${metadata.canonicalUrl}") tidak valid atau korup.`,
          location: 'metadata.canonicalUrl',
          recommendation: 'Perbaiki URL kanonikal agar berupa URL HTTP/HTTPS absolut yang valid.'
        });
      }
    }

    // 5. Verifikasi Snippet Eligibility
    if (metadata?.robots?.maxSnippet === 0) {
      hasWarning = true;
      score -= 3;
      issues.push({
        code: 'SNIPPET_ELIGIBILITY_WARNING',
        checkId: 'AI_GOOGLE_ELIGIBILITY',
        dimension: 'GOOGLE_AI_ELIGIBILITY',
        severity: 'WARNING',
        message: 'Direktif max-snippet disetel ke 0 (nosnippet). Ini dapat membatasi kemampuan Google Search menampilkan cuplikan teks pada ringkasan AI.',
        location: 'metadata.robots.maxSnippet',
        recommendation: 'Hapus pembatasan max-snippet: 0 jika ingin konten dapat dikutip secara penuh.'
      });
    }

    // 6. Penentuan Status Akhir
    let eligibility: GoogleAIEligibilityStatus;
    if (isBlockedBySiteControl) {
      eligibility = 'BLOCKED_BY_SITE_CONTROL';
    } else if (isHardIneligible) {
      eligibility = 'INELIGIBLE';
    } else if (hasWarning) {
      eligibility = 'ELIGIBILITY_WARNING';
    } else {
      eligibility = 'ELIGIBLE';
    }

    const finalScore = Math.max(0, Math.min(10, score));

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_GOOGLE_ELIGIBILITY',
      dimension: 'GOOGLE_AI_ELIGIBILITY',
      status: eligibility === 'ELIGIBLE' ? 'PASS' : eligibility === 'ELIGIBILITY_WARNING' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: eligibility === 'ELIGIBLE'
        ? 'Artikel memenuhi seluruh syarat kelayakan teknis Google Generative AI (terindeks, crawlable, snippet eligible).'
        : `Status kelayakan Google AI: ${eligibility}.`
    };

    return {
      eligibility,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
