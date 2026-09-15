/**
 * NexaMOS Research Source Quality Assessment
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 2A specifications
 */

export interface SourceQualityDimensions {
  authority: number; // 0 - 100
  relevance: number; // 0 - 100
  recency: number; // 0 - 100
  methodologicalTransparency: number; // 0 - 100
  independence: number; // 0 - 100
  verifiability: number; // 0 - 100
}

export interface SourceQualityAssessment extends SourceQualityDimensions {
  qualitySummary: string;
}

export function validateQualityDimensions(dims: Partial<SourceQualityDimensions>): string[] {
  const errors: string[] = [];
  const keys: (keyof SourceQualityDimensions)[] = [
    'authority',
    'relevance',
    'recency',
    'methodologicalTransparency',
    'independence',
    'verifiability'
  ];

  for (const k of keys) {
    const val = dims[k];
    if (val === undefined || typeof val !== 'number') {
      errors.push(`Dimensi kualitas '${k}' wajib diisi berupa angka.`);
    } else if (val < 0 || val > 100) {
      errors.push(`Dimensi kualitas '${k}' harus berada dalam rentang 0-100 (diterima: ${val}).`);
    }
  }

  return errors;
}

export function computeAverageQuality(dims: SourceQualityDimensions): number {
  const total =
    dims.authority +
    dims.relevance +
    dims.recency +
    dims.methodologicalTransparency +
    dims.independence +
    dims.verifiability;
  return Math.round((total / 6) * 10) / 10;
}
