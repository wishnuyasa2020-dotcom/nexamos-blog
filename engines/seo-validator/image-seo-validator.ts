/**
 * NexaMOS Image SEO Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memvalidasi atribut gambar (alt text, kejelasan nama file, dimensi, primary image).
 * DILARANG mengoptimasi gambar dengan keyword stuffing.
 */

import type { ArticleSEOImage } from './article-seo-metadata.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface ImageSEOValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class ImageSEOValidator {
  public validate(
    primaryImage?: ArticleSEOImage | null,
    additionalImages: ArticleSEOImage[] = []
  ): ImageSEOValidationResult {
    const issues: SEOIssue[] = [];
    const allImages = [...(primaryImage ? [primaryImage] : []), ...additionalImages];
    let score = 100;

    // Jika tidak ada gambar, bukan pelanggaran fatal (artikel teks murni diperbolehkan)
    if (allImages.length === 0) {
      return {
        checkResult: {
          checkId: 'IMAGE_SEO_QUALITY',
          dimension: 'METADATA_QUALITY',
          status: 'PASS',
          scoreContribution: 10,
          summary: 'Artikel tidak memuat gambar eksternal (naskah teks analitis murni).'
        },
        issues: []
      };
    }

    for (let idx = 0; idx < allImages.length; idx++) {
      const img = allImages[idx];
      const isPrimary = idx === 0 && Boolean(primaryImage);
      const label = isPrimary ? 'Primary Image' : `Image #${idx + 1}`;

      // 1. Alt Text Keberadaan & Kualitas
      const alt = (img.alt || '').trim();
      if (!alt) {
        score -= 25;
        issues.push({
          code: 'IMAGE_ALT_TEXT_MISSING',
          checkId: 'IMAGE_SEO_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'WARNING',
          message: `${label} tidak memiliki alt text (aksesibilitas dan image indexing terganggu).`,
          location: `images[${idx}].alt`,
          recommendation: 'Sediakan deskripsi alt text yang menjelaskan objek atau konteks diagram pada gambar.'
        });
      } else {
        // 2. Deteksi Keyword Stuffing pada Alt Text
        if (alt.split(/\s+/).length > 20 || (alt.match(/,/g) || []).length >= 4) {
          score -= 30;
          issues.push({
            code: 'IMAGE_KEYWORD_STUFFING',
            checkId: 'IMAGE_SEO_QUALITY',
            dimension: 'METADATA_QUALITY',
            severity: 'WARNING',
            message: `Alt text pada ${label} terindikasi keyword stuffing ("${alt.slice(0, 50)}...").`,
            location: `images[${idx}].alt`,
            recommendation: 'Gunakan deskripsi visual alami alih-alih daftar kata kunci bertumpuk.'
          });
        }
      }

      // 3. Filename Clarity (Hindari nama acak seperti IMG_00123.jpg atau screenshot_1.png)
      const filename = img.url.split('/').pop()?.split('?')[0] || '';
      if (/^(img|image|screenshot|dsc|dc|photo)[\-_0-9]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        score -= 10;
        issues.push({
          code: 'IMAGE_ALT_TEXT_MISSING',
          checkId: 'IMAGE_SEO_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'INFO',
          message: `Nama file gambar (${filename}) generik/acak.`,
          location: `images[${idx}].url`,
          recommendation: 'Gunakan nama berkas deskriptif yang memuat kata kunci subjek (contoh: nexamos-knowledge-moat-architecture.png).'
        });
      }

      // 4. Primary Image Dimension Check (Google Discover & SERP Rich Snippet: min 1200px width recommended)
      if (isPrimary && img.width && img.width < 1200) {
        score -= 10;
        issues.push({
          code: 'IMAGE_ALT_TEXT_MISSING',
          checkId: 'IMAGE_SEO_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'INFO',
          message: `Lebar primary image (${img.width}px) di bawah 1200px (disarankan min 1200px untuk kelayakan Google Discover dan SERP thumbnail besar).`,
          location: `primaryImage.width`,
          recommendation: 'Gunakan aset visual beresolusi minimal 1200px lebar.'
        });
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'IMAGE_SEO_QUALITY',
      dimension: 'METADATA_QUALITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))),
      summary: issues.length === 0
        ? 'Seluruh aset gambar teroptimasi dengan alt text deskriptif dan metadata visual yang baik.'
        : `Ditemukan ${issues.length} catatan optimasi gambar.`
    };

    return {
      checkResult,
      issues
    };
  }
}
