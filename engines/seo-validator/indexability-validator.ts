/**
 * NexaMOS Indexability Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Memvalidasi direktif robot (index/follow) dan konflik indeksabilitas.
 * HARD BLOCK: Artikel berstatus PUBLISHED dilarang memiliki direktif noindex (NOINDEX_ON_PUBLISHED_ARTICLE).
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from './article-seo-metadata.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface IndexabilityValidationResult {
  checkResult: SEOCheckResult;
  issues: SEOIssue[];
}

export class IndexabilityValidator {
  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null
  ): IndexabilityValidationResult {
    const issues: SEOIssue[] = [];
    const isPublished = metadata?.publicationStatus === 'PUBLISHED';
    const robots = metadata?.robots || { index: true, follow: true };
    let score = 100;

    // 1. HARD BLOCK: Noindex pada Artikel Published
    if (isPublished && !robots.index) {
      score = 0;
      issues.push({
        code: 'NOINDEX_ON_PUBLISHED_ARTICLE',
        checkId: 'INDEXABILITY',
        dimension: 'INDEXABILITY',
        severity: 'CRITICAL',
        message: 'Artikel berstatus PUBLISHED disetel dengan direktif "noindex". Artikel tidak akan dapat diindeks oleh search engine!',
        location: 'metadata.robots.index',
        recommendation: 'Aktifkan robots.index: true untuk artikel yang ditargetkan terbit di hasil pencarian.'
      });
    }

    // 2. Konflik nofollow pada artikel internal
    if (!robots.follow && isPublished) {
      score -= 30;
      issues.push({
        code: 'INDEXABILITY_CONFLICT',
        checkId: 'INDEXABILITY',
        dimension: 'INDEXABILITY',
        severity: 'WARNING',
        message: 'Direktif "nofollow" aktif pada artikel publikasi. Bot pencari dilarang menelusuri tautan internal naskah ini.',
        location: 'metadata.robots.follow',
        recommendation: 'Ubah menjadi robots.follow: true agar PageRank dan relevansi topik internal dapat mengalir.'
      });
    }

    // 3. Konflik canonical eksternal dengan direktif index
    if (metadata?.canonicalUrl && !metadata.canonicalUrl.includes('nexamos.com') && robots.index) {
      issues.push({
        code: 'INDEXABILITY_CONFLICT',
        checkId: 'INDEXABILITY',
        dimension: 'INDEXABILITY',
        severity: 'INFO',
        message: 'Artikel diindeks namun canonical mengarah ke domain luar (sindikasi). Search engine mungkin mengabaikan versi halaman ini.',
        location: 'metadata.canonicalUrl',
        recommendation: 'Pastikan sindikasi eksternal ini memang diinginkan.'
      });
    }

    // 4. Missing Primary Article Content Check
    if (!draft.sections || draft.sections.length === 0) {
      score = 0;
      issues.push({
        code: 'MISSING_PRIMARY_ARTICLE_CONTENT',
        checkId: 'INDEXABILITY',
        dimension: 'INDEXABILITY',
        severity: 'CRITICAL',
        message: 'Naskah artikel tidak memiliki konten seksi sama sekali (empty content). Bot search engine akan melihat halaman kosong (soft 404).',
        location: 'sections',
        recommendation: 'Lengkapi badan artikel dengan seksi konten sebelum memvalidasi indeksabilitas.'
      });
    }

    const checkResult: SEOCheckResult = {
      checkId: 'INDEXABILITY',
      dimension: 'INDEXABILITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: issues.length === 0
        ? 'Indeksabilitas bersih, direktif robot selaras, dan konten siap dirayapi bot pencari.'
        : `Ditemukan ${issues.length} catatan indeksabilitas.`
    };

    return {
      checkResult,
      issues
    };
  }
}
