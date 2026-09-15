/**
 * NexaMOS Analytics Repositories & In-Memory Implementations
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 42).
 * Clean repository abstraction for testability and storage independence.
 */

import type { RawAnalyticsMeasurement } from '../analytics-metric.ts';
import type { ArticlePerformanceSnapshot, PerformanceBaseline } from '../performance-snapshot.ts';
import type { PerformanceSignal } from '../performance-signal.ts';
import type { PerformanceDiagnosis } from '../performance-diagnosis.ts';
import type { ContentLearning } from '../content-learning.ts';
import type { FeedbackAction } from '../feedback-action.ts';

// 1. Metric Repository
export interface AnalyticsMetricRepository {
  save(measurement: RawAnalyticsMeasurement): Promise<void>;
  saveBatch(measurements: RawAnalyticsMeasurement[]): Promise<void>;
  findByPage(pageIdentifier: string, startDate?: string, endDate?: string): Promise<RawAnalyticsMeasurement[]>;
  listAll(): Promise<RawAnalyticsMeasurement[]>;
}

export class InMemoryAnalyticsMetricRepository implements AnalyticsMetricRepository {
  private measurements: RawAnalyticsMeasurement[] = [];

  public async save(measurement: RawAnalyticsMeasurement): Promise<void> {
    this.measurements.push(measurement);
  }

  public async saveBatch(measurements: RawAnalyticsMeasurement[]): Promise<void> {
    this.measurements.push(...measurements);
  }

  public async findByPage(pageIdentifier: string, startDate?: string, endDate?: string): Promise<RawAnalyticsMeasurement[]> {
    return this.measurements.filter((m) => {
      const matchPage = m.rawPageIdentifier.includes(pageIdentifier) || (m.dimensions.page && m.dimensions.page.includes(pageIdentifier));
      if (!matchPage) return false;
      const date = m.dimensions.date;
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }

  public async listAll(): Promise<RawAnalyticsMeasurement[]> {
    return [...this.measurements];
  }
}

// 2. Performance Snapshot Repository
export interface PerformanceSnapshotRepository {
  save(snapshot: ArticlePerformanceSnapshot): Promise<void>;
  findById(id: string): Promise<ArticlePerformanceSnapshot | null>;
  findByArticleAndWindow(articleId: string, windowType: string): Promise<ArticlePerformanceSnapshot | null>;
  listByArticle(articleId: string): Promise<ArticlePerformanceSnapshot[]>;
  listAll(): Promise<ArticlePerformanceSnapshot[]>;
}

export class InMemoryPerformanceSnapshotRepository implements PerformanceSnapshotRepository {
  private snapshots: Map<string, ArticlePerformanceSnapshot> = new Map();

  public async save(snapshot: ArticlePerformanceSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  public async findById(id: string): Promise<ArticlePerformanceSnapshot | null> {
    return this.snapshots.get(id) || null;
  }

  public async findByArticleAndWindow(articleId: string, windowType: string): Promise<ArticlePerformanceSnapshot | null> {
    for (const snap of this.snapshots.values()) {
      if (snap.articleId === articleId && snap.window.windowType === windowType) {
        return snap;
      }
    }
    return null;
  }

  public async listByArticle(articleId: string): Promise<ArticlePerformanceSnapshot[]> {
    return Array.from(this.snapshots.values()).filter((s) => s.articleId === articleId);
  }

  public async listAll(): Promise<ArticlePerformanceSnapshot[]> {
    return Array.from(this.snapshots.values());
  }
}

// 3. Performance Signal Repository
export interface SignalRepository {
  save(signal: PerformanceSignal): Promise<void>;
  saveBatch(signals: PerformanceSignal[]): Promise<void>;
  listByArticle(articleId: string): Promise<PerformanceSignal[]>;
  listAll(): Promise<PerformanceSignal[]>;
}

export class InMemorySignalRepository implements SignalRepository {
  private signals: PerformanceSignal[] = [];

  public async save(signal: PerformanceSignal): Promise<void> {
    this.signals.push(signal);
  }

  public async saveBatch(signals: PerformanceSignal[]): Promise<void> {
    this.signals.push(...signals);
  }

  public async listByArticle(articleId: string): Promise<PerformanceSignal[]> {
    return this.signals.filter((s) => s.articleId === articleId);
  }

  public async listAll(): Promise<PerformanceSignal[]> {
    return [...this.signals];
  }
}

// 4. Performance Diagnosis Repository
export interface DiagnosisRepository {
  save(diagnosis: PerformanceDiagnosis): Promise<void>;
  listByArticle(articleId: string): Promise<PerformanceDiagnosis[]>;
  listAll(): Promise<PerformanceDiagnosis[]>;
}

export class InMemoryDiagnosisRepository implements DiagnosisRepository {
  private diagnoses: PerformanceDiagnosis[] = [];

  public async save(diagnosis: PerformanceDiagnosis): Promise<void> {
    this.diagnoses.push(diagnosis);
  }

  public async listByArticle(articleId: string): Promise<PerformanceDiagnosis[]> {
    return this.diagnoses.filter((d) => d.articleId === articleId);
  }

  public async listAll(): Promise<PerformanceDiagnosis[]> {
    return [...this.diagnoses];
  }
}

// 5. Content Learning Repository
export interface LearningRepository {
  save(learning: ContentLearning): Promise<void>;
  listByArticle(articleId: string): Promise<ContentLearning[]>;
  listAll(): Promise<ContentLearning[]>;
}

export class InMemoryLearningRepository implements LearningRepository {
  private learnings: ContentLearning[] = [];

  public async save(learning: ContentLearning): Promise<void> {
    this.learnings.push(learning);
  }

  public async listByArticle(articleId: string): Promise<ContentLearning[]> {
    return this.learnings.filter((l) => l.articleId === articleId);
  }

  public async listAll(): Promise<ContentLearning[]> {
    return [...this.learnings];
  }
}

// 6. Feedback Action Repository
export interface FeedbackActionRepository {
  save(action: FeedbackAction): Promise<void>;
  updateStatus(actionId: string, status: 'PROPOSED' | 'ROUTED' | 'ACKNOWLEDGED' | 'DISMISSED'): Promise<void>;
  listByOriginArticle(articleId: string): Promise<FeedbackAction[]>;
  listAll(): Promise<FeedbackAction[]>;
}

export class InMemoryFeedbackActionRepository implements FeedbackActionRepository {
  private actions: Map<string, FeedbackAction> = new Map();

  public async save(action: FeedbackAction): Promise<void> {
    this.actions.set(action.id, action);
  }

  public async updateStatus(actionId: string, status: 'PROPOSED' | 'ROUTED' | 'ACKNOWLEDGED' | 'DISMISSED'): Promise<void> {
    const existing = this.actions.get(actionId);
    if (existing) {
      existing.status = status;
      if (status === 'ROUTED') {
        existing.routedAt = new Date().toISOString();
      }
      this.actions.set(actionId, existing);
    }
  }

  public async listByOriginArticle(articleId: string): Promise<FeedbackAction[]> {
    return Array.from(this.actions.values()).filter((a) => a.originArticleId === articleId);
  }

  public async listAll(): Promise<FeedbackAction[]> {
    return Array.from(this.actions.values());
  }
}

// 7. Baseline Repository
export interface BaselineRepository {
  save(baseline: PerformanceBaseline): Promise<void>;
  find(territory: string, articleType: string, windowType: string): Promise<PerformanceBaseline | null>;
  listAll(): Promise<PerformanceBaseline[]>;
}

export class InMemoryBaselineRepository implements BaselineRepository {
  private baselines: PerformanceBaseline[] = [];

  public async save(baseline: PerformanceBaseline): Promise<void> {
    const idx = this.baselines.findIndex(
      (b) => b.territory === baseline.territory && b.articleType === baseline.articleType && b.windowType === baseline.windowType
    );
    if (idx >= 0) {
      this.baselines[idx] = baseline;
    } else {
      this.baselines.push(baseline);
    }
  }

  public async find(territory: string, articleType: string, windowType: string): Promise<PerformanceBaseline | null> {
    return (
      this.baselines.find(
        (b) => b.territory === territory && b.articleType === articleType && b.windowType === windowType
      ) || null
    );
  }

  public async listAll(): Promise<PerformanceBaseline[]> {
    return [...this.baselines];
  }
}
