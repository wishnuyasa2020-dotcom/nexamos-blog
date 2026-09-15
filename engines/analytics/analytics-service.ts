/**
 * NexaMOS Analytics Service Orchestrator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications.
 * Menutup loop NexaMOS Blog:
 * PUBLISH → MARKET RESPONSE → NORMALIZED SIGNALS → DIAGNOSIS → LEARNING → FEEDBACK ACTION
 */

import type { AnalyticsProvider } from './providers/analytics-provider.contract.ts';
import { ArticleIdentityResolver, type ResolvedArticleIdentity } from './providers/article-identity-resolver.ts';
import { AnalyticsNormalizer } from './analytics-normalizer.ts';
import { SignalDetector } from './signal-detector.ts';
import { PerformanceDiagnosisService } from './performance-diagnosis-service.ts';
import { LearningEngine } from './learning-engine.ts';
import { FeedbackRouter } from './feedback-router.ts';
import type { RawAnalyticsMeasurement } from './analytics-metric.ts';
import type { ArticlePerformanceSnapshot, PerformanceBaseline, ArticlePerformanceScorecard } from './performance-snapshot.ts';
import type { PerformanceSignal } from './performance-signal.ts';
import type { PerformanceDiagnosis } from './performance-diagnosis.ts';
import type { ContentLearning } from './content-learning.ts';
import type { FeedbackAction } from './feedback-action.ts';
import type { PerformanceWindow } from './performance-window.ts';
import type { AnalyticsDataAnomaly, AnalyticsAuditEvent } from './analytics-source.ts';
import type { PublicationManifest } from '../publishing/publication.ts';
import type { TopicManagementService } from '../ideation/topic-management-service.ts';
import type {
  AnalyticsMetricRepository,
  PerformanceSnapshotRepository,
  SignalRepository,
  DiagnosisRepository,
  LearningRepository,
  FeedbackActionRepository,
  BaselineRepository
} from './repository/analytics-repository.ts';
import {
  InMemoryAnalyticsMetricRepository,
  InMemoryPerformanceSnapshotRepository,
  InMemorySignalRepository,
  InMemoryDiagnosisRepository,
  InMemoryLearningRepository,
  InMemoryFeedbackActionRepository,
  InMemoryBaselineRepository
} from './repository/analytics-repository.ts';
import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';

export interface ArticleAnalyticsSummary {
  articleTitle: string;
  slug: string;
  articleId: string;
  searchSummary: string;
  discoverSummary: string;
  aiSearchSummary: string;
  behaviorSummary: string;
  diagnosesSummary: string[];
  recommendedActionsSummary: string[];
  learningsSummary: string[];
  sampleSufficiency: string;
}

export class AnalyticsService {
  private providers: Map<string, AnalyticsProvider> = new Map();
  public readonly identityResolver: ArticleIdentityResolver;
  private normalizer: AnalyticsNormalizer;
  private signalDetector: SignalDetector;
  private diagnosisService: PerformanceDiagnosisService;
  private learningEngine: LearningEngine;
  private feedbackRouter: FeedbackRouter;

  // Repositories
  public readonly metricRepo: AnalyticsMetricRepository;
  public readonly snapshotRepo: PerformanceSnapshotRepository;
  public readonly signalRepo: SignalRepository;
  public readonly diagnosisRepo: DiagnosisRepository;
  public readonly learningRepo: LearningRepository;
  public readonly feedbackRepo: FeedbackActionRepository;
  public readonly baselineRepo: BaselineRepository;

  private auditEvents: AnalyticsAuditEvent[] = [];

  constructor(options: {
    topicService?: TopicManagementService;
    metricRepo?: AnalyticsMetricRepository;
    snapshotRepo?: PerformanceSnapshotRepository;
    signalRepo?: SignalRepository;
    diagnosisRepo?: DiagnosisRepository;
    learningRepo?: LearningRepository;
    feedbackRepo?: FeedbackActionRepository;
    baselineRepo?: BaselineRepository;
  } = {}) {
    this.identityResolver = new ArticleIdentityResolver();
    this.normalizer = new AnalyticsNormalizer();
    this.signalDetector = new SignalDetector();
    this.diagnosisService = new PerformanceDiagnosisService();
    this.learningEngine = new LearningEngine();
    this.feedbackRouter = new FeedbackRouter(options.topicService);

    this.metricRepo = options.metricRepo || new InMemoryAnalyticsMetricRepository();
    this.snapshotRepo = options.snapshotRepo || new InMemoryPerformanceSnapshotRepository();
    this.signalRepo = options.signalRepo || new InMemorySignalRepository();
    this.diagnosisRepo = options.diagnosisRepo || new InMemoryDiagnosisRepository();
    this.learningRepo = options.learningRepo || new InMemoryLearningRepository();
    this.feedbackRepo = options.feedbackRepo || new InMemoryFeedbackActionRepository();
    this.baselineRepo = options.baselineRepo || new InMemoryBaselineRepository();
  }

  public registerProvider(provider: AnalyticsProvider): void {
    this.providers.set(provider.sourceType, provider);
  }

  public registerPublishedArticle(manifest: PublicationManifest, topicId?: string): void {
    this.identityResolver.registerManifest(manifest, topicId);
  }

  public logAuditEvent(eventType: AnalyticsAuditEvent['eventType'], articleId?: string, details: Record<string, any> = {}): void {
    this.auditEvents.push({
      eventId: `audit-analytics-${Date.now()}-${this.auditEvents.length}`,
      eventType,
      articleId,
      timestamp: new Date().toISOString(),
      details
    });
  }

  public getAuditEvents(): AnalyticsAuditEvent[] {
    return [...this.auditEvents];
  }

  /**
   * Menelan pengukuran performa mentah dari berbagai provider
   */
  public async ingestMeasurements(measurements: RawAnalyticsMeasurement[]): Promise<void> {
    this.logAuditEvent('ANALYTICS_INGESTION_STARTED', undefined, { count: measurements.length });
    await this.metricRepo.saveBatch(measurements);
    this.logAuditEvent('ANALYTICS_DATA_IMPORTED', undefined, { count: measurements.length });
  }

  /**
   * Menjalankan siklus pemrosesan performa lengkap untuk suatu artikel pada rentang waktu tertentu
   */
  public async processArticlePerformance(params: {
    articleId: string;
    window: PerformanceWindow;
    territory: Territory;
    articleType: ArticleType;
    editorialRole?: EditorialRole | null;
    anomalies?: AnalyticsDataAnomaly[];
    isProductionMode?: boolean;
  }): Promise<{
    snapshot: ArticlePerformanceSnapshot;
    signals: PerformanceSignal[];
    diagnoses: PerformanceDiagnosis[];
    learnings: ContentLearning[];
    actions: FeedbackAction[];
  }> {
    const { articleId, window, territory, articleType, editorialRole, anomalies = [], isProductionMode } = params;

    const identity = this.identityResolver.resolveByArticleId(articleId);
    if (!identity) {
      throw new Error(`Identitas artikel '${articleId}' belum terdaftar dalam ArticleIdentityResolver.`);
    }

    // 1. Ambil data mentah yang tersimpan untuk URL / artikel ini
    const measurements = await this.metricRepo.findByPage(identity.slug, window.startDate, window.endDate);

    // 2. Normalisasi ke dalam Snapshot
    const snapshot = this.normalizer.normalizeSnapshot({
      identity,
      window,
      territory,
      articleType,
      editorialRole,
      measurements,
      anomalies,
      isProductionMode
    });
    await this.snapshotRepo.save(snapshot);
    this.logAuditEvent('PERFORMANCE_SNAPSHOT_CREATED', articleId, { snapshotId: snapshot.id });

    // 3. Ambil snapshot pembanding sebelumnya dan baseline kohort jika ada
    const previousSnapshot = await this.findPreviousSnapshot(articleId, window);
    const baseline = await this.baselineRepo.find(territory, articleType, window.windowType);

    // 4. Deteksi Sinyal
    const signals = this.signalDetector.detectSignals({
      currentSnapshot: snapshot,
      previousSnapshot,
      baseline
    });
    await this.signalRepo.saveBatch(signals);
    if (signals.length > 0) {
      this.logAuditEvent('SIGNAL_DETECTED', articleId, { count: signals.length });
    }

    // 5. Interpretasi Diagnosis
    const diagnoses = this.diagnosisService.diagnose({
      snapshot,
      signals
    });
    for (const d of diagnoses) {
      await this.diagnosisRepo.save(d);
    }
    if (diagnoses.length > 0) {
      this.logAuditEvent('DIAGNOSIS_CREATED', articleId, { count: diagnoses.length });
    }

    // 6. Ekstraksi Pembelajaran Terlingkup (Content Learning)
    const learnings = this.learningEngine.extractLearnings({
      snapshot,
      diagnoses
    });
    for (const l of learnings) {
      await this.learningRepo.save(l);
    }
    if (learnings.length > 0) {
      this.logAuditEvent('LEARNING_CREATED', articleId, { count: learnings.length });
    }

    // 7. Usulkan Tindakan Umpan Balik (Feedback Action)
    const actions = this.feedbackRouter.proposeActions({
      snapshot,
      diagnoses,
      learnings
    });
    for (const a of actions) {
      await this.feedbackRepo.save(a);
    }
    if (actions.length > 0) {
      this.logAuditEvent('FEEDBACK_ACTION_PROPOSED', articleId, { count: actions.length });
    }

    return {
      snapshot,
      signals,
      diagnoses,
      learnings,
      actions
    };
  }

  /**
   * Menghasilkan Scorecard Performa Multi-Dimensi (No single artificial score)
   */
  public generateScorecard(snapshot: ArticlePerformanceSnapshot): ArticlePerformanceScorecard {
    const searchVal = snapshot.search?.impressions.value ?? 0;
    const discoverStatus = snapshot.discover?.thresholdStatus;
    const aiVal = snapshot.generativeAISearch?.impressions.value ?? 0;
    const sessions = snapshot.behavior?.sessions.value ?? 0;
    const engRate = snapshot.behavior?.engagementRate.value ?? 0;

    return {
      articleId: snapshot.articleId,
      window: snapshot.window,
      dimensions: {
        searchVisibility:
          searchVal >= 1000 ? 'STRONG' : searchVal >= 200 ? 'ESTABLISHED' : searchVal > 0 ? 'EMERGING' : 'INSUFFICIENT_DATA',
        discoverVisibility:
          discoverStatus === 'ABOVE_THRESHOLD'
            ? 'ACTIVE'
            : discoverStatus === 'BELOW_THRESHOLD'
            ? 'THRESHOLDED'
            : 'NOT_APPEARING',
        aiVisibility: aiVal >= 100 ? 'GROWING' : aiVal > 0 ? 'DETECTED' : 'NOT_DETECTED',
        engagementQuality:
          sessions >= 30 ? (engRate >= 0.6 ? 'DEEP' : engRate >= 0.4 ? 'BALANCED' : 'SHALLOW') : 'INSUFFICIENT_DATA',
        contentLongevity: 'STABLE'
      },
      sampleSufficiency: snapshot.overallSampleSufficiency,
      notes: [
        `Search Impresi: ${searchVal}`,
        `Status Discover: ${discoverStatus || 'NO_DATA'}`,
        `Generative AI Search Impresi: ${aiVal}`
      ]
    };
  }

  /**
   * Menyajikan rangkuman analitik yang transparan dan dapat dibaca manusia (Human-readable summary)
   */
  public getArticleAnalyticsSummary(
    snapshot: ArticlePerformanceSnapshot,
    diagnoses: PerformanceDiagnosis[],
    learnings: ContentLearning[],
    actions: FeedbackAction[]
  ): ArticleAnalyticsSummary {
    const searchImp = snapshot.search?.impressions.value;
    const searchClicks = snapshot.search?.clicks.value;
    const searchCtr = snapshot.search?.ctr.value;

    const discStatus = snapshot.discover?.thresholdStatus;
    const discImp = snapshot.discover?.impressions.value;

    const aiImp = snapshot.generativeAISearch?.impressions.value;

    const sessions = snapshot.behavior?.sessions.value;
    const engRate = snapshot.behavior?.engagementRate.value;

    return {
      articleTitle: snapshot.slug,
      slug: snapshot.slug,
      articleId: snapshot.articleId,
      searchSummary:
        searchImp !== null && searchImp !== undefined
          ? `${searchImp} impresi, ${searchClicks ?? 0} klik (CTR: ${searchCtr !== null && searchCtr !== undefined ? (searchCtr * 100).toFixed(2) : 0}%)`
          : 'Data pencarian belum tersedia',
      discoverSummary:
        discStatus === 'BELOW_THRESHOLD'
          ? 'Di bawah ambang batas minimum impresi Google Discover'
          : discImp
          ? `${discImp} impresi aktif di Google Discover`
          : 'Tidak ada data Google Discover',
      aiSearchSummary:
        aiImp !== null && aiImp !== undefined && aiImp > 0
          ? `${aiImp} impresi pada Generative AI Search (Keterlacakan sitasi aktif)`
          : 'Belum terdeteksi kemunculan pada Generative AI Search',
      behaviorSummary:
        sessions !== null && sessions !== undefined
          ? `${sessions} sesi pembaca (Engagement Rate: ${engRate !== null && engRate !== undefined ? (engRate * 100).toFixed(1) : 0}%)`
          : 'Data perilaku web belum tercatat',
      diagnosesSummary: diagnoses.map((d) => `[${d.diagnosisType}] ${d.summary}`),
      recommendedActionsSummary: actions.map((a) => `[${a.target} - ${a.actionType}] ${a.reason}`),
      learningsSummary: learnings.map((l) => l.statement),
      sampleSufficiency: snapshot.overallSampleSufficiency
    };
  }

  /**
   * Merutekan FeedbackAction resmi
   */
  public async routeFeedbackAction(action: FeedbackAction) {
    const result = await this.feedbackRouter.routeAction(action);
    if (result.routed) {
      await this.feedbackRepo.updateStatus(action.id, 'ROUTED');
      this.logAuditEvent('FEEDBACK_ROUTED', action.originArticleId, { actionId: action.id, target: action.target });
    }
    return result;
  }

  private async findPreviousSnapshot(
    articleId: string,
    currentWindow: PerformanceWindow
  ): Promise<ArticlePerformanceSnapshot | null> {
    const list = await this.snapshotRepo.listByArticle(articleId);
    return list.find((s) => s.window.endDate <= currentWindow.startDate) || null;
  }
}
