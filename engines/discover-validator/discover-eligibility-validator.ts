/**
 * NexaMOS Google Discover Eligibility Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Memverifikasi kelayakan dasar artikel untuk masuk ke Google Discover:
 * - Keterindeksan (indexability) dan direktif robots
 * - Keberadaan konten artikel primer
 * - Kompatibilitas kebijakan konten Discover
 *
 * PENTING: Google Discover TIDAK memerlukan tag khusus Discover atau structured data khusus.
 * Dilarang menciptakan persyaratan artifisial.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type {
  DiscoverEligibilityStatus,
  DiscoverCheckResult,
  DiscoverIssue
} from './discover-validation.ts';

export interface DiscoverEligibilityValidationResult {
  eligibility: DiscoverEligibilityStatus;
  checkResult: DiscoverCheckResult;
  issues: DiscoverIssue[];
}

export class DiscoverEligibilityValidator {
  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null
  ): DiscoverEligibilityValidationResult {
    const issues: DiscoverIssue[] = [];
    let isEligible = true;
    let hasWarning = false;

    // 1. Verifikasi Keberadaan Konten Primer
    if (!draft.title || !draft.sections || draft.sections.length === 0) {
      isEligible = false;
      issues.push({
        code: 'MISSING_PRIMARY_CONTENT',
        checkId: 'DISCOVER_ELIGIBILITY',
        dimension: 'POLICY_SAFETY',
        severity: 'CRITICAL',
        message: 'Naskah artikel tidak memiliki judul atau badan seksi konten primer.',
        location: 'draft.sections',
        recommendation: 'Lengkapi badan artikel dengan seksi terstruktur sebelum mengajukan kelayakan Discover.'
      });
    }

    // 2. Verifikasi Indeksabilitas (Robots Directives)
    // Sesuai dokumentasi resmi Google: Konten yang memenuhi syarat Discover harus dapat diindeks oleh Google Search.
    if (metadata?.robots && !metadata.robots.index) {
      isEligible = false;
      issues.push({
        code: 'CONTENT_NOT_INDEXABLE',
        checkId: 'DISCOVER_ELIGIBILITY',
        dimension: 'POLICY_SAFETY',
        severity: 'CRITICAL',
        message: 'Artikel disetel dengan direktif "noindex". Halaman yang tidak dapat diindeks Google Search secara otomatis tidak memenuhi syarat Discover.',
        location: 'metadata.robots.index',
        recommendation: 'Aktifkan robots.index: true jika artikel ditargetkan untuk distribusi publik.'
      });
    }

    // 3. Verifikasi Status Publikasi & Metadata
    if (!metadata) {
      hasWarning = true;
      issues.push({
        code: 'DISCOVER_POLICY_INELIGIBLE',
        checkId: 'DISCOVER_ELIGIBILITY',
        dimension: 'POLICY_SAFETY',
        severity: 'WARNING',
        message: 'Artikel belum memiliki metadata SEO dan status publikasi resmi.',
        location: 'metadata',
        recommendation: 'Lengkapi metadata SEO artikel sebelum validasi final Discover.'
      });
    } else if (metadata.publicationStatus === 'ARCHIVED') {
      hasWarning = true;
      issues.push({
        code: 'DISCOVER_POLICY_INELIGIBLE',
        checkId: 'DISCOVER_ELIGIBILITY',
        dimension: 'POLICY_SAFETY',
        severity: 'WARNING',
        message: 'Artikel berstatus ARCHIVED. Google Discover memprioritaskan konten aktif dan evergreen yang terawat.',
        location: 'metadata.publicationStatus',
        recommendation: 'Pastikan artikel berstatus aktif jika ingin diprioritaskan di Discover.'
      });
    }

    let eligibility: DiscoverEligibilityStatus;
    if (!isEligible) {
      eligibility = 'INELIGIBLE';
    } else if (hasWarning) {
      eligibility = 'ELIGIBILITY_WARNING';
    } else {
      eligibility = 'ELIGIBLE';
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_ELIGIBILITY',
      dimension: 'POLICY_SAFETY',
      status: eligibility === 'INELIGIBLE' ? 'FAIL' : eligibility === 'ELIGIBILITY_WARNING' ? 'WARNING' : 'PASS',
      scoreContribution: eligibility === 'ELIGIBLE' ? 3 : eligibility === 'ELIGIBILITY_WARNING' ? 1 : 0,
      summary: eligibility === 'ELIGIBLE'
        ? 'Artikel memenuhi seluruh kriteria kelayakan dasar Google Discover.'
        : `Kelayakan Discover: ${eligibility}.`
    };

    return {
      eligibility,
      checkResult,
      issues
    };
  }
}
