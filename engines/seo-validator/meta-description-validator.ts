/**
 * NexaMOS Meta Description Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memeriksa kejujuran gambaran isi naskah, kejelasan topik, tidak misleading,
 * tidak keyword stuffing, dan tidak sekadar menduplikasi judul.
 * Menegaskan meta description sebagai presentasi pencarian (search presentation), bukan faktor ranking langsung.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from './article-seo-metadata.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface MetaDescriptionValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class MetaDescriptionValidator {
  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null
  ): MetaDescriptionValidationResult {
    const issues: SEOIssue[] = [];
    const description = metadata?.description?.trim() || draft.dek?.trim() || '';
    const title = (metadata?.title || draft.title || '').trim();
    let score = 100;

    // 1. Keberadaan Meta Description
    if (!description) {
      score -= 40;
      issues.push({
        code: 'META_DESCRIPTION_MISLEADING',
        checkId: 'META_DESCRIPTION_QUALITY',
        dimension: 'METADATA_QUALITY',
        severity: 'WARNING',
        message: 'Meta description belum diisi (snippet SERP akan bergantung pada auto-extract search engine).',
        location: 'metadata.description',
        recommendation: 'Sediakan ringkasan bernas 120–160 karakter yang menggambarkan nilai artikel bagi pembaca.'
      });
    } else {
      // 2. Periksa Duplikasi Judul (Bukan sekadar mengulang title)
      if (title && description.toLowerCase() === title.toLowerCase()) {
        score -= 30;
        issues.push({
          code: 'META_DESCRIPTION_DUPLICATE_TITLE',
          checkId: 'META_DESCRIPTION_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'WARNING',
          message: 'Meta description hanya mengulang judul artikel kata demi kata.',
          location: 'metadata.description',
          recommendation: 'Ubah meta description untuk memberikan konteks pelengkap, temuan kunci, atau janji wawasan bagi pembaca.'
        });
      }

      // 3. Length Risk (Panjang Karakter Optimal: 110 - 165 karakter)
      if (description.length < 50) {
        score -= 20;
        issues.push({
          code: 'META_DESCRIPTION_LENGTH_RISK',
          checkId: 'META_DESCRIPTION_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'INFO',
          message: `Meta description terlalu ringkas (${description.length} karakter). Ruang presentasi di snippet SERP belum dimanfaatkan optimal.`,
          location: 'metadata.description',
          recommendation: 'Perluas deskripsi hingga sekitar 120–160 karakter untuk memberikan gambaran yang lebih memikat.'
        });
      } else if (description.length > 170) {
        score -= 10;
        issues.push({
          code: 'META_DESCRIPTION_LENGTH_RISK',
          checkId: 'META_DESCRIPTION_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'INFO',
          message: `Meta description agak panjang (${description.length} karakter) dan berpotensi terpotong di snippet SERP (> 160 karakter).`,
          location: 'metadata.description',
          recommendation: 'Persingkat bagian penutup agar pesan penting tidak terpotong elipsis di Google.'
        });
      }

      // 4. Deteksi Keyword Stuffing (Pengulangan frasa/kata berkali-kali tanpa struktur wajar)
      const stuffingDetected = this.detectKeywordStuffing(description);
      if (stuffingDetected) {
        score -= 50;
        issues.push({
          code: 'META_DESCRIPTION_KEYWORD_STUFFING',
          checkId: 'META_DESCRIPTION_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'CRITICAL',
          message: `Terdeteksi indikasi keyword stuffing pada meta description: "${stuffingDetected}".`,
          location: 'metadata.description',
          recommendation: 'Gunakan kalimat natural yang informatif tanpa memaksakan pengulangan kata kunci secara berlebihan.'
        });
      }

      // 5. Periksa Keselarasan dengan Konten Nyata (Topic Clarity & Non-Misleading)
      const draftContentSample = draft.sections.map((s) => s.content).join(' ').toLowerCase();
      const descWords = description.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matchedInContent = descWords.filter((w) => draftContentSample.includes(w)).length;
      const descContentOverlap = descWords.length > 0 ? matchedInContent / descWords.length : 1;

      if (descContentOverlap < 0.2) {
        score -= 35;
        issues.push({
          code: 'META_DESCRIPTION_MISLEADING',
          checkId: 'META_DESCRIPTION_QUALITY',
          dimension: 'METADATA_QUALITY',
          severity: 'WARNING',
          message: 'Meta description menjanjikan topik/klaim yang tidak ditemukan pembahasannya di dalam naskah artikel.',
          location: 'metadata.description',
          recommendation: 'Pastikan deskripsi hanya merangkum hal-hal yang benar-benar ada di dalam artikel.'
        });
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'META_DESCRIPTION_QUALITY',
      dimension: 'METADATA_QUALITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: issues.length === 0
        ? 'Meta description informatif, jujur terhadap konten, dan proporsional untuk tampilan SERP.'
        : `Ditemukan ${issues.length} catatan meta description.`
    };

    return {
      checkResult,
      issues
    };
  }

  private detectKeywordStuffing(text: string): string | null {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const freq: Record<string, number> = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
      // Jika satu kata muncul 4 kali atau lebih dalam deskripsi pendek (biasanya hanya 20-25 kata)
      if (freq[w] >= 4) {
        return `Kata "${w}" diulang ${freq[w]} kali`;
      }
    }

    // Pola tumpukan koma keyword: "keyword a, keyword b, keyword c, keyword d, keyword e"
    if ((text.match(/,/g) || []).length >= 5 && words.length < 25) {
      return 'Daftar frasa beruntun dengan koma berlebihan';
    }

    return null;
  }
}
