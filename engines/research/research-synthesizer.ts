/**
 * NexaMOS Research Synthesizer
 *
 * Sourced from NexaMOS Blog Phase 2A specifications
 * Agregasi deterministik tanpa LLM: mengonsolidasi status pertanyaan riset,
 * klaim terverifikasi, persengketaan bukti, temuan, limitasi, dan kesiapan editorial.
 */

import type { ResearchProject } from './domain/research-project.ts';
import type { ResearchClaim } from './domain/research-claim.ts';
import type { ResearchFinding } from './domain/research-finding.ts';
import type { ResearchQuestion } from './domain/research-question.ts';
import type { ResearchSynthesis, ResearchReadiness, RecommendedTopicAction } from './domain/research-synthesis.ts';
import type { EvidenceSufficiencyResult } from './evidence-sufficiency.ts';

export interface ResearchSynthesizerInput {
  project: ResearchProject;
  claims: ResearchClaim[];
  findings: ResearchFinding[];
  questions: ResearchQuestion[];
  sufficiency: EvidenceSufficiencyResult;
}

export function synthesizeResearch(input: ResearchSynthesizerInput): ResearchSynthesis {
  const { project, claims, findings, questions, sufficiency } = input;

  const answeredQuestions = questions.filter(
    (q) => q.status === 'ANSWERED' || q.status === 'PARTIALLY_ANSWERED'
  );
  const openQuestions = questions.filter(
    (q) => q.status === 'OPEN' || q.status === 'BLOCKED'
  );

  const supportedClaims = claims.filter(
    (c) => c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED'
  );
  const disputedClaims = claims.filter(
    (c) => c.status === 'DISPUTED' || c.status === 'CONTRADICTED'
  );

  // Kumpulkan seluruh limitasi dari temuan dan gaps
  const limitations: string[] = [];
  for (const f of findings) {
    if (f.limitations && f.limitations.length > 0) {
      limitations.push(...f.limitations);
    }
  }

  // Evaluasi readiness berdasarkan kriteria kanonikal:
  // 1. Critical questions harus terjawab (tidak ada critical questions OPEN/BLOCKED)
  const highPriorityUnanswered = questions.filter(
    (q) => q.priority === 'HIGH' && q.status !== 'ANSWERED'
  );

  // 2. Critical claims harus terdukung
  const criticalClaims = claims.filter((c) => c.importance === 'CRITICAL');
  const criticalSupported = criticalClaims.every(
    (c) => c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED'
  );

  let readiness: ResearchReadiness = 'NOT_READY';
  let recommendedTopicAction: RecommendedTopicAction = 'NONE';

  if (sufficiency.status === 'REVIEW_REQUIRED' || disputedClaims.length > 0) {
    readiness = 'REVIEW_REQUIRED';
    recommendedTopicAction = 'RESCREEN';
  } else if (
    sufficiency.status === 'SUFFICIENT' &&
    highPriorityUnanswered.length === 0 &&
    criticalSupported &&
    findings.length > 0
  ) {
    readiness = 'READY_FOR_EDITORIAL';
    recommendedTopicAction = 'READY_FOR_REQUALIFICATION';
  } else {
    readiness = 'NOT_READY';
    recommendedTopicAction = 'NONE';
  }

  const evidenceSummary = [
    `Riset '${project.title}': ${answeredQuestions.length}/${questions.length} pertanyaan terjawab.`,
    `Tercapai level bukti ${sufficiency.highestAchievedLevel} (Target: ${project.requiredEvidenceLevel}).`,
    `${supportedClaims.length} klaim terbukti terdukung, ${disputedClaims.length} klaim dipersengketakan/disangkal.`,
    `${findings.length} temuan sintesis dihasilkan.`
  ].join(' ');

  return {
    projectId: project.id,
    topicId: project.topicId,
    answeredQuestions,
    openQuestions,
    supportedClaims,
    disputedClaims,
    keyFindings: findings,
    limitations: Array.from(new Set(limitations)),
    gaps: sufficiency.gaps,
    evidenceSummary,
    readiness,
    recommendedTopicAction,
    synthesizedAt: new Date().toISOString()
  };
}
