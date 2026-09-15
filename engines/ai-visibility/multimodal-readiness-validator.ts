/**
 * NexaMOS AI Multimodal Readiness Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai kesiapan aset visual dan multimedia untuk sistem AI multimodal:
 * - Keberadaan diagram arsitektur konseptual atau visual penjelas
 * - Deskripsi konteks alt-text yang informatif
 * - Metadata video (jika ada, tanpa mewajibkan setiap artikel memiliki video)
 *
 * DOKTRIN UTAMA:
 * Jangan memaksa semua artikel memiliki video! Penilaian difokuskan pada nilai penjelas visual.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { DiscoverVisualAsset } from '../discover-validator/discover-validation.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface MultimodalSignals {
  primaryAsset?: DiscoverVisualAsset | null;
  hasConceptualDiagram?: boolean;
  hasVideoAttachment?: boolean;
  videoMetadata?: {
    title?: string;
    description?: string;
  };
}

export interface MultimodalReadinessValidationResult {
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 3
  issues: AIVisibilityIssue[];
}

export class MultimodalReadinessValidator {
  public validate(
    draft: ArticleDraft,
    signals?: MultimodalSignals | null
  ): MultimodalReadinessValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 3; // Bobot penuh MULTIMODAL_READINESS = 3

    const hasVisual = Boolean(signals?.primaryAsset?.url);
    const hasAlt = Boolean(signals?.primaryAsset?.alt && signals.primaryAsset.alt.trim().length > 5);
    const hasDiagram = Boolean(signals?.hasConceptualDiagram);

    if (!hasVisual) {
      score -= 2;
      issues.push({
        code: 'MISSING_EXPLANATORY_VISUAL',
        checkId: 'AI_MULTIMODAL_READINESS',
        dimension: 'MULTIMODAL_READINESS',
        severity: 'INFO',
        message: 'Artikel tidak memiliki aset visual penjelas atau diagram konseptual.',
        location: 'visual_assets',
        recommendation: 'Sediakan diagram arsitektur atau infografis kontekstual untuk memperkaya pemahaman model AI multimodal.'
      });
    } else if (!hasAlt) {
      score -= 1;
    }

    if (hasDiagram || signals?.hasVideoAttachment) {
      score = 3; // Bonus visual optimal
    }

    const finalScore = Math.max(0, Math.min(3, score));

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_MULTIMODAL_READINESS',
      dimension: 'MULTIMODAL_READINESS',
      status: finalScore >= 2 ? 'PASS' : 'WARNING',
      scoreContribution: finalScore,
      summary: finalScore >= 2
        ? 'Aset visual memiliki nilai penjelas dan deskripsi konteks yang baik untuk sistem multimodal.'
        : 'Perlu pengayaan aset visual penjelas.'
    };

    return {
      checkResult,
      score: finalScore,
      issues
    };
  }
}
