/**
 * NexaMOS Heading Structure Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memvalidasi hierarki semantik heading: H1 unik, tidak ada level heading yang melompat rusak,
 * dan heading bersifat semantis-informatif.
 * DILARANG memaksakan satu H2 untuk setiap keyword target.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface HeadingStructureValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class HeadingStructureValidator {
  private readonly genericHeadings = new Set([
    'pendahuluan', 'latar belakang', 'pembahasan', 'isi', 'penjelasan',
    'kesimpulan', 'penutup', 'ringkasan', 'summary', 'introduction', 'conclusion'
  ]);

  public validate(draft: ArticleDraft): HeadingStructureValidationResult {
    const issues: SEOIssue[] = [];
    let score = 100;

    // 1. Validasi H1 (Judul Artikel harus ada dan unik sebagai H1 semantik)
    if (!draft.title || draft.title.trim().length === 0) {
      score -= 50;
      issues.push({
        code: 'HEADING_STRUCTURE_INVALID',
        checkId: 'HEADING_STRUCTURE',
        dimension: 'HEADING_STRUCTURE',
        severity: 'CRITICAL',
        message: 'Naskah tidak memiliki judul artikel utama (H1 tidak terdefinisi).',
        location: 'title',
        recommendation: 'Tentukan judul artikel utama sebagai tag H1 tunggal.'
      });
    }

    // 2. Validasi Seksi Headings (Level H2/H3)
    if (!draft.sections || draft.sections.length === 0) {
      score -= 50;
      issues.push({
        code: 'HEADING_STRUCTURE_INVALID',
        checkId: 'HEADING_STRUCTURE',
        dimension: 'HEADING_STRUCTURE',
        severity: 'CRITICAL',
        message: 'Naskah tidak memiliki seksi konten atau subjudul (H2).',
        location: 'sections',
        recommendation: 'Bagi naskah menjadi beberapa seksi terstruktur dengan subjudul H2.'
      });
    } else {
      let genericCount = 0;
      let emptyHeadingCount = 0;

      for (let i = 0; i < draft.sections.length; i++) {
        const sec = draft.sections[i];
        const heading = (sec.heading || '').trim();

        if (heading.length === 0) {
          emptyHeadingCount++;
          continue;
        }

        // Periksa apakah judul subseksi identik dengan H1 (duplikasi H1 sebagai H2)
        if (heading.toLowerCase() === draft.title.toLowerCase()) {
          score -= 20;
          issues.push({
            code: 'HEADING_STRUCTURE_INVALID',
            checkId: 'HEADING_STRUCTURE',
            dimension: 'HEADING_STRUCTURE',
            severity: 'WARNING',
            message: `Heading seksi [${sec.id}] menduplikasi H1 artikel secara persis.`,
            location: `section [${sec.id}]`,
            recommendation: 'Gunakan subjudul yang lebih spesifik untuk topik seksi tersebut.'
          });
        }

        // Periksa generic headings berlebihan
        const normalized = heading.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
        if (this.genericHeadings.has(normalized)) {
          genericCount++;
        }
      }

      if (emptyHeadingCount > 0) {
        score -= 25;
        issues.push({
          code: 'HEADING_STRUCTURE_INVALID',
          checkId: 'HEADING_STRUCTURE',
          dimension: 'HEADING_STRUCTURE',
          severity: 'WARNING',
          message: `Ditemukan ${emptyHeadingCount} seksi tanpa heading (subjudul kosong).`,
          location: 'sections',
          recommendation: 'Berikan subjudul H2 yang deskriptif pada setiap seksi.'
        });
      }

      if (genericCount >= 3) {
        score -= 20;
        issues.push({
          code: 'GENERIC_HEADING_EXCESS',
          checkId: 'HEADING_STRUCTURE',
          dimension: 'HEADING_STRUCTURE',
          severity: 'WARNING',
          message: `Terlalu banyak subjudul generik klise (${genericCount} seksi seperti "Pendahuluan" / "Pembahasan" / "Kesimpulan").`,
          location: 'headings',
          recommendation: 'Rumuskan subjudul yang lebih spesifik, kontekstual, dan sarat makna.'
        });
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'HEADING_STRUCTURE',
      dimension: 'HEADING_STRUCTURE',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: issues.length === 0
        ? 'Struktur hierarki heading logis, unik pada H1, dan semantis pada subjudul.'
        : `Ditemukan ${issues.length} catatan struktur heading.`
    };

    return {
      checkResult,
      issues
    };
  }
}
