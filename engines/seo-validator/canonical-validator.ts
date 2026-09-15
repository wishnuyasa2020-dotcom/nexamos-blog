/**
 * NexaMOS Canonical Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memvalidasi keberadaan, format URL yang sah, domain yang sama (same-site),
 * verifikasi self-canonical untuk artikel orisinal, dan mendeteksi perulangan kanonikal (canonical loop).
 * DILARANG membuat canonical otomatis jika deployment context belum tersedia.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from './article-seo-metadata.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface CanonicalValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class CanonicalValidator {
  private readonly defaultExpectedDomain = 'nexamos.com';

  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null,
    expectedDomain: string = this.defaultExpectedDomain
  ): CanonicalValidationResult {
    const issues: SEOIssue[] = [];
    const canonicalUrl = metadata?.canonicalUrl?.trim();
    let score = 100;

    // Jika canonical URL belum diset
    if (!canonicalUrl) {
      // Jika draft belum dideploy dan tidak ada deployment context
      score -= 20;
      issues.push({
        code: 'INVALID_CANONICAL',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'INFO',
        message: 'Canonical URL belum ditentukan (akan otomatis ditetapkan saat deployment context aktif).',
        location: 'metadata.canonicalUrl',
        recommendation: 'Tentukan canonical URL mutlak sebelum artikel dipublikasikan ke production.'
      });

      return {
        checkResult: {
          checkId: 'CANONICAL_INTEGRITY',
          dimension: 'CANONICAL_INTEGRITY',
          status: 'WARNING',
          scoreContribution: Math.max(0, Math.min(5, Math.round((score / 100) * 5))),
          summary: 'Canonical URL belum diatur.'
        },
        issues
      };
    }

    // 1. Validasi Format URL (Wajib valid URI dengan protokol http/https)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(canonicalUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Protokol harus HTTP atau HTTPS');
      }
    } catch {
      score = 0;
      issues.push({
        code: 'INVALID_CANONICAL',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'CRITICAL',
        message: `Canonical URL tidak valid: "${canonicalUrl}". Harus berupa URL absolut yang valid.`,
        location: 'metadata.canonicalUrl',
        recommendation: 'Perbaiki URL kanonikal dengan format absolut yang valid (contoh: https://nexamos.com/blog/slug).'
      });

      return {
        checkResult: {
          checkId: 'CANONICAL_INTEGRITY',
          dimension: 'CANONICAL_INTEGRITY',
          status: 'FAIL',
          scoreContribution: 0,
          summary: 'Canonical URL tidak valid.'
        },
        issues
      };
    }

    // 2. Same-site Expected Check
    if (expectedDomain && !parsedUrl.hostname.includes(expectedDomain)) {
      score -= 30;
      issues.push({
        code: 'INVALID_CANONICAL',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'WARNING',
        message: `Canonical URL mengarah ke domain luar ("${parsedUrl.hostname}"), berbeda dari domain internal ("${expectedDomain}"). Pastikan ini disengaja untuk sindikasi.`,
        location: 'metadata.canonicalUrl',
        recommendation: 'Gunakan domain internal untuk artikel orisinal NexaMOS.'
      });
    }

    // 3. Deteksi Canonical Loop (misal mengarah ke URL redirect atau perulangan diri yang salah)
    // Jika slug di canonical URL berbeda secara drastis dari slug draft
    if (draft.slug) {
      const canonicalPath = parsedUrl.pathname.replace(/\/$/, '');
      const expectedSlugSuffix = `/${draft.slug}`;
      if (!canonicalPath.endsWith(expectedSlugSuffix) && !canonicalPath.includes(draft.slug)) {
        issues.push({
          code: 'CANONICAL_LOOP',
          checkId: 'CANONICAL_INTEGRITY',
          dimension: 'CANONICAL_INTEGRITY',
          severity: 'CRITICAL',
          message: `Canonical URL ("${canonicalUrl}") mengarah ke path yang tidak cocok dengan slug artikel ("${draft.slug}"). Berisiko memicu canonical mismatch atau loop.`,
          location: 'metadata.canonicalUrl',
          recommendation: 'Pastikan path canonical URL persis sama dengan slug publikasi artikel.'
        });
        score = 0;
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'CANONICAL_INTEGRITY',
      dimension: 'CANONICAL_INTEGRITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(5, Math.round((score / 100) * 5))), // bobot max 5
      summary: issues.length === 0
        ? 'Canonical URL valid, self-canonical, dan bebas dari canonical loop.'
        : `Ditemukan ${issues.length} catatan integritas kanonikal.`
    };

    return {
      checkResult,
      issues
    };
  }
}
