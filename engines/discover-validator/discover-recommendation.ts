/**
 * NexaMOS Google Discover Recommendations Engine & Cross-Engine Router
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menghasilkan rekomendasi terarah dengan penegakan batas tanggung jawab lintas-mesin:
 * - title misleading -> RETURN_TO_EDITORIAL
 * - visual missing/low-res -> VISUAL_IMPROVEMENT
 * - noindex / technical -> RETURN_TO_SEO_TECHNICAL
 * - weak topical cluster -> TOPICAL_CLUSTER_IMPROVEMENT
 * DILARANG mengarang trend, keahlian, atau proyeksi performa.
 */

import type { DiscoverIssue, DiscoverRecommendation } from './discover-validation.ts';

export class DiscoverRecommendationEngine {
  public generate(issues: DiscoverIssue[]): DiscoverRecommendation[] {
    const recommendations: DiscoverRecommendation[] = [];

    for (const issue of issues) {
      switch (issue.code) {
        case 'DISCOVER_CLICKBAIT_RISK':
        case 'SENSATIONAL_TITLE':
        case 'TITLE_CONTENT_MISMATCH':
        case 'CRITICAL_TITLE_DECEPTION':
          recommendations.push({
            type: 'TITLE_IMPROVEMENT',
            title: `Perbaikan Integritas Judul [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Ganti judul dengan rumusan masalah yang jujur dan berbobot.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'LOW_DISCOVER_ORIGINALITY':
        case 'INSUFFICIENT_TOPIC_DEPTH':
          recommendations.push({
            type: 'EDITORIAL_IMPROVEMENT',
            title: `Peningkatan Kedalaman & Orisinalitas [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Perdalam analisis dengan data riset unik dan framework konseptual.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'VISUAL_ASSET_MISSING':
        case 'VISUAL_LOW_RESOLUTION':
        case 'VISUAL_NON_LANDSCAPE':
        case 'VISUAL_GENERIC_LOGO':
        case 'VISUAL_TEXT_HEAVY':
        case 'LARGE_IMAGE_PREVIEW_RESTRICTED':
          recommendations.push({
            type: 'VISUAL_IMPROVEMENT',
            title: `Optimasi Aset Visual [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Sediakan visual lanskap 1200px dan aktifkan max-image-preview:large.',
            crossEngineDestination: 'VISUAL_DESIGN'
          });
          break;

        case 'ISOLATED_TOPIC_RISK':
          recommendations.push({
            type: 'TOPICAL_CLUSTER_IMPROVEMENT',
            title: `Penguatan Kluster Topik [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Bangun konten pendukung di territory pengetahuan yang sama.',
            crossEngineDestination: 'CONTENT_STRATEGY'
          });
          break;

        case 'CONTENT_NOT_INDEXABLE':
          recommendations.push({
            type: 'TECHNICAL_FIX',
            title: `Koreksi Direktif Indeks [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Perbaiki konfigurasi robots.index: true di layer SEO.',
            crossEngineDestination: 'SEO_TECHNICAL'
          });
          break;

        case 'STALE_TIME_SENSITIVE_CONTENT':
          recommendations.push({
            type: 'FRESHNESS_REVIEW',
            title: `Peninjauan Kesegaran Konten [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Periksa aktualitas data dan perbarui temuan riset jika relevan.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'PAGE_EXPERIENCE_POOR':
        case 'UNVERIFIED_PAGE_EXPERIENCE':
          recommendations.push({
            type: 'PAGE_EXPERIENCE_REVIEW',
            title: `Audit Pengalaman Halaman [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Verifikasi keramahan mobile dan stabilitas tata letak halaman.',
            crossEngineDestination: 'SEO_TECHNICAL'
          });
          break;

        default:
          recommendations.push({
            type: 'EDITORIAL_IMPROVEMENT',
            title: `Catatan Kesiapan Discover [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Tinjau kembali keselarasan dengan pedoman Discover.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;
      }
    }

    return recommendations;
  }
}
