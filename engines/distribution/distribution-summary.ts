/**
 * NexaMOS Explainable Distribution Summary Generator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5D specifications.
 * Menghasilkan narasi ringkasan keputusan gerbang distribusi yang transparan,
 * lugas, dan bebas dari pseudo-reasoning / chain-of-thought artifisial.
 */

import type { ReviewStatus } from '../editorial/review/editorial-review.ts';
import type { SEOClassification } from '../seo-validator/seo-validation.ts';
import type { DiscoverClassification } from '../discover-validator/discover-validation.ts';
import type { AIVisibilityClassification } from '../ai-visibility/ai-visibility-validation.ts';
import type { DistributionIssue, UnifiedDistributionStatus } from './distribution-readiness.ts';

export class DistributionSummaryGenerator {
  /**
   * Menghasilkan ringkasan keputusan explainable untuk gate distribusi
   */
  public generate(params: {
    overallStatus: UnifiedDistributionStatus;
    editorialStatus: ReviewStatus;
    seoClassification: SEOClassification;
    discoverClassification: DiscoverClassification;
    aiClassification: AIVisibilityClassification;
    blockers: DistributionIssue[];
    warnings: DistributionIssue[];
  }): string {
    const {
      overallStatus,
      editorialStatus,
      seoClassification,
      discoverClassification,
      aiClassification,
      blockers,
      warnings
    } = params;

    const parts: string[] = [];

    // Bagian 1: Status Utama
    if (overallStatus === 'READY_TO_PUBLISH') {
      parts.push(
        `Artikel telah lolos seluruh validasi gerbang distribusi dan siap dipublikasikan (READY_TO_PUBLISH).`
      );
      parts.push(
        `Editorial lolos (${editorialStatus}), SEO (${seoClassification}), Google Discover (${discoverClassification}), dan AI Visibility (${aiClassification}) seluruhnya memenuhi standar kesiapan minimum tanpa kendala teknis atau editorial.`
      );
      return parts.join(' ');
    }

    if (overallStatus === 'READY_WITH_WARNINGS') {
      parts.push(
        `Artikel berstatus siap dipublikasikan dengan catatan peringatan non-kritis (READY_WITH_WARNINGS).`
      );
      parts.push(
        `Evaluasi saluran: Editorial (${editorialStatus}), SEO (${seoClassification}), Discover (${discoverClassification}), dan AI Visibility (${aiClassification}).`
      );

      if (warnings.length > 0) {
        const topWarningMessages = warnings.slice(0, 3).map((w) => w.message);
        parts.push(
          `Terdapat ${warnings.length} catatan penyempurnaan non-pemblokir publikasi: ${topWarningMessages.join('; ')}.`
        );
      }
      return parts.join(' ');
    }

    if (overallStatus === 'RETURN_FOR_REVISION') {
      parts.push(
        `Artikel dikembalikan untuk revisi substantif (RETURN_FOR_REVISION) sebelum dapat melangkah ke tahap penerbitan.`
      );
      const revisionCauses: string[] = [];
      if (seoClassification === 'REVISION_REQUIRED') revisionCauses.push('SEO membutuhkan penajaman diferensiasi/struktur');
      if (discoverClassification === 'REVISION_REQUIRED') revisionCauses.push('Google Discover membutuhkan peningkatan kedalaman/orisinalitas');
      if (aiClassification === 'REVISION_REQUIRED') revisionCauses.push('AI Visibility membutuhkan klarifikasi keterlacakan klaim/entitas');

      if (revisionCauses.length > 0) {
        parts.push(`Penyebab revisi: ${revisionCauses.join(', ')}.`);
      }
      return parts.join(' ');
    }

    // Kasus BLOCKED
    parts.push(`Publikasi artikel DIBLOKIR (BLOCKED) karena terdapat pelanggaran kebijakan atau kendala teknis kritis.`);

    const blockerReasons: string[] = [];
    if (editorialStatus !== 'PASS') {
      blockerReasons.push(`Persetujuan editorial belum terpenuhi (status: ${editorialStatus})`);
    }
    if (seoClassification === 'BLOCKED') {
      blockerReasons.push('Kendala kritis teknis SEO terdeteksi');
    }
    if (discoverClassification === 'INELIGIBLE') {
      blockerReasons.push('Artikel tidak memenuhi syarat kelayakan Google Discover');
    }
    if (aiClassification === 'BLOCKED') {
      blockerReasons.push('Fitur generatif AI terhalang konfigurasi situs atau integritas kritis');
    }

    for (const b of blockers.slice(0, 3)) {
      if (!blockerReasons.some((r) => r.includes(b.message))) {
        blockerReasons.push(b.message);
      }
    }

    if (blockerReasons.length > 0) {
      parts.push(`Faktor pemblokir: ${blockerReasons.join('; ')}.`);
    }

    return parts.join(' ');
  }
}
