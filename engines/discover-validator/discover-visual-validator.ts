/**
 * NexaMOS Google Discover Visual Readiness Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Google Discover Guidelines:
 * - Gambar beresolusi tinggi (lebar minimal 1200px, total piksel > 300.000)
 * - Rasio lanskap (16:9 disukai, bukan persyaratan mutlak)
 * - Bukan logo situs generik (not generic logo)
 * - Tidak sarat teks (not excessively text-heavy)
 * - max-image-preview:large aktif untuk mengizinkan thumbnail besar (tanpa mewajibkan AMP)
 */

import type { DiscoverVisualAsset, DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverVisualReadinessLevel = 'OPTIMAL' | 'ACCEPTABLE' | 'WEAK' | 'MISSING';

export interface DiscoverVisualValidationResult {
  visualReadiness: DiscoverVisualReadinessLevel;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 15
  issues: DiscoverIssue[];
}

export class DiscoverVisualValidator {
  public validate(
    primaryAsset?: DiscoverVisualAsset | null,
    maxImagePreview = 'large'
  ): DiscoverVisualValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 15; // Bobot penuh Visual Readiness = 15
    let visualReadiness: DiscoverVisualReadinessLevel = 'OPTIMAL';

    // 1. Pemeriksaan Keberadaan Aset Visual
    if (!primaryAsset || !primaryAsset.url) {
      visualReadiness = 'MISSING';
      score = 0;
      issues.push({
        code: 'VISUAL_ASSET_MISSING',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'WARNING',
        message: 'Artikel tidak memiliki aset visual (gambar utama) untuk kartu Google Discover.',
        location: 'primaryImage',
        recommendation: 'Sediakan gambar lanskap menarik dengan resolusi minimal 1200px lebar.'
      });

      return {
        visualReadiness,
        checkResult: {
          checkId: 'DISCOVER_VISUAL_READINESS',
          dimension: 'VISUAL_READINESS',
          status: 'WARNING',
          scoreContribution: 0,
          summary: 'Aset visual tidak ditemukan.'
        },
        score: 0,
        issues
      };
    }

    // 2. Pemeriksaan Logo Generik
    if (primaryAsset.isLogo || primaryAsset.isGeneric) {
      visualReadiness = 'WEAK';
      score -= 8;
      issues.push({
        code: 'VISUAL_GENERIC_LOGO',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'WARNING',
        message: 'Gambar utama teridentifikasi sebagai logo situs atau ikon generik. Discover menolak logo sebagai gambar kartu artikel.',
        location: 'primaryImage.isLogo',
        recommendation: 'Ganti dengan ilustrasi editorial, diagram arsitektur, atau visual kontekstual yang mewakili topik.'
      });
    }

    // 3. Pemeriksaan Resolusi Google (Lebar >= 1200px & Total Pixels > 300.000)
    const width = primaryAsset.width || 0;
    const height = primaryAsset.height || 0;
    const totalPixels = primaryAsset.totalPixels || width * height;

    if (width > 0 && width < 1200) {
      score -= 5;
      issues.push({
        code: 'VISUAL_LOW_RESOLUTION',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'WARNING',
        message: `Lebar gambar (${width}px) di bawah standar rekomendasi Google Discover (minimal 1200px).`,
        location: 'primaryImage.width',
        recommendation: 'Unggah aset visual dengan lebar minimal 1200px.'
      });
      if (visualReadiness === 'OPTIMAL') visualReadiness = 'ACCEPTABLE';
    }

    if (totalPixels > 0 && totalPixels < 300000) {
      score -= 3;
      issues.push({
        code: 'VISUAL_LOW_RESOLUTION',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'INFO',
        message: `Total piksel gambar (${totalPixels} px) di bawah rekomendasi Google Discover (> 300.000 px).`,
        location: 'primaryImage.totalPixels',
        recommendation: 'Gunakan gambar beresolusi tinggi.'
      });
    }

    // 4. Pemeriksaan Rasio Aspek (Landscape / 16:9)
    if (width > 0 && height > 0) {
      const ratio = width / height;
      if (ratio < 1.1) {
        // Gambar portrait atau kotak
        score -= 4;
        issues.push({
          code: 'VISUAL_NON_LANDSCAPE',
          checkId: 'DISCOVER_VISUAL_READINESS',
          dimension: 'VISUAL_READINESS',
          severity: 'INFO',
          message: 'Format gambar bukan lanskap. Kartu Google Discover dioptimalkan untuk rasio lanskap (16:9 disukai).',
          location: 'primaryImage.aspectRatio',
          recommendation: 'Gunakan rasio aspek lanskap sekitar 16:9.'
        });
        if (visualReadiness === 'OPTIMAL') visualReadiness = 'ACCEPTABLE';
      }
    }

    // 5. Pemeriksaan Kepadatan Teks (Text Density)
    if (primaryAsset.textDensity === 'HIGH') {
      score -= 3;
      issues.push({
        code: 'VISUAL_TEXT_HEAVY',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'WARNING',
        message: 'Gambar mengandung terlalu banyak teks bertumpuk (text-heavy banner). Visual yang sarat teks kurang disukai di feed Discover.',
        location: 'primaryImage.textDensity',
        recommendation: 'Kurangi teks pada gambar dan utamakan visualisasi konseptual yang bersih.'
      });
    }

    // 6. Pemeriksaan max-image-preview:large
    if (maxImagePreview !== 'large') {
      score -= 4;
      issues.push({
        code: 'LARGE_IMAGE_PREVIEW_RESTRICTED',
        checkId: 'DISCOVER_VISUAL_READINESS',
        dimension: 'VISUAL_READINESS',
        severity: 'WARNING',
        message: `Direktif pratinjau gambar dibatasi ("${maxImagePreview}"). Google Discover memerlukan "max-image-preview:large" untuk menampilkan thumbnail berukuran penuh.`,
        location: 'robots.max-image-preview',
        recommendation: 'Setel meta tag robots atau header HTTP menjadi max-image-preview:large.'
      });
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_VISUAL_READINESS',
      dimension: 'VISUAL_READINESS',
      status: visualReadiness === 'MISSING' || visualReadiness === 'WEAK' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, score)),
      summary: visualReadiness === 'OPTIMAL'
        ? 'Aset visual beresolusi tinggi, berformat lanskap, bebas logo, dan mendukung max-image-preview:large.'
        : `Kesiapan visual Discover: ${visualReadiness}.`
    };

    return {
      visualReadiness,
      checkResult,
      score,
      issues
    };
  }
}
