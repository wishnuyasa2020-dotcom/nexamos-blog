/**
 * NexaMOS Evidence Sufficiency Policy
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 * Mengevaluasi apakah suatu ResearchProject telah memenuhi standar evidence
 * yang disyaratkan oleh Topic (E0-E4) dan tidak memiliki kontradiksi kritis tak terselesaikan.
 */

import type { EvidenceLevel } from '../ideation/domain/evidence-level.ts';
import type { ResearchClaim } from './domain/research-claim.ts';
import type { ResearchSource } from './domain/research-source.ts';
import type { ClaimGroundingResult } from './claim-grounding-evaluator.ts';
import type { ResearchGap } from './domain/research-gap.ts';

export type SufficiencyStatus = 'SUFFICIENT' | 'INSUFFICIENT' | 'REVIEW_REQUIRED';

export interface EvidenceSufficiencyInput {
  requiredEvidenceLevel: EvidenceLevel;
  claims: ResearchClaim[];
  claimGroundingResults: ClaimGroundingResult[];
  sources: ResearchSource[];
}

export interface EvidenceSufficiencyResult {
  status: SufficiencyStatus;
  highestAchievedLevel: EvidenceLevel;
  requiredLevelMet: boolean;
  missingEvidence: string[];
  gaps: ResearchGap[];
  summary: string;
}

const LEVEL_RANK: Record<EvidenceLevel, number> = {
  E0: 0,
  E1: 1,
  E2: 2,
  E3: 3,
  E4: 4
};

export function evaluateEvidenceSufficiency(
  input: EvidenceSufficiencyInput
): EvidenceSufficiencyResult {
  const { requiredEvidenceLevel, claims, claimGroundingResults, sources } = input;

  const missingEvidence: string[] = [];
  const gaps: ResearchGap[] = [];

  // 1. Cek ketersediaan sumber
  if (sources.length === 0) {
    missingEvidence.push('Belum ada sumber referensi yang dikumpulkan.');
    gaps.push({
      type: 'MISSING_PRIMARY_SOURCE',
      description: 'Seluruh sumber referensi riset masih kosong.'
    });
  }

  // 2. Evaluasi level evidence tertinggi yang dicapai oleh sources
  let maxRank = 0;
  let highestAchievedLevel: EvidenceLevel = 'E0';

  for (const src of sources) {
    const rank = LEVEL_RANK[src.evidenceLevel] ?? 0;
    if (rank > maxRank) {
      maxRank = rank;
      highestAchievedLevel = src.evidenceLevel;
    }
  }

  const reqRank = LEVEL_RANK[requiredEvidenceLevel] ?? 0;
  const requiredLevelMet = maxRank >= reqRank;

  if (!requiredLevelMet) {
    missingEvidence.push(
      `Diperlukan bukti dengan standar minimal ${requiredEvidenceLevel}, namun level tertinggi yang tercapai saat ini adalah ${highestAchievedLevel}.`
    );

    if (reqRank >= 3) {
      gaps.push({
        type: 'MISSING_PRIMARY_SOURCE',
        description: `Proyek membutuhkan bukti primer atau otoritatif (${requiredEvidenceLevel}), namun sumber yang tersedia baru mencapai ${highestAchievedLevel}.`
      });
    }
  }

  // 3. Evaluasi status claims
  const groundingMap = new Map<string, ClaimGroundingResult>();
  for (const res of claimGroundingResults) {
    groundingMap.set(res.claimId, res);
  }

  let hasUnresolvedCriticalContradiction = false;
  let hasCriticalDispute = false;
  let hasCriticalUnsupported = false;
  let criticalClaimsCount = 0;

  for (const claim of claims) {
    const grounding = groundingMap.get(claim.id);
    const status = grounding?.claimStatus || claim.status;

    if (claim.importance === 'CRITICAL') {
      criticalClaimsCount++;

      if (status === 'DISPUTED') {
        hasCriticalDispute = true;
        gaps.push({
          type: 'UNRESOLVED_CONTRADICTION',
          description: `Klaim kritis '${claim.statement}' memiliki bukti pendukung dan penyangkal yang bertentangan secara kuat (Disputed).`,
          claimId: claim.id
        });
      } else if (status === 'CONTRADICTED') {
        hasUnresolvedCriticalContradiction = true;
        gaps.push({
          type: 'UNRESOLVED_CONTRADICTION',
          description: `Klaim kritis '${claim.statement}' disangkal oleh bukti empiris (Contradicted).`,
          claimId: claim.id
        });
      } else if (status === 'UNVERIFIED' || status === 'INSUFFICIENT_EVIDENCE') {
        hasCriticalUnsupported = true;
        missingEvidence.push(
          `Klaim kritis '${claim.statement}' belum memiliki bukti pendukung yang memadai.`
        );
      }
    }
  }

  // 4. Periksa recency risk
  const recencyRiskSources = sources.filter((s) => s.recencyRisk === 'HIGH');
  if (recencyRiskSources.length > 0) {
    gaps.push({
      type: 'MISSING_CURRENT_DATA',
      description: `Terdapat ${recencyRiskSources.length} sumber dengan risiko kebaruan data tinggi (outdated / historical changes).`
    });
  }

  // 5. Penentuan status sufficiency
  let status: SufficiencyStatus = 'INSUFFICIENT';
  let summary = '';

  if (sources.length === 0 || claims.length === 0) {
    status = 'INSUFFICIENT';
    summary = 'Proyek riset belum memiliki data sumber atau klaim yang memadai.';
  } else if (hasCriticalDispute || hasUnresolvedCriticalContradiction) {
    status = 'REVIEW_REQUIRED';
    summary =
      'Terdapat kontradiksi atau persengketaan bukti pada klaim kritis yang menuntut review editorial.';
  } else if (!requiredLevelMet || hasCriticalUnsupported) {
    status = 'INSUFFICIENT';
    summary = `Kecukupan bukti belum tercapai. ${missingEvidence.join(' ')}`;
  } else {
    status = 'SUFFICIENT';
    summary = `Kecukupan bukti terpenuhi secara memuaskan pada level ${highestAchievedLevel} (Target: ${requiredEvidenceLevel}). Seluruh klaim kritis terbukti terdukung.`;
  }

  return {
    status,
    highestAchievedLevel,
    requiredLevelMet,
    missingEvidence,
    gaps,
    summary
  };
}
