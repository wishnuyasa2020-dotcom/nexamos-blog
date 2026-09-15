/**
 * NexaMOS Thesis Alignment Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Memastikan setiap seksi berkontribusi pada pembuktian tesis atau reader promise.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export type SectionThesisRelation =
  | 'SUPPORTS'
  | 'EXPLAINS'
  | 'QUALIFIES'
  | 'CHALLENGES'
  | 'APPLIES'
  | 'CONCLUDES'
  | 'NO_CLEAR_RELATION';

export interface SectionAlignmentAssessment {
  sectionId: string;
  relation: SectionThesisRelation;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface ThesisAlignmentResult {
  score: number;
  assessments: SectionAlignmentAssessment[];
  issues: ReviewIssue[];
  strengths: string[];
}

export class ThesisAlignmentEvaluator {
  public evaluate(draft: ArticleDraft): ThesisAlignmentResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    const assessments: SectionAlignmentAssessment[] = [];
    let score = 100;

    // Untuk GLOSSARY dan REFERENCE, tesis tidak wajib argumentatif
    if (draft.articleType === 'GLOSSARY' || draft.articleType === 'REFERENCE') {
      strengths.push(`Tipe artikel '${draft.articleType}' berfokus pada kejelasan rujukan atau definisi istilah.`);
      return {
        score: 100,
        assessments: [],
        issues: [],
        strengths
      };
    }

    const thesisKeywords = this.extractKeywords(draft.thesis);

    for (const section of draft.sections) {
      const relation = this.determineRelation(section.purpose, section.content, thesisKeywords);

      assessments.push({
        sectionId: section.id,
        relation,
        confidence: 'HIGH',
        explanation: `Seksi '${section.heading || section.id}' dengan purpose ${section.purpose} dinilai berelasi ${relation} terhadap tesis.`
      });

      if (relation === 'NO_CLEAR_RELATION') {
        issues.push({
          dimension: 'THESIS_ALIGNMENT',
          code: 'THESIS_DRIFT',
          message: `Seksi '${section.heading || section.id}' tidak memiliki kaitan substantif yang jelas dengan tesis artikel.`,
          severity: 'MAJOR',
          sectionId: section.id,
          snippet: section.content.slice(0, 100) + '...',
          recommendation: 'Tautkan kembali pembahasan dalam seksi ini ke premis tesis atau buang bila tidak relevan.'
        });
        score -= 20;
      }
    }

    if (issues.length === 0) {
      strengths.push('Seluruh seksi terikat secara disiplin untuk mendukung, menjelaskan, atau membatasi tesis.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      assessments,
      issues,
      strengths
    };
  }

  private determineRelation(
    purpose: string,
    content: string,
    thesisKeywords: string[]
  ): SectionThesisRelation {
    if (purpose === 'CONCLUSION') return 'CONCLUDES';
    if (purpose === 'HOOK') return 'EXPLAINS';
    if (purpose === 'COUNTERPOINT') return 'QUALIFIES';
    if (purpose === 'PRACTICAL_APPLICATION' || purpose === 'IMPLICATION') return 'APPLIES';
    if (purpose === 'ARGUMENT' || purpose === 'EVIDENCE' || purpose === 'FRAMEWORK') return 'SUPPORTS';

    // Periksa apakah ada overlap kata kunci tesis
    const contentLower = content.toLowerCase();
    const hasOverlap = thesisKeywords.some((kw) => contentLower.includes(kw));

    if (hasOverlap) return 'EXPLAINS';

    // Jika seksi sangat pendek (< 10 kata) atau tidak ada kaitan
    if (content.split(/\s+/).length < 15 && !hasOverlap) {
      return 'NO_CLEAR_RELATION';
    }

    return 'EXPLAINS';
  }

  private extractKeywords(thesis: string): string[] {
    if (!thesis) return [];
    return thesis
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4);
  }
}
