/**
 * NexaMOS Opportunity Scorer Engine
 *
 * Sourced from NexaMOS Blog Master Reference & IDE Agent Doctrine v1.0 (Phase 1B)
 *
 * Menilai prioritas relatif antar-topik yang telah berstatus QUALIFIED
 * menggunakan 5 dimensi terbobot (TOPIC_PRIORITY_V1):
 *
 * 1. strategicValue            = 25% (0.25)
 * 2. audienceValue             = 25% (0.25)
 * 3. differentiationPotential  = 25% (0.25)
 * 4. timeliness                = 15% (0.15)
 * 5. evidenceReadiness         = 10% (0.10)
 *
 * Klasifikasi Prioritas:
 * 85–100 : CRITICAL
 * 70–84  : HIGH
 * 50–69  : MEDIUM
 * 30–49  : LOW
 * 0–29   : BACKLOG
 */

import type { Topic } from './domain/topic.types.ts';
import type {
  PriorityDimensions,
  PriorityWeights,
  PriorityClass,
  OpportunityScoringOutput
} from './domain/priority.types.ts';
import {
  DEFAULT_PRIORITY_WEIGHTS_V1,
  TOPIC_PRIORITY_POLICY_V1
} from './domain/priority.types.ts';

export interface OpportunityScorerOptions {
  weights?: PriorityWeights;
  scoringPolicyVersion?: string;
  allowSimulation?: boolean; // Izinkan scoring untuk topik yang belum QUALIFIED (untuk pengujian/simulasi)
}

export interface ScoreOpportunityResult {
  success: boolean;
  scoring?: OpportunityScoringOutput;
  error?: string;
}

/**
 * Menghitung Opportunity Score sebuah topik secara deterministik
 */
export function scoreOpportunity(
  topicOrDimensions: Partial<Topic> | PriorityDimensions,
  options: OpportunityScorerOptions = {}
): ScoreOpportunityResult {
  const policyVersion = options.scoringPolicyVersion || TOPIC_PRIORITY_POLICY_V1;
  const weights = options.weights || DEFAULT_PRIORITY_WEIGHTS_V1;

  // Jika input adalah Topic penuh, validasi status kualifikasi terlebih dahulu
  if ('status' in topicOrDimensions && !options.allowSimulation) {
    const topicStatus = topicOrDimensions.status;
    if (topicStatus !== 'QUALIFIED' && topicStatus !== 'PRIORITIZED') {
      return {
        success: false,
        error: `Topik berstatus '${topicStatus}' belum memenuhi syarat untuk opportunity scoring. Topik harus berstatus 'QUALIFIED' terlebih dahulu.`
      };
    }
  }

  // Ekstraksi dimensi prioritas
  const rawDims = extractDimensions(topicOrDimensions);
  if (!rawDims) {
    return {
      success: false,
      error: 'Dimensi prioritas tidak lengkap atau bernilai di luar batas 0–100.'
    };
  }

  // Hitung nilai terbobot (weighted values)
  const weightedValues: PriorityDimensions = {
    strategicValue: Number((rawDims.strategicValue * weights.strategicValue).toFixed(2)),
    audienceValue: Number((rawDims.audienceValue * weights.audienceValue).toFixed(2)),
    differentiationPotential: Number(
      (rawDims.differentiationPotential * weights.differentiationPotential).toFixed(2)
    ),
    timeliness: Number((rawDims.timeliness * weights.timeliness).toFixed(2)),
    evidenceReadiness: Number((rawDims.evidenceReadiness * weights.evidenceReadiness).toFixed(2))
  };

  // Jumlahkan nilai keseluruhan dan bulatkan ke integer terdekat (0–100)
  const unroundedOverall =
    weightedValues.strategicValue +
    weightedValues.audienceValue +
    weightedValues.differentiationPotential +
    weightedValues.timeliness +
    weightedValues.evidenceReadiness;

  const overall = Math.min(100, Math.max(0, Math.round(unroundedOverall)));
  const priorityClass = classifyPriority(overall);
  const summary = generateScoringSummary(rawDims, overall, priorityClass);

  return {
    success: true,
    scoring: {
      dimensions: rawDims,
      weights,
      weightedValues,
      overall,
      priorityClass,
      scoringPolicyVersion: policyVersion,
      scoredAt: new Date().toISOString(),
      summary
    }
  };
}

/**
 * Ekstraksi dan validasi dimensi prioritas (0–100)
 */
function extractDimensions(
  input: Partial<Topic> | PriorityDimensions
): PriorityDimensions | null {
  let dims: Partial<PriorityDimensions> | undefined;

  if ('priority' in input && input.priority) {
    dims = input.priority;
  } else {
    dims = input as Partial<PriorityDimensions>;
  }

  const {
    strategicValue,
    audienceValue,
    differentiationPotential,
    timeliness,
    evidenceReadiness
  } = dims;

  const allDefined =
    isValidScore(strategicValue) &&
    isValidScore(audienceValue) &&
    isValidScore(differentiationPotential) &&
    isValidScore(timeliness) &&
    isValidScore(evidenceReadiness);

  if (!allDefined) {
    return null;
  }

  return {
    strategicValue: strategicValue!,
    audienceValue: audienceValue!,
    differentiationPotential: differentiationPotential!,
    timeliness: timeliness!,
    evidenceReadiness: evidenceReadiness!
  };
}

function isValidScore(val?: number): boolean {
  return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 100;
}

/**
 * Mengklasifikasikan overall score ke dalam PriorityClass kanonikal
 */
export function classifyPriority(score: number): PriorityClass {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 30) return 'LOW';
  return 'BACKLOG';
}

/**
 * Menyusun ringkasan penjelasan rasional penentuan skor prioritas
 */
function generateScoringSummary(
  dims: PriorityDimensions,
  overall: number,
  priorityClass: PriorityClass
): string {
  const isEvidenceLagging = dims.evidenceReadiness < 40 && dims.strategicValue >= 80;

  if (isEvidenceLagging) {
    return `Prioritas ${priorityClass} (skor ${overall}) karena nilai strategis dan diferensiasi sangat kuat. Kesiapan bukti masih rendah (${dims.evidenceReadiness}), sehingga riset terfokus diperlukan sebelum fase produksi.`;
  }

  if (priorityClass === 'CRITICAL' || priorityClass === 'HIGH') {
    return `Prioritas ${priorityClass} (skor ${overall}) dengan keselarasan strategis tinggi (${dims.strategicValue}) dan potensi non-komoditas yang unggul (${dims.differentiationPotential}).`;
  }

  if (priorityClass === 'MEDIUM') {
    return `Prioritas ${priorityClass} (skor ${overall}) dengan nilai moderat di seluruh dimensi; dijadwalkan setelah prioritas tinggi selesai.`;
  }

  return `Prioritas ${priorityClass} (skor ${overall}); disimpan dalam antrean tunggu (backlog).`;
}
