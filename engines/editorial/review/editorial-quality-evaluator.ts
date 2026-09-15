/**
 * NexaMOS Editorial Quality Evaluator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Orkestrator evaluasi kualitas penulisan 10 dimensi yang menghasilkan EditorialReview
 * dan EDITORIAL_WRITING_SCORE.
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { EditorialReview, QualityDimension, ReviewIssue, ReviewStatus } from './editorial-review.ts';
import { ClarityEvaluator } from './clarity-evaluator.ts';
import { CoherenceEvaluator } from './coherence-evaluator.ts';
import { ThesisAlignmentEvaluator } from './thesis-alignment.ts';
import { RedundancyDetector } from './redundancy-detector.ts';
import { InformationDensityEvaluator } from './information-density-evaluator.ts';
import { JargonDetector } from './jargon-detector.ts';
import { HookEvaluator } from './hook-evaluator.ts';
import { HeadingEvaluator } from './heading-evaluator.ts';
import { AIWritingPatternDetector } from './ai-writing-pattern-detector.ts';
import { StyleEvaluator } from './style-evaluator.ts';

export class EditorialQualityEvaluator {
  private readonly clarityEvaluator = new ClarityEvaluator();
  private readonly coherenceEvaluator = new CoherenceEvaluator();
  private readonly thesisAlignmentEvaluator = new ThesisAlignmentEvaluator();
  private readonly redundancyDetector = new RedundancyDetector();
  private readonly informationDensityEvaluator = new InformationDensityEvaluator();
  private readonly jargonDetector = new JargonDetector();
  private readonly hookEvaluator = new HookEvaluator();
  private readonly headingEvaluator = new HeadingEvaluator();
  private readonly aiWritingPatternDetector = new AIWritingPatternDetector();
  private readonly styleEvaluator = new StyleEvaluator();

  /**
   * Mengevaluasi draf artikel secara komprehensif pada 10 dimensi doktrin
   */
  public evaluate(draft: ArticleDraft): EditorialReview {
    const allIssues: ReviewIssue[] = [];
    const allStrengths: string[] = [];
    const recommendations: string[] = [];

    // 1. Clarity & Jargon
    const clarityResult = this.clarityEvaluator.evaluate(draft);
    const jargonResult = this.jargonDetector.evaluate(draft);
    allIssues.push(...clarityResult.issues, ...jargonResult.issues);
    allStrengths.push(...clarityResult.strengths, ...jargonResult.strengths);
    const clarityScore = Math.round((clarityResult.score + jargonResult.score) / 2);

    // 2. Coherence & Redundancy
    const coherenceResult = this.coherenceEvaluator.evaluate(draft);
    const redundancyResult = this.redundancyDetector.evaluate(draft);
    allIssues.push(...coherenceResult.issues, ...redundancyResult.issues);
    allStrengths.push(...coherenceResult.strengths, ...redundancyResult.strengths);
    const coherenceScore = Math.round((coherenceResult.score + redundancyResult.score) / 2);

    // 3. Thesis Alignment
    const thesisResult = this.thesisAlignmentEvaluator.evaluate(draft);
    allIssues.push(...thesisResult.issues);
    allStrengths.push(...thesisResult.strengths);
    const thesisAlignmentScore = thesisResult.score;

    // 4. Information Density
    const densityResult = this.informationDensityEvaluator.evaluate(draft);
    allIssues.push(...densityResult.issues);
    allStrengths.push(...densityResult.strengths);
    const informationDensityScore = densityResult.score;

    // 5. Structure (Hook + Heading)
    const hookResult = this.hookEvaluator.evaluate(draft);
    const headingResult = this.headingEvaluator.evaluate(draft);
    allIssues.push(...hookResult.issues, ...headingResult.issues);
    allStrengths.push(...hookResult.strengths, ...headingResult.strengths);
    const structureScore = Math.round((hookResult.score + headingResult.score) / 2);

    // 6. Originality (AI Pattern Risk + Framework)
    const aiPatternResult = this.aiWritingPatternDetector.evaluate(draft);
    allIssues.push(...aiPatternResult.issues);
    allStrengths.push(...aiPatternResult.strengths);
    const hasFramework = draft.sections.some((s) => s.purpose === 'FRAMEWORK');
    const originalityScore = Math.round(aiPatternResult.score * (hasFramework ? 1.0 : 0.9));

    // 7. Tone Consistency
    const styleResult = this.styleEvaluator.evaluate(draft);
    allIssues.push(...styleResult.issues);
    allStrengths.push(...styleResult.strengths);
    const toneConsistencyScore = styleResult.score;

    // 8. Depth
    const hasEvidence = draft.sections.some((s) => s.purpose === 'EVIDENCE');
    const hasCounterpoint = draft.sections.some((s) => s.purpose === 'COUNTERPOINT');
    let depthScore = 80;
    if (hasEvidence) depthScore += 10;
    if (hasCounterpoint) depthScore += 10;
    if (depthScore >= 90) allStrengths.push('Kedalaman eksplorasi tinggi: menyertakan bukti empiris dan pertimbangan limitasi/counterpoint.');

    // 9. Reader Usefulness
    const hasApplication = draft.sections.some(
      (s) => s.purpose === 'PRACTICAL_APPLICATION' || s.purpose === 'IMPLICATION'
    );
    let usefulnessScore = hasApplication ? 95 : 75;
    if (hasApplication) {
      allStrengths.push('Memberikan kegunaan praktis langsung bagi pengambilan keputusan pembaca.');
    } else {
      allIssues.push({
        dimension: 'READER_USEFULNESS',
        code: 'MISSING_ACTIONABLE_TAKEAWAY',
        message: 'Artikel kurang memuat aplikasi praktis atau implikasi keputusan konkret bagi pembaca.',
        severity: 'MINOR',
        recommendation: 'Tambahkan seksi IMPLICATION atau PRACTICAL_APPLICATION.'
      });
    }

    // 10. Grounding Preservation
    const hasValidCitations = draft.citationMap && draft.citationMap.length > 0;
    const groundingScore = hasValidCitations ? 100 : 70;
    if (hasValidCitations) {
      allStrengths.push('Preservasi grounding kuat: seluruh klaim faktual utama memiliki rujukan sitasi resmi.');
    }

    const qualityScores: Record<QualityDimension, number> = {
      CLARITY: clarityScore,
      COHERENCE: coherenceScore,
      DEPTH: depthScore,
      THESIS_ALIGNMENT: thesisAlignmentScore,
      INFORMATION_DENSITY: informationDensityScore,
      READER_USEFULNESS: usefulnessScore,
      STRUCTURE: structureScore,
      ORIGINALITY: originalityScore,
      TONE_CONSISTENCY: toneConsistencyScore,
      GROUNDING_PRESERVATION: groundingScore
    };

    // Hitung Overall Writing Score (rata-rata 10 dimensi)
    const dimensions = Object.keys(qualityScores) as QualityDimension[];
    const totalScore = dimensions.reduce((acc, dim) => acc + qualityScores[dim], 0);
    const overallWritingScore = Math.round(totalScore / dimensions.length);

    // Kumpulkan rekomendasi revisi
    for (const issue of allIssues) {
      if (issue.recommendation && !recommendations.includes(issue.recommendation)) {
        recommendations.push(issue.recommendation);
      }
    }

    // Tentukan Status Review
    let status: ReviewStatus = 'PASS';
    const hasCritical = allIssues.some((i) => i.severity === 'CRITICAL');
    const hasMajor = allIssues.some((i) => i.severity === 'MAJOR');

    if (hasCritical) {
      status = 'HUMAN_REVIEW_REQUIRED';
    } else if (hasMajor || overallWritingScore < 80) {
      status = overallWritingScore < 60 ? 'REJECT' : 'REVISION_REQUIRED';
    }

    return {
      articleDraftId: draft.id,
      qualityScores,
      overallWritingScore,
      status,
      issues: allIssues,
      strengths: allStrengths,
      revisionRecommendations: recommendations,
      reviewedAt: new Date().toISOString(),
      reviewPolicyVersion: 'EDITORIAL_WRITING_POLICY_V1'
    };
  }
}
