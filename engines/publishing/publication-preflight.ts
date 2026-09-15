/**
 * NexaMOS Publication Preflight Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Menjalankan inspeksi preflight komprehensif sebelum naskah dapat dirilis ke produksi.
 * Menegakkan larangan keras (Hard Preflight Blocks) termasuk kebocoran data sintetis (fixture).
 */

import type { PublicationPackage } from './publication.ts';
import type { UnifiedDistributionReadinessResult } from '../distribution/distribution-readiness.ts';

export type PreflightStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';

export interface PreflightCheckItem {
  checkId: string;
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  blocking: boolean;
}

export interface PreflightValidationResult {
  packageId: string;
  articleId: string;
  status: PreflightStatus;
  checks: PreflightCheckItem[];
  blockingErrors: string[];
  warnings: string[];
  evaluatedAt: string;
}

export interface PreflightOptions {
  existingPublishedSlugs?: Map<string, string>; // slug -> articleId
  distributionResult?: UnifiedDistributionReadinessResult | null;
}

const RESERVED_SLUGS = new Set([
  'index',
  'blog',
  'api',
  'feed',
  'sitemap',
  'admin',
  'rss',
  'search',
  'draft',
  'tag',
  'category',
  'author'
]);

export class PublicationPreflightValidator {
  /**
   * Menjalankan seluruh pemeriksaan preflight terhadap PublicationPackage
   */
  public validate(
    pkg: PublicationPackage,
    options: PreflightOptions = {}
  ): PreflightValidationResult {
    const checks: PreflightCheckItem[] = [];
    const blockingErrors: string[] = [];
    const warnings: string[] = [];
    const evaluatedAt = new Date().toISOString();

    // 1. HARD SAFETY CHECK: Larangan Kebocoran Data Sintetis / Test Fixture
    if (pkg.isSyntheticTestData || pkg.fixtureOnly) {
      this.addCheck(
        checks,
        blockingErrors,
        'PRODUCTION_SYNTHETIC_DATA_BLOCKED',
        'Integritas Data Produksi (Anti-Fixture Leak)',
        'FAIL',
        'Data sintetis pengujian terdeteksi pada paket produksi. DILARANG KERAS mempublikasikan fixture sintetis sebagai konten nyata.',
        true
      );
    } else {
      this.addCheck(
        checks,
        blockingErrors,
        'PRODUCTION_DATA_INTEGRITY',
        'Integritas Data Produksi (Anti-Fixture Leak)',
        'PASS',
        'Paket bebas dari penanda fixture sintetis.',
        false
      );
    }

    // 2. Pemeriksaan Status Kelayakan Distribusi (Unified Gate)
    if (options.distributionResult) {
      if (options.distributionResult.overallStatus === 'BLOCKED') {
        this.addCheck(
          checks,
          blockingErrors,
          'UNRESOLVED_DISTRIBUTION_BLOCKER',
          'Status Gerbang Distribusi Terpadu',
          'FAIL',
          `Distribusi artikel berstatus BLOCKED: ${options.distributionResult.summary}`,
          true
        );
      } else if (options.distributionResult.editorialStatus !== 'PASS') {
        this.addCheck(
          checks,
          blockingErrors,
          'EDITORIAL_PASS_REQUIRED',
          'Persetujuan Editorial',
          'FAIL',
          `Status editorial belum PASS (status saat ini: ${options.distributionResult.editorialStatus}).`,
          true
        );
      } else {
        this.addCheck(
          checks,
          blockingErrors,
          'DISTRIBUTION_GATE_ELIGIBILITY',
          'Status Gerbang Distribusi Terpadu',
          'PASS',
          'Artikel memenuhi syarat gerbang distribusi.',
          false
        );
      }
    }

    // 3. Pemeriksaan Validitas Slug & Deteksi Kolisi Slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!pkg.slug || !slugRegex.test(pkg.slug)) {
      this.addCheck(
        checks,
        blockingErrors,
        'SLUG_FORMAT_INVALID',
        'Format Slug URL',
        'FAIL',
        `Format slug '${pkg.slug}' tidak valid. Slug harus lowercase alphanumeric dengan tanda hubung.`,
        true
      );
    } else if (RESERVED_SLUGS.has(pkg.slug)) {
      this.addCheck(
        checks,
        blockingErrors,
        'SLUG_RESERVED_COLLISION',
        'Format Slug URL',
        'FAIL',
        `Slug '${pkg.slug}' merupakan kata kunci sistem yang dicadangkan.`,
        true
      );
    } else if (
      options.existingPublishedSlugs &&
      options.existingPublishedSlugs.has(pkg.slug) &&
      options.existingPublishedSlugs.get(pkg.slug) !== pkg.articleId
    ) {
      this.addCheck(
        checks,
        blockingErrors,
        'SLUG_COLLISION_DETECTED',
        'Keunikan Slug URL',
        'FAIL',
        `Slug '${pkg.slug}' telah digunakan oleh artikel lain (${options.existingPublishedSlugs.get(pkg.slug)}).`,
        true
      );
    } else {
      this.addCheck(
        checks,
        blockingErrors,
        'SLUG_VALID',
        'Format & Keunikan Slug URL',
        'PASS',
        'Slug valid dan bebas konflik.',
        false
      );
    }

    // 4. Pemeriksaan Keberadaan Konten Primer (Body Sections)
    const sections = pkg.articleContent?.sections || [];
    const totalContentLength = sections.reduce((acc, s) => acc + s.content.trim().length, 0);

    if (sections.length === 0 || totalContentLength === 0) {
      this.addCheck(
        checks,
        blockingErrors,
        'ARTICLE_BODY_MISSING',
        'Ketersediaan Konten Primer',
        'FAIL',
        'Artikel tidak memuat seksi tubuh konten primer atau konten kosong.',
        true
      );
    } else if (totalContentLength < 200) {
      this.addCheck(
        checks,
        warnings,
        'ARTICLE_BODY_SHORT_WARNING',
        'Panjang Konten Primer',
        'WARNING',
        'Panjang konten primer kurang dari 200 karakter. Disarankan pengayaan materi.',
        false
      );
    } else {
      this.addCheck(
        checks,
        blockingErrors,
        'ARTICLE_BODY_AVAILABLE',
        'Ketersediaan Konten Primer',
        'PASS',
        `Konten primer tersedia (${sections.length} seksi, ${totalContentLength} karakter).`,
        false
      );
    }

    // 5. Pemeriksaan Judul dan Deskripsi
    if (!pkg.title || pkg.title.trim().length === 0) {
      this.addCheck(
        checks,
        blockingErrors,
        'TITLE_MISSING',
        'Judul Artikel',
        'FAIL',
        'Judul artikel tidak boleh kosong.',
        true
      );
    }

    if (!pkg.description || pkg.description.trim().length === 0) {
      this.addCheck(
        checks,
        blockingErrors,
        'DESCRIPTION_MISSING',
        'Deskripsi Meta Artikel',
        'FAIL',
        'Deskripsi artikel tidak boleh kosong.',
        true
      );
    }

    // 6. Pemeriksaan Penulis (Author)
    if (!pkg.author || !pkg.author.name || pkg.author.name.trim().length === 0) {
      this.addCheck(
        checks,
        blockingErrors,
        'AUTHOR_MISSING',
        'Atribusi Penulis',
        'FAIL',
        'Penulis naskah harus tercantum secara transparan.',
        true
      );
    }

    // 7. Pemeriksaan Direktif Robots (Anti-Unintentional-Noindex)
    if (pkg.robots?.index === false) {
      this.addCheck(
        checks,
        blockingErrors,
        'NOINDEX_ON_PUBLISHED_ARTICLE',
        'Direktif Robots Indexability',
        'FAIL',
        'Direktif robots disetel noindex pada paket publikasi produksi.',
        true
      );
    } else {
      this.addCheck(
        checks,
        blockingErrors,
        'ROBOTS_INDEXABLE',
        'Direktif Robots Indexability',
        'PASS',
        'Direktif robots mengizinkan perayapan dan pengindeksan.',
        false
      );
    }

    // 8. Pemeriksaan Hero Image untuk Discover
    if (!pkg.heroImage) {
      this.addCheck(
        checks,
        warnings,
        'HERO_IMAGE_ABSENT_WARNING',
        'Hero Image untuk Discover',
        'WARNING',
        'Artikel tidak memiliki hero image primer. Pengalaman visual Discover tidak akan optimal.',
        false
      );
    } else {
      if (!pkg.heroImage.alt || pkg.heroImage.alt.trim().length === 0) {
        this.addCheck(
          checks,
          warnings,
          'HERO_IMAGE_ALT_MISSING',
          'Aksesibilitas Gambar',
          'WARNING',
          'Hero image tidak memiliki alt text deskriptif.',
          false
        );
      }
      if (pkg.heroImage.width < 1200) {
        this.addCheck(
          checks,
          warnings,
          'HERO_IMAGE_WIDTH_SUBOPTIMAL',
          'Spesifikasi Lebar Gambar Discover',
          'WARNING',
          `Lebar hero image (${pkg.heroImage.width}px) di bawah standar optimal Google Discover (1200px).`,
          false
        );
      }
    }

    // 9. Evaluasi Status Akhir Preflight
    let status: PreflightStatus = 'PASS';
    if (blockingErrors.length > 0) {
      status = 'FAIL';
    } else if (warnings.length > 0) {
      status = 'PASS_WITH_WARNINGS';
    }

    return {
      packageId: pkg.id,
      articleId: pkg.articleId,
      status,
      checks,
      blockingErrors,
      warnings,
      evaluatedAt
    };
  }

  private addCheck(
    checks: PreflightCheckItem[],
    errorBucket: string[],
    checkId: string,
    name: string,
    status: 'PASS' | 'WARNING' | 'FAIL',
    message: string,
    blocking: boolean
  ): void {
    checks.push({
      checkId,
      name,
      status,
      message,
      blocking
    });

    if (status === 'FAIL' && blocking) {
      errorBucket.push(`[${checkId}] ${message}`);
    } else if (status === 'WARNING') {
      errorBucket.push(`[${checkId}] ${message}`);
    }
  }
}
