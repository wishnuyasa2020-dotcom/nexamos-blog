/**
 * NexaMOS Google Discover Local Relevance Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Google Discover 2026 Core Update meningkatkan penayangan konten yang relevan secara lokal bagi pengguna negara asal.
 * DOKTRIN KERAS: LOCAL != WAJIB. Artikel global TIDAK otomatis buruk.
 * LOCAL_RELEVANCE adalah sinyal peluang (opportunity signal), BUKAN persyaratan kaku.
 * DILARANG menyuntikkan sudut pandang Indonesia secara paksa jika tidak relevan.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverLocalScope =
  | 'GLOBAL'
  | 'INDONESIA'
  | 'REGIONAL'
  | 'LOCAL'
  | 'NOT_APPLICABLE';

export interface DiscoverLocalRelevanceValidationResult {
  localScope: DiscoverLocalScope;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 2
  issues: DiscoverIssue[];
}

export class DiscoverLocalRelevanceValidator {
  public validate(
    draft: ArticleDraft,
    topic?: Topic | null
  ): DiscoverLocalRelevanceValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 2; // Bobot dimensi Local Relevance = 2
    let scope: DiscoverLocalScope = 'GLOBAL';

    const fullText = [
      draft.title,
      draft.thesis,
      draft.editorialAngle,
      ...draft.sections.map((s) => s.content)
    ].join(' ').toLowerCase();

    // Deteksi konteks lokal Indonesia
    const hasIndonesiaSignal =
      /\b(indonesia|jakarta|kemkominfo|kominfo|umkm|asia tenggara|b2b indonesia|pasar domestik)\b/i.test(fullText) ||
      (topic?.audience?.segment && /indonesia|lokal/i.test(topic.audience.segment));

    if (hasIndonesiaSignal) {
      scope = 'INDONESIA';
      score = 2; // Peluang Discover lokal maksimal
    } else {
      // Jika topik bersifat global analitis (misal arsitektur teknologi umum)
      scope = 'GLOBAL';
      score = 2; // Doktrin: LOCAL != WAJIB, artikel global valid tetap bernilai penuh
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_LOCAL_RELEVANCE',
      dimension: 'LOCAL_RELEVANCE',
      status: 'PASS',
      scoreContribution: score,
      summary: scope === 'INDONESIA'
        ? 'Memiliki relevansi lokal Indonesia yang kuat untuk audiens domestik Google Discover.'
        : 'Topik berskala global yang tetap memenuhi syarat kelayakan Discover.'
    };

    return {
      localScope: scope,
      checkResult,
      score,
      issues
    };
  }
}
