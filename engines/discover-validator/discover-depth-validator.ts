/**
 * NexaMOS Google Discover Depth Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Discover 2026 Core Update memberi prioritas tinggi pada in-depth content.
 * DOKTRIN: Depth BUKAN word count!
 * Depth dinilai dari: problem coverage, evidence depth, analysis, context,
 * implication, limitations, dan framework/synthesis.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverDepthLevel = 'SHALLOW' | 'ADEQUATE' | 'IN_DEPTH';

export interface DiscoverDepthValidationResult {
  depthLevel: DiscoverDepthLevel;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 15
  issues: DiscoverIssue[];
}

export class DiscoverDepthValidator {
  public validate(draft: ArticleDraft): DiscoverDepthValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 15; // Bobot penuh dimensi Depth = 15

    const purposes = new Set(draft.sections.map((s) => s.purpose));
    const hasEvidence = purposes.has('EVIDENCE');
    const hasFramework = purposes.has('FRAMEWORK');
    const hasCounterpoint = purposes.has('COUNTERPOINT');
    const hasImplication = purposes.has('IMPLICATION') || purposes.has('PRACTICAL_APPLICATION');
    const hasContext = purposes.has('CONTEXT');

    // Hitung komponen kedalaman substantif (maks 5 komponen)
    let depthComponentsCount = 0;
    if (hasContext) depthComponentsCount++;
    if (hasEvidence) depthComponentsCount++;
    if (hasFramework) depthComponentsCount++;
    if (hasCounterpoint) depthComponentsCount++;
    if (hasImplication) depthComponentsCount++;

    let depthLevel: DiscoverDepthLevel;

    if (depthComponentsCount <= 1 || draft.sections.length < 3) {
      depthLevel = 'SHALLOW';
      score = 4;
      issues.push({
        code: 'INSUFFICIENT_TOPIC_DEPTH',
        checkId: 'DISCOVER_DEPTH',
        dimension: 'DEPTH',
        severity: 'CRITICAL',
        message: 'Naskah terlalu dangkal (shallow content). Tidak memiliki bukti empiris, analisis konteks, atau eksplorasi limitasi yang memadai untuk Discover.',
        location: 'sections',
        recommendation: 'Perdalam pembahasan dengan menambahkan seksi EVIDENCE, COUNTERPOINT, dan IMPLICATION.'
      });
    } else if (depthComponentsCount <= 3) {
      depthLevel = 'ADEQUATE';
      score = 10;
      issues.push({
        code: 'INSUFFICIENT_TOPIC_DEPTH',
        checkId: 'DISCOVER_DEPTH',
        dimension: 'DEPTH',
        severity: 'INFO',
        message: 'Kedalaman naskah cukup memadai, namun belum mencakup limitasi atau implikasi praktis menyeluruh.',
        location: 'sections',
        recommendation: 'Pertimbangkan menambahkan sudut pandang tandingan (counterpoint) untuk bobot analisis optimal.'
      });
    } else {
      depthLevel = 'IN_DEPTH';
      score = 15;
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_DEPTH',
      dimension: 'DEPTH',
      status: depthLevel === 'SHALLOW' ? 'FAIL' : depthLevel === 'ADEQUATE' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, score)),
      summary: depthLevel === 'IN_DEPTH'
        ? 'Kedalaman analitis tinggi: mencakup konteks, bukti data, kerangka kerja, limitasi, dan implikasi.'
        : `Tingkat kedalaman konten: ${depthLevel}.`
    };

    return {
      depthLevel,
      checkResult,
      score,
      issues
    };
  }
}
