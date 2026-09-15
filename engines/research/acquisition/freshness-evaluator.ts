/**
 * NexaMOS Source Freshness Evaluator
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Menilai kebaruan sumber berdasarkan tanggal publikasi dan volatilitas domain/topik.
 * Tidak menggunakan batas kedaluwarsa universal tunggal.
 */

import type { SourceType } from '../domain/source-type.ts';

export type FreshnessStatus = 'CURRENT' | 'AGING' | 'STALE' | 'UNKNOWN';
export type TopicVolatility = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FreshnessEvaluationInput {
  publicationDate?: string | null;
  topicVolatility: TopicVolatility;
  currentDate?: string | Date;
  sourceType?: SourceType | null;
}

export interface FreshnessAssessment {
  status: FreshnessStatus;
  ageInDays: number | null;
  volatility: TopicVolatility;
  rationale: string;
}

export class FreshnessEvaluator {
  evaluate(input: FreshnessEvaluationInput): FreshnessAssessment {
    const { publicationDate, topicVolatility, sourceType } = input;

    if (!publicationDate || publicationDate.trim().length === 0) {
      return {
        status: 'UNKNOWN',
        ageInDays: null,
        volatility: topicVolatility,
        rationale: 'Tanggal publikasi tidak tersedia dalam metadata sumber.'
      };
    }

    const pubTime = new Date(publicationDate).getTime();
    if (isNaN(pubTime)) {
      return {
        status: 'UNKNOWN',
        ageInDays: null,
        volatility: topicVolatility,
        rationale: `Format tanggal '${publicationDate}' tidak dapat diparsing sebagai ISO Date yang valid.`
      };
    }

    const now = input.currentDate ? new Date(input.currentDate).getTime() : Date.now();
    const diffMs = now - pubTime;
    const ageInDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Ambang batas hari berdasarkan volatilitas
    // HIGH: e.g. AI product features, search algorithm updates (1 thn CURRENT, 2 thn AGING)
    // MEDIUM: e.g. digital marketing benchmark, web standards (2 thn CURRENT, 4 thn AGING)
    // LOW: e.g. classic marketing theory, academic foundational frameworks (5 thn CURRENT, 10 thn AGING)
    let currentThresholdDays = 730; // default medium: 2 tahun
    let agingThresholdDays = 1460;  // default medium: 4 tahun

    if (topicVolatility === 'HIGH') {
      currentThresholdDays = 365;  // 1 tahun
      agingThresholdDays = 730;    // 2 tahun
    } else if (topicVolatility === 'LOW') {
      currentThresholdDays = 1825; // 5 tahun
      agingThresholdDays = 3650;   // 10 tahun
    }

    // Pengecualian: Regulasi pemerintah atau standar hukum formal berlaku lebih lama kecuali ada revisi
    if (sourceType === 'GOVERNMENT' || sourceType === 'REGULATOR') {
      currentThresholdDays = Math.round(currentThresholdDays * 1.5);
      agingThresholdDays = Math.round(agingThresholdDays * 1.5);
    }

    if (ageInDays <= currentThresholdDays) {
      return {
        status: 'CURRENT',
        ageInDays,
        volatility: topicVolatility,
        rationale: `Data berumur ${ageInDays} hari, masih berada dalam batas relevan (${currentThresholdDays} hari) untuk volatilitas ${topicVolatility}.`
      };
    }

    if (ageInDays <= agingThresholdDays) {
      return {
        status: 'AGING',
        ageInDays,
        volatility: topicVolatility,
        rationale: `Data berumur ${ageInDays} hari, mulai menua untuk domain ber-volatilitas ${topicVolatility} (batas kebaruan: ${currentThresholdDays} hari).`
      };
    }

    return {
      status: 'STALE',
      ageInDays,
      volatility: topicVolatility,
      rationale: `Data berumur ${ageInDays} hari, melebihi ambang batas keusangan (${agingThresholdDays} hari) untuk domain ${topicVolatility}.`
    };
  }
}
