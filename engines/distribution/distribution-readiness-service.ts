/**
 * NexaMOS Unified Distribution Readiness Service (Master Gate Orchestrator)
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5D specifications.
 * Menegakkan prinsip:
 * VALIDATORS EVALUATE
 * UNIFIED GATE DECIDES
 * PUBLISHING WORKFLOW EXECUTES
 */

import type {
  DistributionAuditEvent,
  DistributionAuditEventType,
  PublicationCandidate,
  UnifiedDistributionReadinessInput,
  UnifiedDistributionReadinessResult,
  WarningAcknowledgment
} from './distribution-readiness.ts';
import {
  CANONICAL_DISTRIBUTION_POLICY,
  calculateAggregateDiagnosticScore,
  determineOverallDistributionStatus,
  UNIFIED_DISTRIBUTION_POLICY_VERSION
} from './distribution-policy.ts';

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
import { DistributionIssueRouter } from './distribution-issue-router.ts';
import { DistributionSummaryGenerator } from './distribution-summary.ts';

export interface EvaluateDistributionOptions {
  warningAcknowledgment?: WarningAcknowledgment;
}

export class UnifiedDistributionReadinessService {
  private readonly issueRouter: DistributionIssueRouter;
  private readonly summaryGenerator: DistributionSummaryGenerator;

  constructor(
    issueRouter?: DistributionIssueRouter,
    summaryGenerator?: DistributionSummaryGenerator
  ) {
    this.issueRouter = issueRouter || new DistributionIssueRouter();
    this.summaryGenerator = summaryGenerator || new DistributionSummaryGenerator();
  }

  /**
   * Mengevaluasi hasil ketiga validator (SEO, Discover, AI Visibility) dan status Editorial
   * untuk menghasilkan satu gerbang keputusan kesiapan distribusi terpadu.
   */
  public evaluate(
    input: UnifiedDistributionReadinessInput,
    options?: EvaluateDistributionOptions
  ): UnifiedDistributionReadinessResult {
    const timestamp = input.validatedAt || new Date().toISOString();
    const readinessId = generateUniqueId('dist-gate');
    const auditEvents: DistributionAuditEvent[] = [];

    // 1. Audit Event: Evaluation Started
    this.logAuditEvent(auditEvents, 'DISTRIBUTION_EVALUATION_STARTED', input.articleId, timestamp, {
      editorialStatus: input.editorialStatus,
      seoScore: input.seoResult.score,
      discoverScore: input.discoverResult.score,
      aiScore: input.aiVisibilityResult.score
    });

    // 2. Routing dan Deduplikasi Issue
    const routingResult = this.issueRouter.process({
      seoIssues: input.seoResult.issues || [],
      discoverIssues: input.discoverResult.issues || [],
      aiIssues: input.aiVisibilityResult.issues || [],
      editorialIssues: input.editorialReview?.issues || [],
      seoRecommendations: input.seoResult.recommendations || [],
      discoverRecommendations: input.discoverResult.recommendations || [],
      aiRecommendations: input.aiVisibilityResult.recommendations || []
    });

    // 3. Tambahkan editorial issue ke blockers jika editorialStatus bukan PASS
    const blockers = [...routingResult.blockers];
    if (input.editorialStatus !== 'PASS') {
      const editorialBlockerCode = `EDITORIAL_${input.editorialStatus}`;
      if (!blockers.some((b) => b.code === editorialBlockerCode)) {
        blockers.unshift({
          code: editorialBlockerCode,
          severity: 'CRITICAL',
          sourceValidators: ['EDITORIAL'],
          message: `Naskah artikel belum mendapatkan persetujuan editorial (Status: ${input.editorialStatus}).`,
          route: 'EDITORIAL',
          blocking: true
        });
      }
    }

    // 4. Hitung Status Kelayakan Terpadu
    const overallStatus = determineOverallDistributionStatus({
      editorialStatus: input.editorialStatus,
      seoClassification: input.seoResult.classification,
      discoverClassification: input.discoverResult.classification,
      aiClassification: input.aiVisibilityResult.classification,
      blockers,
      warnings: routingResult.warnings
    });

    // 5. Tangani Warning Acknowledgment (jika ada)
    let finalAcknowledgment: WarningAcknowledgment | null = null;
    if (options?.warningAcknowledgment) {
      finalAcknowledgment = {
        warningAcknowledged: Boolean(options.warningAcknowledgment.warningAcknowledged),
        warningAcknowledgedBy: options.warningAcknowledgment.warningAcknowledgedBy || 'System Auditor',
        warningAcknowledgedAt: options.warningAcknowledgment.warningAcknowledgedAt || timestamp,
        notes: options.warningAcknowledgment.notes
      };

      this.logAuditEvent(auditEvents, 'WARNING_ACKNOWLEDGED', input.articleId, timestamp, {
        acknowledgedBy: finalAcknowledgment.warningAcknowledgedBy,
        acknowledgedAt: finalAcknowledgment.warningAcknowledgedAt,
        notes: finalAcknowledgment.notes
      });
    }

    // 6. Hitung Skor Diagnostik Agregat (Observabilitas Saja)
    const aggregateDiagnosticScore = calculateAggregateDiagnosticScore(
      input.seoResult,
      input.discoverResult,
      input.aiVisibilityResult
    );

    // 7. Buat Summary Explainable
    const summary = this.summaryGenerator.generate({
      overallStatus,
      editorialStatus: input.editorialStatus,
      seoClassification: input.seoResult.classification,
      discoverClassification: input.discoverResult.classification,
      aiClassification: input.aiVisibilityResult.classification,
      blockers,
      warnings: routingResult.warnings
    });

    // 8. Catat Audit Event Penyelesaian Evaluasi
    const completionEventType = this.getCompletionAuditEventType(overallStatus);
    this.logAuditEvent(auditEvents, completionEventType, input.articleId, timestamp, {
      overallStatus,
      blockersCount: blockers.length,
      warningsCount: routingResult.warnings.length,
      aggregateDiagnosticScore
    });

    this.logAuditEvent(auditEvents, 'DISTRIBUTION_EVALUATION_COMPLETED', input.articleId, timestamp, {
      readinessId,
      overallStatus
    });

    return {
      readinessId,
      articleId: input.articleId,
      editorialStatus: input.editorialStatus,
      seoStatus: input.seoResult.classification,
      discoverStatus: input.discoverResult.classification,
      aiVisibilityStatus: input.aiVisibilityResult.classification,
      overallStatus,
      blockers,
      warnings: routingResult.warnings,
      recommendations: routingResult.recommendations,
      routes: routingResult.activeRoutes,
      summary,
      evaluatedAt: timestamp,
      policyVersion: UNIFIED_DISTRIBUTION_POLICY_VERSION,
      aggregateDiagnosticScore,
      warningAcknowledgment: finalAcknowledgment,
      publicationCandidate: null, // Dibuat via createPublicationCandidate jika memenuhi syarat
      auditEvents
    };
  }

  /**
   * Membuat kandidat publikasi resmi untuk diserahkan ke Phase 6 Publishing Workflow.
   * Hanya diizinkan jika status adalah READY_TO_PUBLISH atau READY_WITH_WARNINGS.
   */
  public createPublicationCandidate(
    result: UnifiedDistributionReadinessResult,
    metadata: { title: string; slug: string },
    acknowledgment?: WarningAcknowledgment
  ): PublicationCandidate {
    // Larangan Keras: Tidak boleh membuat PublicationCandidate jika berstatus BLOCKED atau RETURN_FOR_REVISION
    if (result.overallStatus === 'BLOCKED') {
      throw new Error(
        `Gagal membuat PublicationCandidate: Artikel ${result.articleId} berstatus BLOCKED karena kendala kritis atau kebijakan belum terpenuhi.`
      );
    }

    if (result.overallStatus === 'RETURN_FOR_REVISION') {
      throw new Error(
        `Gagal membuat PublicationCandidate: Artikel ${result.articleId} berstatus RETURN_FOR_REVISION dan membutuhkan perbaikan substantif.`
      );
    }

    const approvedAt = new Date().toISOString();
    const candidateId = generateUniqueId('pub-cand');

    const effectiveAcknowledgment = acknowledgment || result.warningAcknowledgment || null;

    const candidate: PublicationCandidate = {
      candidateId,
      articleId: result.articleId,
      slug: metadata.slug,
      title: metadata.title,
      distributionReadinessId: result.readinessId,
      approvedAt,
      overallStatus: result.overallStatus as 'READY_TO_PUBLISH' | 'READY_WITH_WARNINGS',
      warnings: result.warnings,
      warningAcknowledgment: effectiveAcknowledgment,
      policyVersion: UNIFIED_DISTRIBUTION_POLICY_VERSION
    };

    // Rekam audit event pembuatan kandidat
    this.logAuditEvent(result.auditEvents, 'PUBLICATION_CANDIDATE_CREATED', result.articleId, approvedAt, {
      candidateId,
      slug: metadata.slug,
      status: candidate.overallStatus
    });

    result.publicationCandidate = candidate;
    return candidate;
  }

  private getCompletionAuditEventType(status: UnifiedDistributionReadinessResult['overallStatus']): DistributionAuditEventType {
    switch (status) {
      case 'BLOCKED':
        return 'DISTRIBUTION_BLOCKED';
      case 'RETURN_FOR_REVISION':
        return 'DISTRIBUTION_REVISION_REQUIRED';
      case 'READY_WITH_WARNINGS':
        return 'DISTRIBUTION_READY_WITH_WARNINGS';
      case 'READY_TO_PUBLISH':
        return 'DISTRIBUTION_READY_TO_PUBLISH';
    }
  }

  private logAuditEvent(
    events: DistributionAuditEvent[],
    eventType: DistributionAuditEventType,
    articleId: string,
    timestamp: string,
    details: Record<string, any>
  ): void {
    events.push({
      eventId: generateUniqueId('aud-ev'),
      eventType,
      articleId,
      timestamp,
      details
    });
  }
}
