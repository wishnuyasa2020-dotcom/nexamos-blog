/**
 * NexaMOS Internal Link Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Menemukan peluang internal link kontekstual dari repositori artikel/topik yang tersedia.
 * Memeriksa risiko artikel yatim (orphan risk), kejelasan anchor text, dan mendeteksi anchor duplikat/hampa.
 * DILARANG membuat tautan palsu ke URL yang belum ada di repositori.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { InternalLinkCandidate, ExistingArticleIndexItem } from './internal-link.ts';
import type { SEOCheckResult, SEOIssue } from './seo-validation.ts';

export interface InternalLinkValidationResult {
  checkResult: SEOCheckResult;
  candidates: InternalLinkCandidate[];
  issues: SEOIssue[];
}

export class InternalLinkValidator {
  private readonly genericAnchors = new Set([
    'klik di sini', 'klik disini', 'di sini', 'disini', 'baca di sini',
    'baca selengkapnya', 'link ini', 'tautan ini', 'pelajari lebih lanjut',
    'click here', 'read more', 'learn more'
  ]);

  public validate(
    draft: ArticleDraft,
    availableArticles: ExistingArticleIndexItem[] = []
  ): InternalLinkValidationResult {
    const issues: SEOIssue[] = [];
    const candidates: InternalLinkCandidate[] = [];
    let score = 100;

    // Filter keluar artikel yang sama dengan draf saat ini
    const otherArticles = availableArticles.filter(
      (a) => a.id !== draft.id && a.topicId !== draft.topicId
    );

    // 1. Pindai Tautan Internal yang Sudah Ada di Dalam Konten Draf
    const existingLinksInContent: Array<{ url: string; anchor: string; sectionId: string }> = [];
    for (const sec of draft.sections) {
      // Regex markdown link: [anchor text](url)
      const matches = sec.content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const m of matches) {
        const anchor = m[1].trim();
        const url = m[2].trim();
        existingLinksInContent.push({ url, anchor, sectionId: sec.id });

        // Cek generic anchor text
        if (this.genericAnchors.has(anchor.toLowerCase())) {
          score -= 15;
          issues.push({
            code: 'DUPLICATE_ANCHOR_ISSUE',
            checkId: 'INTERNAL_LINK_OPPORTUNITY',
            dimension: 'INTERNAL_LINKING',
            severity: 'WARNING',
            message: `Anchor text terlalu generik ("${anchor}") pada seksi [${sec.id}].`,
            location: `section [${sec.id}]`,
            recommendation: 'Gunakan kata benda entitas atau frasa deskriptif sebagai anchor text.'
          });
        }

        // Cek apakah internal link merujuk ke domain internal tetapi tidak terdaftar di repositori
        if (url.startsWith('/') || url.includes('nexamos.com')) {
          const targetExists = availableArticles.some(
            (a) => a.url === url || url.endsWith(`/${a.slug}`)
          );
          if (!targetExists && availableArticles.length > 0) {
            score -= 25;
            issues.push({
              code: 'ORPHAN_ARTICLE_RISK',
              checkId: 'INTERNAL_LINK_OPPORTUNITY',
              dimension: 'INTERNAL_LINKING',
              severity: 'WARNING',
              message: `Tautan internal ke "${url}" tidak ditemukan dalam repositori artikel aktif (risiko broken internal link).`,
              location: `section [${sec.id}]`,
              recommendation: 'Pastikan URL tujuan sudah diterbitkan atau gunakan artikel terdaftar.'
            });
          }
        }
      }
    }

    // 2. Temukan Peluang Tautan Internal Kontekstual dari Repositori
    for (const target of otherArticles) {
      const targetConcepts = [
        target.title,
        target.slug.replace(/-/g, ' '),
        ...(target.keyConcepts || [])
      ].map((c) => c.toLowerCase());

      for (const sec of draft.sections) {
        const secContentLower = sec.content.toLowerCase();

        for (const concept of targetConcepts) {
          if (concept.length > 4 && secContentLower.includes(concept)) {
            // Hindari duplikasi kandidat yang sama
            if (!candidates.some((c) => c.targetArticleId === target.id)) {
              candidates.push({
                targetArticleId: target.id,
                targetTitle: target.title,
                targetSlug: target.slug,
                targetTopicId: target.topicId,
                relevanceScore: 85,
                suggestedAnchorText: target.title,
                sourceSectionId: sec.id,
                targetUrl: target.url || `/blog/${target.slug}`
              });
            }
          }
        }
      }
    }

    // 3. Evaluasi Orphan Article Risk
    // Jika artikel tidak memiliki tautan keluar internal sama sekali dan ada kandidat yang relevan di repositori
    if (existingLinksInContent.length === 0 && otherArticles.length > 0) {
      if (candidates.length === 0) {
        score -= 20;
        issues.push({
          code: 'ORPHAN_ARTICLE_RISK',
          checkId: 'INTERNAL_LINK_OPPORTUNITY',
          dimension: 'INTERNAL_LINKING',
          severity: 'INFO',
          message: 'Artikel belum menautkan ke konten internal lain di dalam portofolio blog (potensi isolasi topik).',
          location: 'sections',
          recommendation: 'Kaitkan dengan pilar konten atau artikel relevan lain dalam territory yang sama.'
        });
      } else {
        // Ada peluang tetapi belum dipasang
        issues.push({
          code: 'ORPHAN_ARTICLE_RISK',
          checkId: 'INTERNAL_LINK_OPPORTUNITY',
          dimension: 'INTERNAL_LINKING',
          severity: 'INFO',
          message: `Ditemukan ${candidates.length} peluang tautan internal relevan dari repositori yang dapat dipasang.`,
          location: 'sections',
          recommendation: `Pertimbangkan menautkan ke: "${candidates[0].targetTitle}".`
        });
      }
    }

    const checkResult: SEOCheckResult = {
      checkId: 'INTERNAL_LINK_OPPORTUNITY',
      dimension: 'INTERNAL_LINKING',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, Math.round((score / 100) * 10))), // bobot max 10
      summary: issues.length === 0
        ? 'Struktur tautan internal sehat, deskriptif, dan terhubung dengan repositori topik.'
        : `Ditemukan ${candidates.length} peluang tautan dan ${issues.length} catatan internal linking.`
    };

    return {
      checkResult,
      candidates,
      issues
    };
  }
}
