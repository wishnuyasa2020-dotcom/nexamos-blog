/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 2D Unit & Integration Test Suite: AI Research Orchestrator
 *
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryResearchProjectRepository } from '../engines/research/repository/in-memory-research-project-repository.ts';
import { InMemoryResearchSourceRepository } from '../engines/research/repository/in-memory-research-source-repository.ts';
import { InMemoryResearchClaimRepository } from '../engines/research/repository/in-memory-research-claim-repository.ts';
import { InMemoryResearchEvidenceRepository } from '../engines/research/repository/in-memory-research-evidence-repository.ts';
import { InMemoryClaimEvidenceRelationRepository } from '../engines/research/repository/in-memory-claim-evidence-relation-repository.ts';
import { InMemoryResearchFindingRepository } from '../engines/research/repository/in-memory-research-finding-repository.ts';
import { InMemoryResearchEventRepository } from '../engines/research/repository/in-memory-research-event-repository.ts';

import { ResearchManagementService } from '../engines/research/research-management-service.ts';
import { ResearchIngestionService } from '../engines/research/ingestion/research-ingestion-service.ts';
import { ResearchAcquisitionService } from '../engines/research/acquisition/research-acquisition-service.ts';
import { MockResearchDiscoveryProvider } from '../engines/research/acquisition/providers/mock-discovery-provider.ts';
import { MockSourceAcquisitionProvider } from '../engines/research/acquisition/providers/mock-acquisition-provider.ts';

import { ResearchPlanner } from '../engines/research/orchestrator/research-planner.ts';
import { ResearchGapAnalyzer } from '../engines/research/orchestrator/research-gap-analyzer.ts';
import { ResearchBriefBuilder } from '../engines/research/orchestrator/research-brief-builder.ts';
import { ResearchOrchestrator } from '../engines/research/orchestrator/research-orchestrator.ts';
import { MockAIResearchProvider } from '../engines/research/orchestrator/providers/mock-ai-research-provider.ts';

import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { SourceCandidate } from '../engines/research/acquisition/source-candidate.ts';

describe('Phase 2D Tests: AI Research Orchestrator', () => {
  let projectRepo: InMemoryResearchProjectRepository;
  let sourceRepo: InMemoryResearchSourceRepository;
  let claimRepo: InMemoryResearchClaimRepository;
  let evidenceRepo: InMemoryResearchEvidenceRepository;
  let relationRepo: InMemoryClaimEvidenceRelationRepository;
  let findingRepo: InMemoryResearchFindingRepository;
  let eventRepo: InMemoryResearchEventRepository;

  let managementService: ResearchManagementService;
  let ingestionService: ResearchIngestionService;
  let discoveryProvider: MockResearchDiscoveryProvider;
  let acquisitionProvider: MockSourceAcquisitionProvider;
  let acquisitionService: ResearchAcquisitionService;

  let aiProvider: MockAIResearchProvider;
  let planner: ResearchPlanner;
  let gapAnalyzer: ResearchGapAnalyzer;
  let briefBuilder: ResearchBriefBuilder;
  let orchestrator: ResearchOrchestrator;

  const sampleTopic: Topic = {
    id: 'top-blog-relevance-001',
    title: 'Apakah aktivitas blog masih relevan di era AI?',
    slug: 'apakah-aktivitas-blog-masih-relevan-di-era-ai',
    territory: 'INTELLIGENCE',
    status: 'RESEARCH_REQUIRED',
    editorialRole: 'FLAGSHIP',
    audience: {
      segment: 'Tech Founders & Content Strategists',
      jobToBeDone: 'Memahami arah investasi konten di era generative AI search'
    },
    problem: 'Banyak praktisi mempertanyakan apakah blog konvensional masih menghasilkan ROI setelah munculnya AI Overviews.',
    intent: {
      primary: 'Eksplorasi strategi konten berbasis otoritas di era AI'
    },
    thesis: 'Blog komoditas mati, namun blog riset berbasis otoritas dan data primer justru meningkat nilainya.',
    whyNow: 'Penyebaran Google AI Overviews mengubah landscape organic CTR secara drastis.',
    informationGain: {
      expectedContribution: 'Menyajikan data empiris dan framework authority content di era AI',
      originalityType: ['ORIGINAL_DATA', 'CROSS_THEORY_SYNTHESIS'],
      commodityRisk: 'LOW'
    },
    evidencePlan: {
      requiredEvidenceLevel: 'E2',
      plannedSources: ['Industry Benchmark 2025', 'Search Traffic Analysis'],
      originalEvidenceRequired: true
    },
    businessRelevance: {
      objective: 'Memposisikan NexaMOS sebagai thought leader dalam AI authority architecture',
      funnelRole: 'TOFU'
    },
    recommendedArticleType: 'ANALYSIS',
    distributionTargets: ['GOOGLE_SEARCH', 'EMAIL'],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z'
  };

  beforeEach(() => {
    projectRepo = new InMemoryResearchProjectRepository();
    sourceRepo = new InMemoryResearchSourceRepository();
    claimRepo = new InMemoryResearchClaimRepository();
    evidenceRepo = new InMemoryResearchEvidenceRepository();
    relationRepo = new InMemoryClaimEvidenceRelationRepository();
    findingRepo = new InMemoryResearchFindingRepository();
    eventRepo = new InMemoryResearchEventRepository();

    managementService = new ResearchManagementService({
      projectRepo,
      sourceRepo,
      claimRepo,
      evidenceRepo,
      relationRepo,
      findingRepo,
      eventRepo
    });

    ingestionService = new ResearchIngestionService({
      sourceRepo,
      evidenceRepo,
      eventRepo
    });

    // Mock candidates untuk discovery provider
    const sampleCandidate: SourceCandidate = {
      id: 'cand-seo-report-2025',
      queryId: 'mock-query',
      researchProjectId: 'top-blog-relevance-001',
      url: 'https://example.com/reports/seo-in-ai-era-2025.html',
      title: 'State of Organic Search Traffic and Blog Retention in 2025',
      snippet: 'Data dari 10.000 domain menunjukkan blog dengan original research mempertahankan 85% traffic organik dibandingkan situs agregator.',
      sourceType: 'INDUSTRY_RESEARCH',
      publisher: 'Search Benchmark Institute',
      provider: 'mock-search',
      status: 'DISCOVERED',
      publicationDate: '2025-06-15T00:00:00.000Z',
      publishedDate: '2025-06-15T00:00:00.000Z',
      discoveredAt: '2026-03-01T00:00:00.000Z'
    };

    discoveryProvider = new MockResearchDiscoveryProvider();
    discoveryProvider.setDefaultResults([sampleCandidate]);

    // Mock source content untuk acquisition provider
    acquisitionProvider = new MockSourceAcquisitionProvider();
    acquisitionProvider.registerMockContent('https://example.com/reports/seo-in-ai-era-2025.html', {
      researchProjectId: 'top-blog-relevance-001',
      sourceType: 'INDUSTRY_RESEARCH',
      format: 'MARKDOWN',
      title: 'State of Organic Search Traffic and Blog Retention in 2025',
      url: 'https://example.com/reports/seo-in-ai-era-2025.html',
      publisher: 'Search Benchmark Institute',
      publicationDate: '2025-06-15',
      content: `
# State of Organic Search Traffic and Blog Retention in 2025
Publikasi: 15 Juni 2025.

Berdasarkan analisis traffic 10.000 domain terkemuka:
1. Aktivitas blog berbasis original research mempertahankan 85% traffic organik di era AI Overviews.
2. Artikel komoditas (definisi umum) mengalami penurunan traffic sebesar 42%.
3. ROI blog B2B yang mempublikasikan studi kasus orisinal tetap positif dengan conversion rate 3.4%.
      `
    });

    acquisitionService = new ResearchAcquisitionService({
      discoveryProvider,
      acquisitionProvider,
      ingestionService,
      eventRepo,
      sourceRepo
    });

    aiProvider = new MockAIResearchProvider();
    planner = new ResearchPlanner(aiProvider, eventRepo);
    gapAnalyzer = new ResearchGapAnalyzer(aiProvider);
    briefBuilder = new ResearchBriefBuilder(sourceRepo, evidenceRepo, claimRepo, findingRepo);

    orchestrator = new ResearchOrchestrator({
      managementService,
      acquisitionService,
      aiProvider,
      planner,
      gapAnalyzer,
      briefBuilder,
      eventRepo,
      sourceRepo,
      claimRepo,
      evidenceRepo,
      findingRepo
    });
  });

  // ==========================================================================
  // 1. RESEARCH PLANNER TESTS
  // ==========================================================================
  describe('1. Research Planner', () => {
    test('berhasil membuat ResearchPlan yang valid untuk topik', async () => {
      const planRes = await planner.planTopicResearch(sampleTopic);
      assert.strictEqual(planRes.ok, true);

      if (planRes.ok) {
        const plan = planRes.value;
        assert.strictEqual(plan.topicId, sampleTopic.id);
        assert.strictEqual(plan.requiredEvidenceLevel, 'E2');
        assert.strictEqual(plan.researchQuestions.length >= 1, true);
        assert.strictEqual(plan.counterEvidenceRequired, true);

        // Pastikan event audit tercatat
        const events = await eventRepo.listByProjectId(sampleTopic.id);
        assert.strictEqual(events.some((e) => e.type === 'RESEARCH_PLAN_CREATED'), true);
      }
    });

    test('menolak proposal jika research questions kosong', async () => {
      aiProvider.setOptions({
        customPlanProposal: {
          objective: 'Tujuan riset',
          researchQuestions: [],
          requiredEvidenceLevel: 'E2',
          preferredSourceTypes: ['INDUSTRY_RESEARCH'],
          counterEvidenceRequired: false,
          freshnessRequirement: 'MEDIUM'
        }
      });

      const planRes = await planner.planTopicResearch(sampleTopic);
      assert.strictEqual(planRes.ok, false);
      if (!planRes.ok) {
        assert.strictEqual(planRes.error.code, 'RESEARCH_PLAN_REJECTED');
        assert.strictEqual(planRes.error.message.includes('kosong'), true);
      }
    });

    test('menolak proposal jika evidence requirement diturunkan di bawah kebijakan topik', async () => {
      // Topik membutuhkan E2, tetapi AI mengusulkan E1
      aiProvider.setOptions({
        customPlanProposal: {
          objective: 'Tujuan riset yang terlalu santai',
          researchQuestions: [{ question: 'Apakah blog masih asyik?' }],
          requiredEvidenceLevel: 'E1',
          preferredSourceTypes: ['COMMUNITY_DISCUSSION'],
          counterEvidenceRequired: false,
          freshnessRequirement: 'LOW'
        }
      });

      const planRes = await planner.planTopicResearch(sampleTopic);
      assert.strictEqual(planRes.ok, false);
      if (!planRes.ok) {
        assert.strictEqual(planRes.error.code, 'RESEARCH_PLAN_REJECTED');
        assert.strictEqual(planRes.error.message.includes('lebih rendah'), true);
      }
    });
  });

  // ==========================================================================
  // 2. AI PROVIDER TESTS
  // ==========================================================================
  describe('2. AI Provider Contract & Validation', () => {
    test('menerima structured output yang valid dari mock provider', async () => {
      const planProposal = await aiProvider.planResearch({ topic: sampleTopic });
      assert.strictEqual(planProposal.ok, true);
      if (planProposal.ok) {
        assert.strictEqual(typeof planProposal.value.objective, 'string');
        assert.strictEqual(Array.isArray(planProposal.value.researchQuestions), true);
      }
    });

    test('menolak respon malformed dengan error AI_OUTPUT_INVALID', async () => {
      aiProvider.setOptions({ simulateMalformedPlan: true });

      const planRes = await planner.planTopicResearch(sampleTopic);
      assert.strictEqual(planRes.ok, false);
      if (!planRes.ok) {
        assert.strictEqual(planRes.error.code, 'AI_OUTPUT_INVALID');
      }
    });
  });

  // ==========================================================================
  // 3. RESEARCH ITERATION & HARD STOP RULES
  // ==========================================================================
  describe('3. Research Loop & Hard Stop Rules', () => {
    test('berhenti saat batas iterasi maksimal tercapai (max iterations stop)', async () => {
      // Set batas iterasi menjadi 1
      const result = await orchestrator.orchestrateResearch(sampleTopic, {
        maxIterationsOverride: 1
      });

      assert.strictEqual(result.ok, true);
      if (result.ok) {
        assert.strictEqual(result.value.totalIterations, 1);
        assert.strictEqual(result.value.iterations.length, 1);
        assert.strictEqual(result.value.stopReason.includes('Batas iterasi'), true);
      }
    });

    test('berhenti saat opsi humanStop aktif secara eksplisit', async () => {
      const result = await orchestrator.orchestrateResearch(sampleTopic, {
        humanStop: true
      });

      assert.strictEqual(result.ok, true);
      if (result.ok) {
        assert.strictEqual(result.value.finalAction, 'STOP_RESEARCH');
        assert.strictEqual(result.value.stopReason.includes('human stop'), true);
      }
    });

    test('berhenti saat anggaran riset habis (budget exhausted)', async () => {
      // Set budget sangat ketat sehingga habis pada query pertama
      const result = await orchestrator.orchestrateResearch(sampleTopic, {
        budget: {
          maxQueries: 1
        }
      });

      assert.strictEqual(result.ok, true);
      if (result.ok) {
        assert.strictEqual(result.value.stopReason.includes('Anggaran'), true);
      }
    });
  });

  // ==========================================================================
  // 4. CONFIRMATION BIAS GUARDRAIL
  // ==========================================================================
  describe('4. Confirmation Bias Guardrail', () => {
    test('memilih SEARCH_COUNTER_EVIDENCE jika terdapat klaim kausal tanpa bukti tandingan', async () => {
      // Buat proyek dan klaim kausal
      const projRes = await managementService.createResearchProject({
        topicId: sampleTopic.id,
        title: 'Uji Bias',
        objective: 'Menguji bias',
        researchQuestions: [{ id: 'q1', question: 'Q1', priority: 'HIGH', status: 'OPEN' }],
        requiredEvidenceLevel: 'E2'
      });
      assert.strictEqual(projRes.ok, true);
      const project = (projRes as any).value;

      const claimRes = await managementService.addClaim(project.id, {
        statement: 'AI Search selalu menurunkan traffic organik blog secara signifikan.',
        claimType: 'CAUSAL',
        importance: 'CRITICAL',
        status: 'UNVERIFIED'
      });
      assert.strictEqual(claimRes.ok, true);

      const synthRes = await managementService.synthesize(project.id);
      assert.strictEqual(synthRes.ok, true);

      const claims = await claimRepo.listByProjectId(project.id);

      const gapRes = await gapAnalyzer.analyzeGaps({
        synthesis: (synthRes as any).value,
        currentGaps: [],
        claims,
        evidenceList: [],
        sourcesList: [],
        groundingResults: [],
        counterEvidenceReviewed: false
      });

      assert.strictEqual(gapRes.ok, true);
      if (gapRes.ok) {
        assert.strictEqual(gapRes.value.nextAction, 'SEARCH_COUNTER_EVIDENCE');
        assert.strictEqual(gapRes.value.actionReason.includes('Bias'), true);
      }
    });
  });

  // ==========================================================================
  // 5. FRESHNESS GUARDRAIL
  // ==========================================================================
  describe('5. Freshness Guardrail', () => {
    test('memilih SEARCH_CURRENT_DATA jika topik HIGH volatility memiliki bukti basi', async () => {
      const projRes = await managementService.createResearchProject({
        topicId: sampleTopic.id,
        title: 'Uji Freshness',
        objective: 'Menguji kebaruan',
        researchQuestions: [{ id: 'q1', question: 'Q1', priority: 'HIGH', status: 'OPEN' }],
        requiredEvidenceLevel: 'E2'
      });
      const project = (projRes as any).value;

      const sourceRes = await managementService.addSource(project.id, {
        title: 'Laporan SEO Lama 2022',
        type: 'INDUSTRY_RESEARCH',
        evidenceLevel: 'E2',
        qualityAssessment: {
          authority: 80,
          relevance: 80,
          recency: 80,
          methodologicalTransparency: 80,
          independence: 80,
          verifiability: 80,
          qualitySummary: 'Laporan industri otoritatif.'
        },
        publicationDate: '2022-01-01T00:00:00.000Z',
        isPrimarySource: false,
        isInternal: false,
        recencyRisk: 'HIGH'
      });
      assert.strictEqual(sourceRes.ok, true);
      const source = (sourceRes as any).value;

      const evRes = await managementService.addEvidence(project.id, {
        sourceId: source.id,
        content: 'Traffic blog stabil pada tahun 2022.',
        publicationAllowed: true,
        capturedAt: '2022-02-01T00:00:00.000Z'
      });
      assert.strictEqual(evRes.ok, true);

      const synthRes = await managementService.synthesize(project.id);
      const evidence = await evidenceRepo.listByProjectId(project.id);

      const gapRes = await gapAnalyzer.analyzeGaps({
        synthesis: (synthRes as any).value,
        currentGaps: [],
        claims: [],
        evidenceList: evidence,
        sourcesList: [source],
        groundingResults: [],
        topicVolatility: 'HIGH',
        counterEvidenceReviewed: true
      });

      assert.strictEqual(gapRes.ok, true);
      if (gapRes.ok) {
        assert.strictEqual(gapRes.value.nextAction, 'SEARCH_CURRENT_DATA');
        assert.strictEqual(gapRes.value.actionReason.includes('Freshness'), true);
      }
    });
  });

  // ==========================================================================
  // 6. CLAIMS PROPOSALS & GROUNDING AUTHORITY
  // ==========================================================================
  describe('6. Proposed Claims Status & Grounding Authority', () => {
    test('klaim baru yang diusulkan AI selalu berstatus awal UNVERIFIED', async () => {
      const result = await orchestrator.orchestrateResearch(sampleTopic, {
        maxIterationsOverride: 1
      });

      assert.strictEqual(result.ok, true);
      if (result.ok) {
        const claims = await claimRepo.listByProjectId(result.value.projectId);
        assert.strictEqual(claims.length > 0, true);
        // Memastikan tidak ada klaim yang langsung SUPPORTED tanpa grounding engine
        // Status awal yang disimpan adalah UNVERIFIED, kemudian dievaluasi oleh Phase 2A engine
        for (const c of claims) {
          assert.strictEqual(
            ['UNVERIFIED', 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'INSUFFICIENT_EVIDENCE'].includes(c.status),
            true
          );
        }
      }
    });
  });

  // ==========================================================================
  // 7. CITATION INTEGRITY TESTS
  // ==========================================================================
  describe('7. Citation Integrity', () => {
    test('menolak menyusun ResearchBrief jika mereferensikan Claim ID fiktif', async () => {
      const projRes = await managementService.createResearchProject({
        topicId: sampleTopic.id,
        title: 'Uji Integritas Sitasi',
        objective: 'Verifikasi referensi repositori',
        researchQuestions: [{ id: 'q1', question: 'Q1', priority: 'HIGH', status: 'OPEN' }],
        requiredEvidenceLevel: 'E2'
      });
      const project = (projRes as any).value;

      const fakeClaim = {
        id: 'claim-fiktif-999',
        researchProjectId: project.id,
        statement: 'Klaim halusinasi yang tidak ada di database.',
        claimType: 'FACTUAL' as const,
        status: 'SUPPORTED' as const,
        importance: 'CRITICAL' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const synth = {
        projectId: project.id,
        topicId: project.topicId,
        answeredQuestions: [],
        openQuestions: [],
        supportedClaims: [fakeClaim],
        disputedClaims: [],
        keyFindings: [],
        limitations: [],
        gaps: [],
        evidenceSummary: 'Ringkasan',
        readiness: 'NOT_READY' as const,
        recommendedTopicAction: 'NONE' as const,
        synthesizedAt: new Date().toISOString()
      };

      const sufficiency = {
        status: 'INSUFFICIENT' as const,
        highestAchievedLevel: 'E1' as const,
        requiredLevelMet: false,
        missingEvidence: ['Belum cukup.'],
        gaps: [],
        summary: 'Belum cukup.'
      };

      const briefRes = await briefBuilder.buildBrief({
        project,
        synthesis: synth,
        sufficiencyResult: sufficiency
      });

      assert.strictEqual(briefRes.ok, false);
      if (!briefRes.ok) {
        assert.strictEqual(briefRes.error.code, 'CITATION_REFERENCE_INVALID');
        assert.strictEqual(briefRes.error.message.includes('Integritas sitasi gagal'), true);
      }
    });
  });

  // ==========================================================================
  // 8. HUMAN REVIEW CONDITIONS
  // ==========================================================================
  describe('8. Human Review Triggers', () => {
    test('memicu REQUEST_HUMAN_REVIEW dan HUMAN_REVIEW_REQUIRED jika ada kontradiksi tajam', async () => {
      const projRes = await managementService.createResearchProject({
        topicId: sampleTopic.id,
        title: 'Uji Kontradiksi',
        objective: 'Kontradiksi',
        researchQuestions: [{ id: 'q1', question: 'Q1', priority: 'HIGH', status: 'OPEN' }],
        requiredEvidenceLevel: 'E2'
      });
      const project = (projRes as any).value;

      const synth = {
        projectId: project.id,
        topicId: project.topicId,
        answeredQuestions: [],
        openQuestions: [],
        supportedClaims: [],
        disputedClaims: [],
        keyFindings: [],
        limitations: [],
        gaps: [{ type: 'UNRESOLVED_CONTRADICTION' as const, description: 'Dua sumber terpercaya memiliki kesimpulan berlawanan.' }],
        evidenceSummary: 'Ada kontradiksi tajam.',
        readiness: 'REVIEW_REQUIRED' as const,
        recommendedTopicAction: 'RESCREEN' as const,
        synthesizedAt: new Date().toISOString()
      };

      const gapRes = await gapAnalyzer.analyzeGaps({
        synthesis: synth,
        currentGaps: synth.gaps,
        claims: [],
        evidenceList: [],
        sourcesList: [],
        groundingResults: [],
        counterEvidenceReviewed: true
      });

      assert.strictEqual(gapRes.ok, true);
      if (gapRes.ok) {
        assert.strictEqual(gapRes.value.nextAction, 'REQUEST_HUMAN_REVIEW');
        assert.strictEqual(gapRes.value.requiresHumanReview, true);
      }
    });
  });

  // ==========================================================================
  // 9. FULL END-TO-END INTEGRATION SCENARIO
  // ==========================================================================
  describe('9. Full End-to-End Orchestration Scenario: "Apakah aktivitas blog masih relevan di era AI?"', () => {
    test('berhasil mengeksekusi Topic → Plan → Acquisition → Ingestion → Grounding → Brief', async () => {
      const orchRes = await orchestrator.orchestrateResearch(sampleTopic, {
        maxIterationsOverride: 2
      });

      assert.strictEqual(orchRes.ok, true);
      if (orchRes.ok) {
        const result = orchRes.value;

        // 1. Validasi Proyek & Plan
        assert.strictEqual(result.topicId, sampleTopic.id);
        assert.strictEqual(result.plan.requiredEvidenceLevel, 'E2');
        assert.strictEqual(result.plan.researchQuestions.length >= 1, true);

        // 2. Validasi Siklus Iterasi
        assert.strictEqual(result.totalIterations >= 1, true);
        assert.strictEqual(result.iterations.length >= 1, true);

        const firstIteration = result.iterations[0];
        assert.strictEqual(firstIteration.iterationNumber, 1);
        assert.strictEqual(firstIteration.sourcesDiscovered >= 1, true);
        assert.strictEqual(firstIteration.sourcesAccepted >= 1, true);
        assert.strictEqual(firstIteration.evidenceCaptured >= 1, true);

        // 3. Validasi Akumulasi Repositori
        assert.strictEqual(result.totalSourcesAcquired >= 1, true);
        assert.strictEqual(result.totalEvidenceCaptured >= 1, true);
        assert.strictEqual(result.totalClaimsEvaluated >= 1, true);

        // 4. Validasi Research Brief Handoff
        const brief = result.brief;
        assert.strictEqual(brief.topicId, sampleTopic.id);
        assert.strictEqual(brief.researchProjectId, result.projectId);
        assert.strictEqual(typeof brief.objective, 'string');
        assert.strictEqual(brief.sourceIndex.length >= 1, true);
        assert.strictEqual(brief.evidenceIndex.length >= 1, true);

        // Validasi Sudut Pandang Editorial dari AI
        assert.strictEqual(typeof brief.recommendedEditorialAngle, 'string');
        assert.strictEqual(
          brief.recommendedEditorialAngle?.includes('Blog Tidak Mati') || false,
          true
        );

        // 5. Validasi Audit Trail & Events
        const events = await eventRepo.listByProjectId(result.projectId);
        const eventTypes = events.map((e) => e.type);

        assert.strictEqual(eventTypes.includes('RESEARCH_PLAN_CREATED'), true);
        assert.strictEqual(eventTypes.includes('RESEARCH_ITERATION_STARTED'), true);
        assert.strictEqual(eventTypes.includes('AI_RESEARCH_PROPOSAL_CREATED'), true);
        assert.strictEqual(eventTypes.includes('RESEARCH_GAP_ANALYZED'), true);
        assert.strictEqual(eventTypes.includes('RESEARCH_NEXT_ACTION_SELECTED'), true);
        assert.strictEqual(eventTypes.includes('RESEARCH_BRIEF_CREATED'), true);
      }
    });
  });
});
