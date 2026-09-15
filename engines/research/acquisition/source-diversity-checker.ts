/**
 * NexaMOS Source Diversity Checker
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Memeriksa keragaman penerbit, variasi tipe sumber, dan bauran primer/sekunder
 * untuk mencegah terjadinya mono-kultur sumber riset.
 */

import type { SourceCandidate } from './source-candidate.ts';
import type { SourceType } from '../domain/source-type.ts';

export interface SourceDiversityAssessment {
  isDiverse: boolean;
  totalSources: number;
  distinctPublishersCount: number;
  distinctSourceTypesCount: number;
  dominantPublisherRatio: number;
  primarySourcesCount: number;
  warnings: string[];
}

export class SourceDiversityChecker {
  checkDiversity(candidates: SourceCandidate[]): SourceDiversityAssessment {
    const totalSources = candidates.length;
    const warnings: string[] = [];

    if (totalSources === 0) {
      return {
        isDiverse: true,
        totalSources: 0,
        distinctPublishersCount: 0,
        distinctSourceTypesCount: 0,
        dominantPublisherRatio: 0,
        primarySourcesCount: 0,
        warnings: []
      };
    }

    // 1. Publisher Counts
    const publisherCounts = new Map<string, number>();
    let unnamedPublisherCount = 0;

    for (const c of candidates) {
      const pub = (c.publisher || '').trim().toLowerCase();
      if (!pub) {
        unnamedPublisherCount++;
      } else {
        publisherCounts.set(pub, (publisherCounts.get(pub) || 0) + 1);
      }
    }

    let maxSinglePublisherCount = 0;
    for (const count of publisherCounts.values()) {
      if (count > maxSinglePublisherCount) {
        maxSinglePublisherCount = count;
      }
    }

    const dominantPublisherRatio = totalSources > 0 ? maxSinglePublisherCount / totalSources : 0;
    const distinctPublishersCount = publisherCounts.size + (unnamedPublisherCount > 0 ? 1 : 0);

    if (totalSources >= 3 && dominantPublisherRatio > 0.6) {
      warnings.push(`Satu penerbit mendominasi ${(dominantPublisherRatio * 100).toFixed(0)}% dari seluruh sumber kandidat.`);
    }

    // 2. Source Type Counts
    const typeSet = new Set<SourceType>();
    let primaryCount = 0;

    for (const c of candidates) {
      if (c.sourceType) {
        typeSet.add(c.sourceType);
        if (this.isPrimary(c.sourceType)) {
          primaryCount++;
        }
      }
    }

    const distinctSourceTypesCount = typeSet.size;

    if (totalSources >= 3 && distinctSourceTypesCount < 2) {
      warnings.push('Seluruh sumber bertipe sama. Disarankan mengumpulkan variasi tipe sumber yang berbeda.');
    }

    if (totalSources >= 3 && primaryCount === 0) {
      warnings.push('Tidak ada sumber primer atau dokumentasi resmi dalam kumpulan sumber yang diakuisisi.');
    }

    const isDiverse = warnings.length === 0;

    return {
      isDiverse,
      totalSources,
      distinctPublishersCount,
      distinctSourceTypesCount,
      dominantPublisherRatio: Math.round(dominantPublisherRatio * 100) / 100,
      primarySourcesCount: primaryCount,
      warnings
    };
  }

  private isPrimary(type: SourceType): boolean {
    return (
      type === 'OFFICIAL_DOCUMENTATION' ||
      type === 'GOVERNMENT' ||
      type === 'REGULATOR' ||
      type === 'PRIMARY_RESEARCH' ||
      type === 'INTERNAL_DATA' ||
      type === 'ACADEMIC_PAPER'
    );
  }
}
