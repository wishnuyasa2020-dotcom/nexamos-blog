/**
 * NexaMOS Research Acquisition Service
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Application & Orchestration layer untuk penemuan dan akuisisi riset:
 * RESEARCH QUESTION -> DISCOVERY QUERIES -> SEARCH PROVIDER -> SOURCE CANDIDATES
 * -> CANDIDATE EVALUATION -> PRE-ACQUISITION DEDUP -> SOURCE ACQUISITION
 * -> PHASE 2B INGESTION PIPELINE -> PERSISTED EVIDENCE
 */

import type { ResearchQuestion } from '../domain/research-question.ts';
import type { ResearchGap } from '../domain/research-gap.ts';
import type { DiscoveryQuery, DiscoveryResult } from './source-discovery.ts';
import type { SourceCandidate } from './source-candidate.ts';
import type { CandidateEvaluationResult, EvaluationContext } from './source-candidate-evaluator.ts';
import { SourceCandidateEvaluator } from './source-candidate-evaluator.ts';
import { DiscoveryQueryBuilder } from './discovery-query-builder.ts';
import type { SourceDiversityAssessment } from './source-diversity-checker.ts';
import { SourceDiversityChecker } from './source-diversity-checker.ts';
import { BudgetTracker, DEFAULT_RESEARCH_BUDGET, type ResearchBudgetPolicy } from './research-budget-policy.ts';
import type { ResearchDiscoveryProvider } from './providers/research-discovery-provider.ts';
import type { SourceAcquisitionProvider } from './providers/source-acquisition-provider.ts';
import type { ResearchIngestionService } from '../ingestion/research-ingestion-service.ts';
import type { IngestionResult } from '../ingestion/ingestion-result.ts';
import type { ResearchEventRepository } from '../repository/research-event-repository.ts';
import type { ResearchSourceRepository } from '../repository/research-source-repository.ts';
import type { ResearchEvent, ResearchEventType } from '../domain/research-event.ts';
import type { Result, ResearchDomainError } from '../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../domain/research-result.ts';
import type { TopicVolatility } from './freshness-evaluator.ts';

export interface ResearchAcquisitionServiceDependencies {
  discoveryProvider: ResearchDiscoveryProvider;
  acquisitionProvider: SourceAcquisitionProvider;
  ingestionService: ResearchIngestionService;
  eventRepo: ResearchEventRepository;
  sourceRepo: ResearchSourceRepository;
  queryBuilder?: DiscoveryQueryBuilder;
  candidateEvaluator?: SourceCandidateEvaluator;
  diversityChecker?: SourceDiversityChecker;
}

export interface PipelineExecutionOptions {
  actor?: string;
  topicVolatility?: TopicVolatility;
  budget?: Partial<ResearchBudgetPolicy>;
  currentDate?: string | Date;
  stopWhenSufficient?: boolean;
}

export interface AcquisitionPipelineReport {
  researchProjectId: string;
  researchQuestionId: string;
  queriesCreated: DiscoveryQuery[];
  candidatesDiscovered: SourceCandidate[];
  evaluationResults: CandidateEvaluationResult[];
  acceptedCandidates: SourceCandidate[];
  ingestionResults: IngestionResult[];
  diversityAssessment: SourceDiversityAssessment;
  budgetExhausted: boolean;
  budgetMetrics: ReturnType<BudgetTracker['getMetrics']>;
  executedAt: string;
}

export class ResearchAcquisitionService {
  private discoveryProvider: ResearchDiscoveryProvider;
  private acquisitionProvider: SourceAcquisitionProvider;
  private ingestionService: ResearchIngestionService;
  private eventRepo: ResearchEventRepository;
  private sourceRepo: ResearchSourceRepository;
  private queryBuilder: DiscoveryQueryBuilder;
  private candidateEvaluator: SourceCandidateEvaluator;
  private diversityChecker: SourceDiversityChecker;

  constructor(deps: ResearchAcquisitionServiceDependencies) {
    this.discoveryProvider = deps.discoveryProvider;
    this.acquisitionProvider = deps.acquisitionProvider;
    this.ingestionService = deps.ingestionService;
    this.eventRepo = deps.eventRepo;
    this.sourceRepo = deps.sourceRepo;
    this.queryBuilder = deps.queryBuilder || new DiscoveryQueryBuilder();
    this.candidateEvaluator = deps.candidateEvaluator || new SourceCandidateEvaluator();
    this.diversityChecker = deps.diversityChecker || new SourceDiversityChecker();
  }

  // ==========================================================================
  // 1. QUERY BUILDING
  // ==========================================================================

  buildQueries(
    question: ResearchQuestion,
    projectId: string,
    gaps: ResearchGap[] = [],
    maxQueries = 5
  ): DiscoveryQuery[] {
    return this.queryBuilder.buildQueries(question, gaps, {
      projectId,
      maxQueriesPerQuestion: maxQueries
    });
  }

  // ==========================================================================
  // 2. SOURCE DISCOVERY
  // ==========================================================================

  async discover(
    query: DiscoveryQuery,
    actor = 'discovery-agent'
  ): Promise<Result<DiscoveryResult, ResearchDomainError>> {
    await this.recordEvent(
      query.researchProjectId,
      'DISCOVERY_STARTED',
      actor,
      `Memulai pencarian kandidat sumber untuk query '${query.query}' (Intent: ${query.intent}).`,
      { queryId: query.id, intent: query.intent }
    );

    let candidates: SourceCandidate[];
    try {
      candidates = await this.discoveryProvider.search(query);
    } catch (searchError) {
      return err(
        createResearchDomainError(
          'DISCOVERY_FAILED',
          `Gagal melakukan pencarian pada provider '${this.discoveryProvider.providerName}': ${(searchError as Error).message}`
        )
      );
    }

    for (const candidate of candidates) {
      await this.recordEvent(
        query.researchProjectId,
        'SOURCE_CANDIDATE_DISCOVERED',
        actor,
        `Kandidat sumber ditemukan: '${candidate.title}' (${candidate.url}) dari ${candidate.provider}.`,
        { candidateId: candidate.id, queryId: query.id, url: candidate.url }
      );
    }

    return ok({
      query,
      candidates,
      provider: this.discoveryProvider.providerName,
      discoveredAt: new Date().toISOString()
    });
  }

  // ==========================================================================
  // 3. CANDIDATE EVALUATION
  // ==========================================================================

  async evaluateCandidates(
    candidates: SourceCandidate[],
    query: DiscoveryQuery,
    options: Omit<EvaluationContext, 'query'>,
    actor = 'evaluation-agent'
  ): Promise<CandidateEvaluationResult[]> {
    const results: CandidateEvaluationResult[] = [];

    const context: EvaluationContext = {
      ...options,
      query
    };

    for (const candidate of candidates) {
      candidate.status = 'EVALUATING';
      const evalRes = this.candidateEvaluator.evaluate(candidate, context);
      results.push(evalRes);

      if (evalRes.decision === 'ACCEPT') {
        candidate.status = 'ACCEPTED';
        candidate.evaluationNotes = evalRes.rationale;
        await this.recordEvent(
          query.researchProjectId,
          'SOURCE_CANDIDATE_ACCEPTED',
          actor,
          `Kandidat '${candidate.title}' DITERIMA: ${evalRes.rationale}`,
          { candidateId: candidate.id, authority: evalRes.authorityAssessment.score }
        );
      } else {
        candidate.status = evalRes.isDuplicate ? 'DUPLICATE' : 'REJECTED';
        candidate.evaluationNotes = evalRes.rationale;
        await this.recordEvent(
          query.researchProjectId,
          'SOURCE_CANDIDATE_REJECTED',
          actor,
          `Kandidat '${candidate.title}' DITOLAK: ${evalRes.rationale}`,
          { candidateId: candidate.id, reason: evalRes.rationale }
        );
      }
    }

    return results;
  }

  // ==========================================================================
  // 4. ACQUISITION & INGESTION HANDOFF
  // ==========================================================================

  async acquireAndIngest(
    candidate: SourceCandidate,
    actor = 'acquisition-agent'
  ): Promise<Result<IngestionResult, ResearchDomainError>> {
    const projectId = candidate.researchProjectId;

    await this.recordEvent(
      projectId,
      'SOURCE_ACQUISITION_STARTED',
      actor,
      `Memulai proses akuisisi konten mentah untuk kandidat '${candidate.title}' (${candidate.url}).`,
      { candidateId: candidate.id, url: candidate.url }
    );

    // 1. Eksekusi Provider Akuisisi
    const acquireRes = await this.acquisitionProvider.acquire(candidate);
    if (!acquireRes.ok) {
      candidate.status = 'ACQUISITION_FAILED';
      candidate.evaluationNotes = acquireRes.error.message;

      await this.recordEvent(
        projectId,
        'SOURCE_ACQUISITION_FAILED',
        actor,
        `Akuisisi gagal untuk '${candidate.title}': ${acquireRes.error.message}`,
        { candidateId: candidate.id, error: acquireRes.error }
      );
      return acquireRes;
    }

    candidate.status = 'ACCEPTED';
    const rawInput = acquireRes.value;

    await this.recordEvent(
      projectId,
      'SOURCE_ACQUIRED',
      actor,
      `Konten mentah berhasil diakuisisi untuk '${candidate.title}' (Format: ${rawInput.format}).`,
      { candidateId: candidate.id, format: rawInput.format }
    );

    // 2. Serahkan ke Phase 2B Ingestion Pipeline
    await this.recordEvent(
      projectId,
      'SOURCE_SENT_TO_INGESTION',
      actor,
      `Menyerahkan materi mentah '${candidate.title}' ke pipeline Ingestion Phase 2B.`,
      { candidateId: candidate.id }
    );

    const ingestRes = await this.ingestionService.ingest(rawInput, {
      actor,
      extractEvidence: true
    });

    if (ingestRes.ok) {
      candidate.status = 'INGESTED';
    }

    return ingestRes;
  }

  // ==========================================================================
  // 5. FULL PIPELINE ORCHESTRATION
  // ==========================================================================

  async runAcquisitionPipeline(
    question: ResearchQuestion,
    projectId: string,
    gaps: ResearchGap[] = [],
    options: PipelineExecutionOptions = {}
  ): Promise<Result<AcquisitionPipelineReport, ResearchDomainError>> {
    const actor = options.actor || 'research-orchestrator';
    const budgetTracker = new BudgetTracker(options.budget || DEFAULT_RESEARCH_BUDGET);

    const queriesCreated: DiscoveryQuery[] = [];
    const allDiscoveredCandidates: SourceCandidate[] = [];
    const allEvaluationResults: CandidateEvaluationResult[] = [];
    const allAcceptedCandidates: SourceCandidate[] = [];
    const allIngestionResults: IngestionResult[] = [];

    // Kumpulkan URL & Title yang sudah ada di repository untuk pre-acquisition dedup
    const existingSources = await this.sourceRepo.listByProjectId(projectId);
    const knownUrls = new Set<string>();
    const knownTitles = new Set<string>();

    for (const s of existingSources) {
      if (s.url) knownUrls.add(s.url.trim().toLowerCase().replace(/\/$/, ''));
      if (s.title) knownTitles.add(s.title.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    }

    // 1. Generate Discovery Queries
    const queries = this.buildQueries(question, projectId, gaps);

    for (const query of queries) {
      if (!budgetTracker.canCreateQuery()) break;

      budgetTracker.recordQuery();
      queriesCreated.push(query);

      await this.recordEvent(
        projectId,
        'DISCOVERY_QUERY_CREATED',
        actor,
        `Query penemuan disusun: '${query.query}' (Intent: ${query.intent}).`,
        { queryId: query.id, intent: query.intent }
      );

      // 2. Discover Candidates
      const discRes = await this.discover(query, actor);
      if (!discRes.ok) continue;

      const candidates = discRes.value.candidates;
      budgetTracker.recordCandidates(candidates.length);
      allDiscoveredCandidates.push(...candidates);

      // 3. Evaluate Candidates
      const evalResults = await this.evaluateCandidates(
        candidates,
        query,
        {
          topicVolatility: options.topicVolatility || 'MEDIUM',
          currentDate: options.currentDate,
          knownUrls,
          knownTitles
        },
        actor
      );
      allEvaluationResults.push(...evalResults);

      const accepted = candidates.filter((c) => c.status === 'ACCEPTED');

      for (const cand of accepted) {
        if (!budgetTracker.canAcceptSource()) break;

        budgetTracker.recordAcceptedSource();
        allAcceptedCandidates.push(cand);

        // Update known URL & title sets
        if (cand.url) knownUrls.add(cand.url.trim().toLowerCase().replace(/\/$/, ''));
        if (cand.title) knownTitles.add(cand.title.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

        // 4. Acquire and Ingest
        if (budgetTracker.canAcquire()) {
          budgetTracker.recordAcquisition();
          const ingestRes = await this.acquireAndIngest(cand, actor);
          if (ingestRes.ok) {
            allIngestionResults.push(ingestRes.value);
          }
        }
      }

      if (budgetTracker.isExhausted()) {
        break;
      }
    }

    // 5. Evaluasi Keragaman Sumber yang Diakuisisi
    const diversityAssessment = this.diversityChecker.checkDiversity(allAcceptedCandidates);

    const report: AcquisitionPipelineReport = {
      researchProjectId: projectId,
      researchQuestionId: question.id,
      queriesCreated,
      candidatesDiscovered: allDiscoveredCandidates,
      evaluationResults: allEvaluationResults,
      acceptedCandidates: allAcceptedCandidates,
      ingestionResults: allIngestionResults,
      diversityAssessment,
      budgetExhausted: budgetTracker.isExhausted(),
      budgetMetrics: budgetTracker.getMetrics(),
      executedAt: new Date().toISOString()
    };

    return ok(report);
  }

  // ==========================================================================
  // PRIVATE EVENT LOGGER
  // ==========================================================================

  private async recordEvent(
    projectId: string,
    type: ResearchEventType,
    actor: string,
    summary: string,
    metadata?: Record<string, unknown> | null
  ): Promise<ResearchEvent> {
    const event: ResearchEvent = {
      id: `revt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      type,
      timestamp: new Date().toISOString(),
      actor,
      summary,
      metadata
    };

    return this.eventRepo.append(event);
  }
}
