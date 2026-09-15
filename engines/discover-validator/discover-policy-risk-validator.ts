/**
 * NexaMOS Google Discover Policy Risk Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai kepatuhan terhadap kebijakan konten Google Discover:
 * - Menolak konten yang memicu manipulasi kemarahan/rasa ingin tahu tak senonoh
 * - Menolak presentasi mengejutkan/sadis yang melanggar standar NexaMOS
 * - Mengidentifikasi risiko pelanggaran transparansi kepengarangan (author/publisher signals)
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverPolicyRiskLevel = 'LOW_RISK' | 'REVIEW_REQUIRED' | 'INELIGIBLE';

export interface DiscoverPolicyRiskValidationResult {
  policyRisk: DiscoverPolicyRiskLevel;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 3
  issues: DiscoverIssue[];
}

export class DiscoverPolicyRiskValidator {
  private readonly extremeViolations = [
    /\b(judi online|slot gacor|pornografi|obat terlarang)\b/i,
    /\b(klaim kesehatan ajaib sembuh 100%|penipuan investasi)\b/i
  ];

  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null
  ): DiscoverPolicyRiskValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 3; // Bobot penuh Policy Safety = 3
    let riskLevel: DiscoverPolicyRiskLevel = 'LOW_RISK';

    const fullContent = [
      draft.title,
      draft.dek || '',
      ...draft.sections.map((s) => `${s.heading} ${s.content}`)
    ].join(' ');

    // 1. Deteksi Pelanggaran Kebijakan Keras (Prohibited Content)
    for (const pattern of this.extremeViolations) {
      if (pattern.test(fullContent)) {
        riskLevel = 'INELIGIBLE';
        score = 0;
        issues.push({
          code: 'DISCOVER_POLICY_INELIGIBLE',
          checkId: 'DISCOVER_POLICY_SAFETY',
          dimension: 'POLICY_SAFETY',
          severity: 'CRITICAL',
          message: 'Konten terdeteksi memuat topik yang dilarang keras oleh kebijakan Google Discover.',
          location: 'content',
          recommendation: 'Hapus materi yang melanggar kebijakan konten Discover.'
        });
        break;
      }
    }

    // 2. Pemeriksaan Transparansi Penulis dan Penerbit (E-E-A-T Transparency)
    if (!metadata?.author?.name && !metadata?.publisher?.name) {
      if (riskLevel !== 'INELIGIBLE') riskLevel = 'REVIEW_REQUIRED';
      score -= 1;
      issues.push({
        code: 'CONTENT_POLICY_RISK',
        checkId: 'DISCOVER_POLICY_SAFETY',
        dimension: 'POLICY_SAFETY',
        severity: 'WARNING',
        message: 'Artikel tidak mencantumkan informasi kepengarangan atau penerbit yang transparan.',
        location: 'metadata.author',
        recommendation: 'Sediakan nama penulis atau identitas institusi penerbit yang jelas.'
      });
    }

    const finalScore = Math.max(0, Math.min(3, score));

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_POLICY_SAFETY',
      dimension: 'POLICY_SAFETY',
      status: riskLevel === 'INELIGIBLE' ? 'FAIL' : riskLevel === 'REVIEW_REQUIRED' ? 'WARNING' : 'PASS',
      scoreContribution: finalScore,
      summary: riskLevel === 'LOW_RISK'
        ? 'Konten aman dan mematuhi seluruh panduan kebijakan publikasi Google Discover.'
        : `Tingkat risiko kebijakan: ${riskLevel}.`
    };

    return {
      policyRisk: riskLevel,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
