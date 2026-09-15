/**
 * NexaMOS Unified Distribution Readiness Gate - Comprehensive Test Suite
 *
 * Sourced from Phase 5D specifications.
 * Menguji seluruh skenario gerbang keputusan kesiapan distribusi:
 * - Ready to Publish
 * - Ready with Warnings
 * - Return for Revision
 * - Hard Blockers (SEO, Discover, AI Visibility, & Editorial Authority)
 * - Anti-Arithmetic-Averaging Guardrails
 * - Issue Deduplication lintas validator
 * - Cross-Validator Issue Routing
 * - Warning Acknowledgment Lifecycle
 * - Publication Candidate Generation & Block Enforcement
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  UnifiedDistributionReadinessService,
  DistributionIssueRouter,
  DistributionSummaryGenerator,
  CANONICAL_DISTRIBUTION_POLICY,
  UNIFIED_DISTRIBUTION_POLICY_VERSION
} from '../engines/distribution/index.ts';
import type {
  UnifiedDistributionReadinessInput,
  DistributionIssue,
  WarningAcknowledgment
} from '../engines/distribution/index.ts';
import type { SEOValidationResult } from '../engines/seo-validator/seo-validation.ts';
import type { DiscoverValidationResult } from '../engines/discover-validator/discover-validation.ts';
import type { AIVisibilityValidationResult } from '../engines/ai-visibility/ai-visibility-validation.ts';

// =============================================================================
// MOCK FACTORIES FOR UPSTREAM VALIDATION RESULTS
// =============================================================================

function createMockSEOResult(overrides: Partial<SEOValidationResult> = {}): SEOValidationResult {
  return {
    articleId: 'art-001',
    checks: [],
    issues: [],
    recommendations: [],
    score: 88,
    dimensionScores: {
      INTENT_ALIGNMENT: 9,
      TOPIC_CLARITY: 9,
      TITLE_QUALITY: 9,
      METADATA_QUALITY: 9,
      HEADING_STRUCTURE: 9,
      INTERNAL_LINKING: 8,
      INDEXABILITY: 10,
      CANONICAL_INTEGRITY: 9,
      STRUCTURED_DATA: 8,
      CONTENT_DIFFERENTIATION: 8
    },
    classification: 'READY',
    criticalErrors: [],
    validatedAt: '2026-09-15T00:00:00.000Z',
    policyVersion: 'SEO_VALIDATION_POLICY_V1',
    ...overrides
  };
}

function createMockDiscoverResult(overrides: Partial<DiscoverValidationResult> = {}): DiscoverValidationResult {
  return {
    articleId: 'art-001',
    checks: [],
    issues: [],
    recommendations: [],
    dimensions: {
      ORIGINALITY: 10,
      DEPTH: 10,
      TIMELINESS: 8,
      TOPICAL_EXPERTISE: 10,
      INTEREST_FIT: 8,
      TITLE_INTEGRITY: 9,
      VISUAL_READINESS: 8,
      PAGE_EXPERIENCE: 8,
      LOCAL_RELEVANCE: 8,
      POLICY_SAFETY: 10
    },
    score: 89,
    classification: 'READY',
    eligibility: 'ELIGIBLE',
    criticalIneligibilityReasons: [],
    validatedAt: '2026-09-15T00:00:00.000Z',
    policyVersion: 'DISCOVER_READINESS_POLICY_V1',
    ...overrides
  };
}

function createMockAIVisibilityResult(overrides: Partial<AIVisibilityValidationResult> = {}): AIVisibilityValidationResult {
  return {
    articleId: 'art-001',
    googleEligibility: 'ELIGIBLE',
    providerNeutralReadiness: {
      retrievability: 'HIGH',
      answerability: 'STRONG',
      entityClarity: 'HIGH',
      claimTraceability: 'FULL',
      sourceTransparency: 'TRANSPARENT',
      informationGain: 'HIGH'
    },
    checks: [],
    issues: [],
    recommendations: [],
    dimensions: {
      GOOGLE_AI_ELIGIBILITY: 10,
      RETRIEVAL_READINESS: 12,
      ANSWERABILITY: 12,
      ENTITY_CLARITY: 10,
      CLAIM_CLARITY: 10,
      CITATION_READINESS: 12,
      SOURCE_TRANSPARENCY: 8,
      INFORMATION_GAIN: 16,
      CONTENT_ACCESSIBILITY: 7,
      MULTIMODAL_READINESS: 3
    },
    score: 100,
    classification: 'STRONG',
    criticalBlockingReasons: [],
    validatedAt: '2026-09-15T00:00:00.000Z',
    policyVersion: 'AI_VISIBILITY_READINESS_POLICY_V1',
    ...overrides
  };
}

// =============================================================================
// TEST SUITES: PHASE 5D UNIFIED DISTRIBUTION READINESS GATE
// =============================================================================

describe('Phase 5D Tests: Unified Distribution Readiness Gate', () => {
  let distributionService: UnifiedDistributionReadinessService;

  beforeEach(() => {
    distributionService = new UnifiedDistributionReadinessService();
  });

  // ---------------------------------------------------------------------------
  // 1. Ready to Publish
  // ---------------------------------------------------------------------------
  describe('1. Ready to Publish Scenarios', () => {
    test('SEO READY + Discover READY + AI STRONG + Editorial PASS -> READY_TO_PUBLISH', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-ready-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 85 }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 86 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'STRONG', score: 94 })
      };

      const result = distributionService.evaluate(input);

      assert.strictEqual(result.overallStatus, 'READY_TO_PUBLISH');
      assert.strictEqual(result.blockers.length, 0);
      assert.strictEqual(result.warnings.length, 0);
      assert.strictEqual(result.policyVersion, UNIFIED_DISTRIBUTION_POLICY_VERSION);
      assert.ok(result.summary.includes('READY_TO_PUBLISH'));
      assert.ok(result.auditEvents.some((e) => e.eventType === 'DISTRIBUTION_READY_TO_PUBLISH'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Ready with Warnings
  // ---------------------------------------------------------------------------
  describe('2. Ready with Warnings Scenarios', () => {
    test('SEO READY + Discover READY_WITH_WARNINGS + AI READY -> READY_WITH_WARNINGS', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-warn-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 84 }),
        discoverResult: createMockDiscoverResult({
          classification: 'READY_WITH_WARNINGS',
          score: 75,
          issues: [
            {
              code: 'VISUAL_NON_LANDSCAPE',
              checkId: 'DISCOVER_VISUAL_READINESS',
              dimension: 'VISUAL_READINESS',
              severity: 'WARNING',
              message: 'Hero image berorientasi potret bukan lanskap 16:9.'
            }
          ]
        }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 82 })
      };

      const result = distributionService.evaluate(input);

      assert.strictEqual(result.overallStatus, 'READY_WITH_WARNINGS');
      assert.strictEqual(result.blockers.length, 0);
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings.some((w) => w.code === 'VISUAL_ASSET_DEFICIT'));
      assert.ok(result.auditEvents.some((e) => e.eventType === 'DISTRIBUTION_READY_WITH_WARNINGS'));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Return for Revision
  // ---------------------------------------------------------------------------
  describe('3. Return for Revision Scenarios', () => {
    test('SEO REVISION_REQUIRED + Discover READY + AI READY -> RETURN_FOR_REVISION', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-rev-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'REVISION_REQUIRED', score: 62 }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 85 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 84 })
      };

      const result = distributionService.evaluate(input);

      assert.strictEqual(result.overallStatus, 'RETURN_FOR_REVISION');
      assert.ok(result.summary.includes('RETURN_FOR_REVISION'));
      assert.ok(result.auditEvents.some((e) => e.eventType === 'DISTRIBUTION_REVISION_REQUIRED'));
    });

    test('Discover REVISION_REQUIRED -> RETURN_FOR_REVISION', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-rev-002',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 85 }),
        discoverResult: createMockDiscoverResult({ classification: 'REVISION_REQUIRED', score: 64 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 84 })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'RETURN_FOR_REVISION');
    });

    test('AI Visibility REVISION_REQUIRED -> RETURN_FOR_REVISION', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-rev-003',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 85 }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 84 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'REVISION_REQUIRED', score: 65 })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'RETURN_FOR_REVISION');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Hard Block Scenarios
  // ---------------------------------------------------------------------------
  describe('4. Hard Block Scenarios', () => {
    test('SEO BLOCKED memicu overall status BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-block-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({
          classification: 'BLOCKED',
          criticalErrors: ['NOINDEX_ON_PUBLISHED_ARTICLE'],
          issues: [
            {
              code: 'NOINDEX_ON_PUBLISHED_ARTICLE',
              checkId: 'INDEXABILITY',
              dimension: 'INDEXABILITY',
              severity: 'CRITICAL',
              message: 'Artikel disetel noindex.'
            }
          ]
        }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 85 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 85 })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'BLOCKED');
      assert.ok(result.blockers.some((b) => b.code === 'ARTICLE_NOT_INDEXABLE'));
      assert.ok(result.auditEvents.some((e) => e.eventType === 'DISTRIBUTION_BLOCKED'));
    });

    test('Discover INELIGIBLE memicu overall status BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-block-002',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 85 }),
        discoverResult: createMockDiscoverResult({
          classification: 'INELIGIBLE',
          eligibility: 'INELIGIBLE',
          criticalIneligibilityReasons: ['DISCOVER_POLICY_INELIGIBLE'],
          issues: [
            {
              code: 'DISCOVER_POLICY_INELIGIBLE',
              checkId: 'DISCOVER_POLICY_SAFETY',
              dimension: 'POLICY_SAFETY',
              severity: 'CRITICAL',
              message: 'Konten melanggar kebijakan kelayakan Discover.'
            }
          ]
        }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 85 })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'BLOCKED');
      assert.ok(result.blockers.some((b) => b.code === 'DISCOVER_POLICY_INELIGIBLE'));
    });

    test('AI Visibility BLOCKED (misal site exclusion) memicu overall status BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-block-003',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY', score: 85 }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 85 }),
        aiVisibilityResult: createMockAIVisibilityResult({
          classification: 'BLOCKED',
          googleEligibility: 'BLOCKED_BY_SITE_CONTROL',
          criticalBlockingReasons: ['GENERATIVE_AI_SITE_EXCLUDED'],
          issues: [
            {
              code: 'GENERATIVE_AI_SITE_EXCLUDED',
              checkId: 'AI_GOOGLE_ELIGIBILITY',
              dimension: 'GOOGLE_AI_ELIGIBILITY',
              severity: 'CRITICAL',
              message: 'Situs disetel EXCLUDED dari AI Overviews pada Search Console.'
            }
          ]
        })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'BLOCKED');
      assert.ok(result.blockers.some((b) => b.code === 'GENERATIVE_AI_SITE_EXCLUDED'));
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Editorial Authority Requirement
  // ---------------------------------------------------------------------------
  describe('5. Editorial Authority Requirement', () => {
    test('Artikel tanpa Editorial PASS (misal: REVISION_REQUIRED) mutlak BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-edit-block-001',
        editorialStatus: 'REVISION_REQUIRED',
        seoResult: createMockSEOResult({ classification: 'EXCELLENT', score: 95 }),
        discoverResult: createMockDiscoverResult({ classification: 'STRONG', score: 95 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'STRONG', score: 95 })
      };

      const result = distributionService.evaluate(input);

      assert.strictEqual(result.overallStatus, 'BLOCKED');
      assert.ok(result.blockers.some((b) => b.code === 'EDITORIAL_REVISION_REQUIRED'));
      assert.ok(result.summary.includes('Persetujuan editorial belum terpenuhi'));
    });

    test('Artikel dengan Editorial REJECT mutlak BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-edit-block-002',
        editorialStatus: 'REJECT',
        seoResult: createMockSEOResult({ classification: 'READY', score: 80 }),
        discoverResult: createMockDiscoverResult({ classification: 'READY', score: 80 }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY', score: 80 })
      };

      const result = distributionService.evaluate(input);
      assert.strictEqual(result.overallStatus, 'BLOCKED');
      assert.ok(result.blockers.some((b) => b.code === 'EDITORIAL_REJECT'));
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Anti-Arithmetic-Averaging Guardrail
  // ---------------------------------------------------------------------------
  describe('6. Anti-Arithmetic-Averaging Guardrails', () => {
    test('Skor rata-rata tinggi (SEO 95 + Discover 95 + AI 20 = 70) TIDAK meloloskan jika AI BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-anti-avg-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'EXCELLENT', score: 95 }),
        discoverResult: createMockDiscoverResult({ classification: 'STRONG', score: 95 }),
        aiVisibilityResult: createMockAIVisibilityResult({
          classification: 'BLOCKED',
          score: 20,
          criticalBlockingReasons: ['ARTICLE_NOT_INDEXABLE'],
          issues: [
            {
              code: 'ARTICLE_NOT_INDEXABLE',
              checkId: 'AI_GOOGLE_ELIGIBILITY',
              dimension: 'GOOGLE_AI_ELIGIBILITY',
              severity: 'CRITICAL',
              message: 'Tidak dapat diindeks.'
            }
          ]
        })
      };

      const result = distributionService.evaluate(input);

      // Skor diagnostik rata-rata sekitar ~72.5
      assert.ok(result.aggregateDiagnosticScore! > 70);
      // Namun status overall MUTLAK BLOCKED, bukan lolos
      assert.strictEqual(result.overallStatus, 'BLOCKED');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Issue Deduplication
  // ---------------------------------------------------------------------------
  describe('7. Issue Deduplication Engine', () => {
    test('3 kesalahan indexability ekuivalen lintas validator digabung menjadi 1 canonical issue', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-dedup-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({
          issues: [
            {
              code: 'NOINDEX_ON_PUBLISHED_ARTICLE',
              checkId: 'INDEXABILITY',
              dimension: 'INDEXABILITY',
              severity: 'CRITICAL',
              message: 'SEO: noindex aktif'
            }
          ]
        }),
        discoverResult: createMockDiscoverResult({
          issues: [
            {
              code: 'CONTENT_NOT_INDEXABLE',
              checkId: 'DISCOVER_ELIGIBILITY',
              dimension: 'POLICY_SAFETY',
              severity: 'CRITICAL',
              message: 'Discover: konten tidak terindeks'
            }
          ]
        }),
        aiVisibilityResult: createMockAIVisibilityResult({
          issues: [
            {
              code: 'ARTICLE_NOT_INDEXABLE',
              checkId: 'AI_GOOGLE_ELIGIBILITY',
              dimension: 'GOOGLE_AI_ELIGIBILITY',
              severity: 'CRITICAL',
              message: 'AI: artikel tidak terindeks'
            }
          ]
        })
      };

      const result = distributionService.evaluate(input);

      // Pastikan canonical issue ARTICLE_NOT_INDEXABLE hanya muncul 1 kali
      const indexableIssues = result.blockers.filter((b) => b.code === 'ARTICLE_NOT_INDEXABLE');
      assert.strictEqual(indexableIssues.length, 1);

      const canonical = indexableIssues[0];
      assert.strictEqual(canonical.route, 'SEO_TECHNICAL');
      assert.strictEqual(canonical.severity, 'CRITICAL');
      assert.strictEqual(canonical.blocking, true);
      assert.deepStrictEqual(canonical.sourceValidators.sort(), ['AI_VISIBILITY', 'DISCOVER', 'SEO'].sort());
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Cross-Validator Routing
  // ---------------------------------------------------------------------------
  describe('8. Cross-Validator Routing Logic', () => {
    test('Mengarahkan isu ke domain pemilik yang berwenang', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-routing-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({
          issues: [
            {
              code: 'INVALID_CANONICAL',
              checkId: 'CANONICAL_INTEGRITY',
              dimension: 'CANONICAL_INTEGRITY',
              severity: 'CRITICAL',
              message: 'Tag canonical tidak valid.'
            }
          ]
        }),
        discoverResult: createMockDiscoverResult({
          issues: [
            {
              code: 'VISUAL_LOW_RESOLUTION',
              checkId: 'DISCOVER_VISUAL_READINESS',
              dimension: 'VISUAL_READINESS',
              severity: 'WARNING',
              message: 'Gambar utama resolusi kurang dari 1200px.'
            }
          ]
        }),
        aiVisibilityResult: createMockAIVisibilityResult({
          issues: [
            {
              code: 'UNSUPPORTED_CITATION',
              checkId: 'AI_CITATION_READINESS',
              dimension: 'CITATION_READINESS',
              severity: 'WARNING',
              message: 'Klaim tanpa sitasi rujukan.'
            },
            {
              code: 'OVERCLAIMED_STATEMENT',
              checkId: 'AI_CLAIM_CLARITY',
              dimension: 'CLAIM_CLARITY',
              severity: 'WARNING',
              message: 'Pernyataan hiperbola tanpa nuansa.'
            }
          ]
        })
      };

      const result = distributionService.evaluate(input);

      // Periksa routing spesifik
      assert.ok(result.routes.includes('SEO_TECHNICAL')); // dari canonical conflict
      assert.ok(result.routes.includes('VISUAL_DESIGN')); // dari visual resolution
      assert.ok(result.routes.includes('RESEARCH'));      // dari unsupported citation
      assert.ok(result.routes.includes('EDITORIAL'));     // dari overclaimed statement
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Warning Acknowledgment Lifecycle
  // ---------------------------------------------------------------------------
  describe('9. Warning Acknowledgment Lifecycle', () => {
    test('Pencatatan acknowledgment tersimpan rapi untuk READY_WITH_WARNINGS', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-ack-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY_WITH_WARNINGS' }),
        discoverResult: createMockDiscoverResult({ classification: 'READY' }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY' })
      };

      const ack: WarningAcknowledgment = {
        warningAcknowledged: true,
        warningAcknowledgedBy: 'Editor-in-Chief Budi',
        warningAcknowledgedAt: '2026-09-15T01:00:00.000Z',
        notes: 'Disetujui untuk rilis kilat walau metadata deskripsi agak panjang.'
      };

      const result = distributionService.evaluate(input, { warningAcknowledgment: ack });

      assert.strictEqual(result.overallStatus, 'READY_WITH_WARNINGS');
      assert.ok(result.warningAcknowledgment);
      assert.strictEqual(result.warningAcknowledgment?.warningAcknowledgedBy, 'Editor-in-Chief Budi');
      assert.ok(result.auditEvents.some((e) => e.eventType === 'WARNING_ACKNOWLEDGED'));
    });

    test('Warning acknowledgment TIDAK DAPAT meloloskan artikel yang berstatus BLOCKED', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-ack-blocked-001',
        editorialStatus: 'REJECT', // Hard blocker
        seoResult: createMockSEOResult(),
        discoverResult: createMockDiscoverResult(),
        aiVisibilityResult: createMockAIVisibilityResult()
      };

      const ack: WarningAcknowledgment = {
        warningAcknowledged: true,
        warningAcknowledgedBy: 'Editor-in-Chief Budi',
        warningAcknowledgedAt: '2026-09-15T01:00:00.000Z'
      };

      const result = distributionService.evaluate(input, { warningAcknowledgment: ack });

      // Tetap BLOCKED meski ada acknowledgment
      assert.strictEqual(result.overallStatus, 'BLOCKED');
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Publication Candidate Generation
  // ---------------------------------------------------------------------------
  describe('10. Publication Candidate Generation', () => {
    test('Status READY_TO_PUBLISH berhasil membuat PublicationCandidate', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-cand-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'READY' }),
        discoverResult: createMockDiscoverResult({ classification: 'READY' }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY' })
      };

      const evalResult = distributionService.evaluate(input);
      const candidate = distributionService.createPublicationCandidate(evalResult, {
        title: 'Arsitektur Informasi Otoritatif NexaMOS',
        slug: 'arsitektur-informasi-otoritatif'
      });

      assert.ok(candidate.candidateId.startsWith('pub-cand-'));
      assert.strictEqual(candidate.articleId, 'art-cand-001');
      assert.strictEqual(candidate.slug, 'arsitektur-informasi-otoritatif');
      assert.strictEqual(candidate.title, 'Arsitektur Informasi Otoritatif NexaMOS');
      assert.strictEqual(candidate.overallStatus, 'READY_TO_PUBLISH');
      assert.strictEqual(candidate.distributionReadinessId, evalResult.readinessId);
      assert.ok(evalResult.auditEvents.some((e) => e.eventType === 'PUBLICATION_CANDIDATE_CREATED'));
    });

    test('Status BLOCKED menolak keras pembuatan PublicationCandidate (throw Error)', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-cand-block-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'BLOCKED' }),
        discoverResult: createMockDiscoverResult({ classification: 'READY' }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY' })
      };

      const evalResult = distributionService.evaluate(input);
      assert.strictEqual(evalResult.overallStatus, 'BLOCKED');

      assert.throws(
        () => {
          distributionService.createPublicationCandidate(evalResult, {
            title: 'Artikel Terblokir',
            slug: 'artikel-terblokir'
          });
        },
        /Gagal membuat PublicationCandidate: Artikel art-cand-block-001 berstatus BLOCKED/
      );
    });

    test('Status RETURN_FOR_REVISION menolak pembuatan PublicationCandidate', () => {
      const input: UnifiedDistributionReadinessInput = {
        articleId: 'art-cand-rev-001',
        editorialStatus: 'PASS',
        seoResult: createMockSEOResult({ classification: 'REVISION_REQUIRED' }),
        discoverResult: createMockDiscoverResult({ classification: 'READY' }),
        aiVisibilityResult: createMockAIVisibilityResult({ classification: 'READY' })
      };

      const evalResult = distributionService.evaluate(input);
      assert.strictEqual(evalResult.overallStatus, 'RETURN_FOR_REVISION');

      assert.throws(
        () => {
          distributionService.createPublicationCandidate(evalResult, {
            title: 'Artikel Revisi',
            slug: 'artikel-revisi'
          });
        },
        /Gagal membuat PublicationCandidate: Artikel art-cand-rev-001 berstatus RETURN_FOR_REVISION/
      );
    });
  });
});
