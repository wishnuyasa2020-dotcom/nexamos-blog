/**
 * NexaMOS Google Discover Interest Fit Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai keselarasan naskah dengan lingkungan konten berbasis minat (interest-based environment).
 * DOKTRIN KERAS: DILARANG mengarang status trending. Tanpa data eksternal, status hanya:
 * SUPPORTED_BY_CONTEXT | UNKNOWN | WEAK. JANGAN pernah mengeluarkan TRENDING = true tanpa data empiris.
 */

import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverInterestFitStatus = 'SUPPORTED_BY_CONTEXT' | 'UNKNOWN' | 'WEAK';

export interface DiscoverInterestFitValidationResult {
  interestFitStatus: DiscoverInterestFitStatus;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 10
  issues: DiscoverIssue[];
}

export class DiscoverInterestFitValidator {
  public validate(
    draft: ArticleDraft,
    topic?: Topic | null
  ): DiscoverInterestFitValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 10; // Bobot penuh dimensi Interest Fit = 10
    let status: DiscoverInterestFitStatus = 'SUPPORTED_BY_CONTEXT';

    const whyNow = topic?.whyNow?.trim() || '';
    const audienceProblem = topic?.problem?.trim() || '';
    const editorialAngle = draft.editorialAngle?.trim() || '';

    // Evaluasi sinyal minat berdasarkan konteks masalah audiens dan urgensi waktu
    if (!whyNow && !audienceProblem) {
      status = 'UNKNOWN';
      score = 5;
      issues.push({
        code: 'WEAK_INTEREST_ALIGNMENT',
        checkId: 'DISCOVER_INTEREST_FIT',
        dimension: 'INTEREST_FIT',
        severity: 'INFO',
        message: 'Topik tidak memiliki deskripsi urgensi audiens (whyNow/problem kosong). Alasan kemunculan di interest feed kurang jelas.',
        location: 'topic.whyNow',
        recommendation: 'Definisikan dinamika pasar atau masalah berulang yang dihadapi audiens.'
      });
    } else if (whyNow.length < 15 && editorialAngle.length < 15) {
      status = 'WEAK';
      score = 6;
      issues.push({
        code: 'WEAK_INTEREST_ALIGNMENT',
        checkId: 'DISCOVER_INTEREST_FIT',
        dimension: 'INTEREST_FIT',
        severity: 'WARNING',
        message: 'Sudut pandang minat audiens lemah atau terlalu generik untuk memantik ketertarikan di feed Discover.',
        location: 'draft.editorialAngle',
        recommendation: 'Tajamkan sudut pandang agar relevan dengan ketegangan atau dilema nyata yang dihadapi pembaca.'
      });
    } else {
      status = 'SUPPORTED_BY_CONTEXT';
      score = 10;
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_INTEREST_FIT',
      dimension: 'INTEREST_FIT',
      status: status === 'WEAK' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, score)),
      summary: status === 'SUPPORTED_BY_CONTEXT'
        ? 'Memiliki dasar minat audiens yang kuat berdasarkan dinamika pasar dan urgensi topik.'
        : `Status keselarasan minat: ${status}.`
    };

    return {
      interestFitStatus: status,
      checkResult,
      score,
      issues
    };
  }
}
