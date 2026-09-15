/**
 * NexaMOS URL Slug Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memeriksa keterbacaan (readable), stabilitas, keringkasan, relevansi topik,
 * normalisasi huruf kecil, ketiadaan parameter acak, dan ketiadaan tanggal kecuali esensial.
 * DILARANG otomatis mengganti slug artikel existing yang sudah published.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { SEOIssue } from './seo-validation.ts';

export interface URLSlugValidationResult {
  isValid: boolean;
  normalizedSlug: string;
  issues: SEOIssue[];
}

export class URLSlugValidator {
  public validate(
    draft: ArticleDraft,
    explicitSlug?: string | null,
    isPublished = false
  ): URLSlugValidationResult {
    const issues: SEOIssue[] = [];
    const rawSlug = (explicitSlug || draft.slug || '').trim();

    if (!rawSlug) {
      issues.push({
        code: 'INVALID_URL_SLUG',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'CRITICAL',
        message: 'URL slug kosong.',
        location: 'slug',
        recommendation: 'Tetapkan slug URL yang ringkas dan deskriptif.'
      });
      return { isValid: false, normalizedSlug: '', issues };
    }

    // Normalisasi slug
    const normalizedSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // 1. Cek Uppercase atau Karakter Ilegal
    if (rawSlug !== rawSlug.toLowerCase()) {
      issues.push({
        code: 'INVALID_URL_SLUG',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: isPublished ? 'CRITICAL' : 'WARNING',
        message: `Slug memuat huruf besar ("${rawSlug}"). Standar web mewajibkan lowercase agar tidak memicu duplikasi URL case-sensitive.`,
        location: 'slug',
        recommendation: isPublished
          ? 'Jangan ubah slug langsung tanpa redirect 301 jika artikel sudah terbit!'
          : `Gunakan slug huruf kecil: "${normalizedSlug}".`
      });
    }

    // 2. Cek Karakter Ilegal / Parameter Acak
    if (/[?&=#%_]/g.test(rawSlug)) {
      issues.push({
        code: 'INVALID_URL_SLUG',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'CRITICAL',
        message: `Slug memuat karakter query string atau tanda baca ilegal ("${rawSlug}").`,
        location: 'slug',
        recommendation: 'Hapus karakter khusus; gunakan tanda hubung hyphen (-) sebagai pemisah.'
      });
    }

    // 3. Cek Tanggal dalam Slug (Tahun/Bulan/Hari)
    // Pola: 2026/03/ atau -2026-03- atau /2026/
    if (/\b(20\d\d)[-/](0[1-9]|1[0-2])([-/]([0-2]\d|3[01]))?\b/.test(rawSlug)) {
      issues.push({
        code: 'INVALID_URL_SLUG',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'INFO',
        message: 'Slug memuat format tanggal spesifik yang berisiko membuat URL terkesan basi (stale) di masa depan.',
        location: 'slug',
        recommendation: 'Gunakan slug evergreen berbasis topik tanpa tanggal kalender kecuali untuk laporan tahunan berkala.'
      });
    }

    // 4. Cek Panjang Slug
    if (normalizedSlug.length > 80) {
      issues.push({
        code: 'INVALID_URL_SLUG',
        checkId: 'CANONICAL_INTEGRITY',
        dimension: 'CANONICAL_INTEGRITY',
        severity: 'INFO',
        message: `Slug agak panjang (${normalizedSlug.length} karakter).`,
        location: 'slug',
        recommendation: 'Persingkat slug menjadi 3–6 kata kunci utama topik.'
      });
    }

    const isValid = issues.every((i) => i.severity !== 'CRITICAL');

    return {
      isValid,
      normalizedSlug,
      issues
    };
  }
}
