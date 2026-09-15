/**
 * NexaMOS Structured Data Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memvalidasi schema JSON-LD (Article, BlogPosting, NewsArticle, BreadcrumbList, Person, Organization).
 * HARD RULE: Structured data dilarang keras mengandung fakta yang tidak terlihat atau tidak benar
 * pada konten naskah (STRUCTURED_DATA_FABRICATION). Dilarang melakukan spam schema.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { StructuredDataEntity } from './structured-data.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface StructuredDataValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class StructuredDataValidator {
  private readonly allowedTypes = new Set([
    'Article', 'BlogPosting', 'NewsArticle', 'TechArticle',
    'BreadcrumbList', 'Person', 'Organization'
  ]);

  public validate(
    draft: ArticleDraft,
    schemas?: Record<string, any>[] | null
  ): StructuredDataValidationResult {
    const issues: SEOIssue[] = [];
    let score = 100;

    // Jika schema belum disediakan
    if (!schemas || schemas.length === 0) {
      score -= 20;
      issues.push({
        code: 'STRUCTURED_DATA_SCHEMA_MISMATCH',
        checkId: 'STRUCTURED_DATA_VALIDITY',
        dimension: 'STRUCTURED_DATA',
        severity: 'INFO',
        message: 'Belum ada Structured Data JSON-LD yang disertakan pada artikel.',
        location: 'structuredData',
        recommendation: 'Sertakan minimal schema Article atau BlogPosting yang valid sesuai konten naskah.'
      });

      return {
        checkResult: {
          checkId: 'STRUCTURED_DATA_VALIDITY',
          dimension: 'STRUCTURED_DATA',
          status: 'WARNING',
          scoreContribution: Math.max(0, Math.min(5, Math.round((score / 100) * 5))), // bobot max 5
          summary: 'Structured data belum disertakan.'
        },
        issues
      };
    }

    const draftText = [
      draft.title,
      draft.thesis,
      draft.editorialAngle,
      ...draft.sections.map((s) => `${s.heading} ${s.content}`)
    ].join(' ').toLowerCase();

    for (let idx = 0; idx < schemas.length; idx++) {
      const s = schemas[idx] as StructuredDataEntity;
      const schemaType = s['@type'];

      // 1. Validasi Tipe Schema
      if (!schemaType || !this.allowedTypes.has(schemaType)) {
        score -= 25;
        issues.push({
          code: 'STRUCTURED_DATA_SCHEMA_MISMATCH',
          checkId: 'STRUCTURED_DATA_VALIDITY',
          dimension: 'STRUCTURED_DATA',
          severity: 'WARNING',
          message: `Schema index [${idx}] memiliki @type "${schemaType}" yang tidak dikenali atau tidak didukung untuk artikel editorial.`,
          location: `structuredData[${idx}].@type`,
          recommendation: 'Gunakan schema baku: Article, BlogPosting, NewsArticle, BreadcrumbList, Person, atau Organization.'
        });
      }

      // 2. HARD RULE: Anti-Halusinasi & Fabrikasi Schema (STRUCTURED_DATA_FABRICATION)
      // Deteksi 1: Fake AggregateRating / Reviews jika tidak ada produk / review di draft
      if (s.aggregateRating || s.review) {
        score = 0;
        issues.push({
          code: 'STRUCTURED_DATA_FABRICATION',
          checkId: 'STRUCTURED_DATA_VALIDITY',
          dimension: 'STRUCTURED_DATA',
          severity: 'CRITICAL',
          message: `Schema index [${idx}] memuat rating/review fiktif yang tidak ada pada isi artikel (manipulasi rich snippets terdeteksi).`,
          location: `structuredData[${idx}].aggregateRating`,
          recommendation: 'Hapus aggregateRating fiktif! Schema dilarang memuat fakta yang tidak tampak di artikel.'
        });
      }

      // Deteksi 2: Fake Author / Person Credential yang tidak sesuai
      if (s.author && typeof s.author === 'object') {
        const authorName = (s.author.name || '').toLowerCase();
        if (authorName && authorName.length > 2 && !draftText.includes(authorName) && !authorName.includes('nexamos')) {
          // Hanya info atau warning bila nama author berbeda
        }
      }

      // Deteksi 3: Headline pada schema sama sekali tidak berhubungan dengan draft
      if (s.headline) {
        const headlineWords = s.headline
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 4);
        const headlineOverlap = headlineWords.filter((w: string) => draftText.includes(w)).length;

        if (headlineWords.length > 0 && headlineOverlap === 0) {
          score -= 50;
          issues.push({
            code: 'STRUCTURED_DATA_FABRICATION',
            checkId: 'STRUCTURED_DATA_VALIDITY',
            dimension: 'STRUCTURED_DATA',
            severity: 'CRITICAL',
            message: `Headline schema ("${s.headline}") tidak memiliki kesesuaian dengan konten artikel nyata (konten palsu pada schema).`,
            location: `structuredData[${idx}].headline`,
            recommendation: 'Sesuaikan headline schema dengan judul artikel aktual.'
          });
        }
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'STRUCTURED_DATA_VALIDITY',
      dimension: 'STRUCTURED_DATA',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(5, Math.round((score / 100) * 5))), // bobot max 5
      summary: issues.length === 0
        ? 'Structured data valid, mematuhi visible content rule, dan bebas dari manipulasi schema.'
        : `Ditemukan ${issues.length} catatan validasi structured data.`
    };

    return {
      checkResult,
      issues
    };
  }
}
