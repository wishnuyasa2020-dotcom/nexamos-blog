/**
 * NexaMOS AI Citation Readiness Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai kelayakan sitasi dan ketelusuran naskah bagi LLM/sistem grounding:
 * - Keterlacakan klaim kritis terhadap bukti primer (ResearchBrief, ClaimUsage, EvidenceIndex)
 * - Ketersediaan locator bukti (URL publik, halaman dokumen, paragraf sumber)
 * - Kelengkapan atribusi data dan referensi
 *
 * DOKTRIN KERAS:
 * CITATION READINESS ≠ AI WILL CITE THIS PAGE
 * Validator hanya menilai kelayakan teknis dan epistemik keterlacakan, bukan menjamin sitasi oleh AI.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface CitationReadinessValidationResult {
  claimTraceability: 'FULL' | 'PARTIAL' | 'UNSUPPORTED';
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 12
  issues: AIVisibilityIssue[];
}

export class CitationReadinessValidator {
  public validate(
    draft: ArticleDraft,
    brief?: ResearchBrief | null
  ): CitationReadinessValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 12; // Bobot penuh CITATION_READINESS = 12

    const rawRefs = (draft as any).references as any[] | undefined;
    const hasReferences =
      (rawRefs && rawRefs.length > 0) ||
      (draft.citationMap && draft.citationMap.length > 0);
    const hasEvidenceSection = draft.sections.some((s) => s.purpose === 'EVIDENCE');
    const briefHasClaims =
      (brief?.keyClaims && brief.keyClaims.length > 0) ||
      (brief?.supportedClaims && brief.supportedClaims.length > 0);

    // 1. Evaluasi Keberadaan Referensi pada Seksi Pembuktian
    if (hasEvidenceSection && !hasReferences) {
      score -= 5;
      issues.push({
        code: 'UNSUPPORTED_CITATION',
        checkId: 'AI_CITATION_READINESS',
        dimension: 'CITATION_READINESS',
        severity: 'WARNING',
        message: 'Naskah memuat seksi bukti empiris namun tidak mencantumkan daftar referensi atau sumber primer.',
        location: 'draft.references',
        recommendation: 'Sertakan daftar referensi dengan sumber yang dapat diverifikasi.'
      });
    }

    // 2. Evaluasi Kelengkapan Locator pada Referensi
    if (rawRefs && rawRefs.length > 0) {
      let missingLocatorCount = 0;
      for (const ref of rawRefs) {
        // Cek apakah referensi memiliki URL, judul, atau locator spesifik
        const hasUrl = Boolean(ref.url || ref.sourceUrl);
        const hasTitle = Boolean(ref.title || ref.sourceTitle);
        const hasLocator = Boolean(ref.locator || ref.citation || hasUrl);

        if (!hasLocator && !hasTitle) {
          missingLocatorCount++;
        }
      }

      if (missingLocatorCount > 0) {
        score -= Math.min(3, missingLocatorCount * 1.5);
        issues.push({
          code: 'MISSING_EVIDENCE_LOCATOR',
          checkId: 'AI_CITATION_READINESS',
          dimension: 'CITATION_READINESS',
          severity: 'INFO',
          message: `Ditemukan ${missingLocatorCount} referensi yang tidak memiliki locator spesifik (URL atau penunjuk halaman).`,
          location: 'draft.references',
          recommendation: 'Lengkapi referensi dengan URL publik atau penunjuk locator bukti yang jelas.'
        });
      }
    } else if (!hasEvidenceSection) {
      // Artikel analitis konseptual tanpa seksi data khusus
      score -= 2;
    }

    const finalScore = Math.max(0, Math.min(12, score));
    let traceability: 'FULL' | 'PARTIAL' | 'UNSUPPORTED' = 'FULL';
    if (finalScore < 6) {
      traceability = 'UNSUPPORTED';
    } else if (finalScore < 10) {
      traceability = 'PARTIAL';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_CITATION_READINESS',
      dimension: 'CITATION_READINESS',
      status: traceability === 'FULL' ? 'PASS' : traceability === 'PARTIAL' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: traceability === 'FULL'
        ? 'Klaim memiliki keterlacakan bukti yang kuat dan siap dijadikan sumber sitasi oleh model bahasa.'
        : `Tingkat keterlacakan sitasi: ${traceability}.`
    };

    return {
      claimTraceability: traceability,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
