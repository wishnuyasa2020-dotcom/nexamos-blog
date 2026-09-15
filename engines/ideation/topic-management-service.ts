/**
 * NexaMOS Topic Management Service
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 * Application/Domain orchestration layer yang mengelola siklus hidup Topic secara deterministik:
 * CAPTURED -> SCREENING -> (RESEARCH_REQUIRED | QUALIFIED | ON_HOLD | REJECTED)
 * -> PRIORITIZED -> APPROVED -> IN_PRODUCTION -> PUBLISHED -> ARCHIVED
 */

import type {
  Topic,
  CreateTopicInput,
  UpdateTopicInput,
  PriorityDimensions,
  QualificationDecision,
  TopicArticleRelationType,
  TopicSnapshot
} from './domain/topic.types.ts';
import type { Result, DomainError } from './domain/result.ts';
import { ok, err, createDomainError } from './domain/result.ts';
import type { TopicEvent, TopicEventType } from './domain/topic-event.ts';
import type { TopicArticleRelation } from './domain/topic-article-relation.ts';
import type { TopicRepository } from './repository/topic-repository.ts';
import type { TopicEventRepository } from './repository/topic-event-repository.ts';
import type { TopicArticleRelationRepository } from './repository/topic-article-relation-repository.ts';
import type { TopicQueryParams, TopicQueryResult } from './repository/topic-query.ts';

import { qualifyTopic } from './topic-qualifier.ts';
import { scoreOpportunity } from './opportunity-scorer.ts';
import type { ScoreOpportunityResult } from './opportunity-scorer.ts';
import { validateTopicTransition } from './topic-transition.ts';

export interface ManualOverrideInput {
  newDecision: QualificationDecision;
  reason: string;
  actor: string;
}

export interface TopicManagementServiceDependencies {
  topicRepo: TopicRepository;
  eventRepo: TopicEventRepository;
  relationRepo: TopicArticleRelationRepository;
}

export class TopicManagementService {
  private topicRepo: TopicRepository;
  private eventRepo: TopicEventRepository;
  private relationRepo: TopicArticleRelationRepository;

  constructor(deps: TopicManagementServiceDependencies) {
    this.topicRepo = deps.topicRepo;
    this.eventRepo = deps.eventRepo;
    this.relationRepo = deps.relationRepo;
  }

  // ==========================================================================
  // 1. CAPTURE & UPDATE
  // ==========================================================================

  /**
   * Menangkap ide/topik baru ke dalam sistem dengan status awal CAPTURED
   */
  async captureTopic(
    input: CreateTopicInput,
    actor = 'editorial-agent'
  ): Promise<Result<Topic, DomainError>> {
    // Validasi kelengkapan minimum
    if (!input.title || input.title.trim().length === 0) {
      return err(createDomainError('VALIDATION_FAILED', 'Title topik wajib diisi.'));
    }
    if (!input.problem || input.problem.trim().length === 0) {
      return err(createDomainError('VALIDATION_FAILED', 'Problem topik wajib dirumuskan.'));
    }
    if (!input.audience?.segment || input.audience.segment.trim().length === 0) {
      return err(createDomainError('VALIDATION_FAILED', 'Segmen audiens sasaran wajib diisi.'));
    }

    const now = new Date().toISOString();
    const id = (input as { id?: string }).id || `top-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const slug = input.slug || this.slugify(input.title);

    // Periksa keunikan ID dan Slug
    if (await this.topicRepo.existsById(id)) {
      return err(createDomainError('DUPLICATE_TOPIC_ID', `ID topik '${id}' sudah ada.`));
    }
    if (await this.topicRepo.existsBySlug(slug)) {
      return err(createDomainError('DUPLICATE_TOPIC_SLUG', `Slug topik '${slug}' sudah digunakan.`));
    }

    const topic: Topic = {
      ...input,
      id,
      slug,
      status: 'CAPTURED',
      createdAt: now,
      updatedAt: now,
      articleIds: []
    };

    const createRes = await this.topicRepo.create(topic);
    if (!createRes.ok) return createRes;

    await this.recordEvent(
      topic.id,
      'TOPIC_CAPTURED',
      actor,
      `Topik baru '${topic.title}' berhasil ditangkap ke dalam sistem dengan status CAPTURED.`
    );

    return ok(createRes.value);
  }

  /**
   * Memperbarui atribut data topik
   */
  async updateTopic(
    id: string,
    updates: UpdateTopicInput,
    actor = 'editor'
  ): Promise<Result<Topic, DomainError>> {
    const existing = await this.topicRepo.getById(id);
    if (!existing) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    // Jika slug diubah, pastikan tidak duplikat
    if (updates.slug && updates.slug !== existing.slug) {
      if (await this.topicRepo.existsBySlug(updates.slug)) {
        return err(createDomainError('DUPLICATE_TOPIC_SLUG', `Slug baru '${updates.slug}' sudah ada.`));
      }
    }

    const now = new Date().toISOString();
    const updated: Topic = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt,
      updatedAt: now
    };

    const updateRes = await this.topicRepo.update(updated);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      id,
      'TOPIC_UPDATED',
      actor,
      `Atribut topik '${updated.title}' berhasil diperbarui.`,
      { updatedFields: Object.keys(updates) }
    );

    return ok(updateRes.value);
  }

  // ==========================================================================
  // 2. SCREENING & QUALIFICATION
  // ==========================================================================

  /**
   * Memulai proses screening awal topik (CAPTURED -> SCREENING)
   */
  async screenTopic(id: string, actor = 'screener'): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    const trans = validateTopicTransition(topic.status, 'SCREENING');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke SCREENING ditolak.'));
    }

    topic.status = 'SCREENING';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      id,
      'TOPIC_SCREENING_STARTED',
      actor,
      `Proses screening editorial dimulai untuk topik '${topic.title}'.`
    );

    return ok(updateRes.value);
  }

  /**
   * Menjalankan evaluasi 6 gerbang kualifikasi dan mengorkestrasi transisi status
   */
  async qualifyTopic(
    id: string,
    options: { override?: ManualOverrideInput; actor?: string } = {}
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    // Jalankan engine kualifikasi deterministik
    const qualification = qualifyTopic(topic);
    let finalDecision = qualification.decision;
    let overrideMeta: Record<string, unknown> | null = null;

    // Handle Manual Override jika diberikan oleh editor
    if (options.override) {
      const { newDecision, reason, actor } = options.override;
      overrideMeta = {
        override: true,
        originalDecision: qualification.decision,
        newDecision,
        reason,
        actor,
        timestamp: new Date().toISOString()
      };
      finalDecision = newDecision;
      qualification.decision = newDecision;
      qualification.summary += ` [MANUAL OVERRIDE: ${reason} (oleh ${actor})]`;
    }

    // Tentukan target status berdasarkan hasil keputusan akhir
    const targetStatus = finalDecision; // Enum status sama dengan QualificationDecision

    // Validasi transisi status siklus hidup
    const trans = validateTopicTransition(topic.status, targetStatus);
    if (!trans.allowed) {
      return err(
        createDomainError(
          'INVALID_TOPIC_TRANSITION',
          `Hasil kualifikasi '${finalDecision}' tidak dapat diterapkan: ${trans.reason}`
        )
      );
    }

    topic.qualification = qualification;
    topic.status = targetStatus;
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    // Tentukan event type berdasarkan status
    const eventTypeMap: Record<QualificationDecision, TopicEventType> = {
      QUALIFIED: 'TOPIC_QUALIFIED',
      RESEARCH_REQUIRED: 'TOPIC_RESEARCH_REQUIRED',
      ON_HOLD: 'TOPIC_ON_HOLD',
      REJECTED: 'TOPIC_REJECTED'
    };

    const eventType = eventTypeMap[finalDecision];
    const actor = options.override?.actor || options.actor || 'editorial-qualifier';

    await this.recordEvent(
      id,
      eventType,
      actor,
      `Evaluasi kualifikasi menghasilkan keputusan: ${finalDecision}. ${qualification.summary}`,
      overrideMeta ? { override: overrideMeta } : null
    );

    return ok(updateRes.value);
  }

  // ==========================================================================
  // 3. SCORING & PRIORITIZATION
  // ==========================================================================

  /**
   * Menghitung nilai peluang editorial menggunakan formula TOPIC_PRIORITY_V1
   */
  async scoreTopic(
    id: string,
    options: {
      customDimensions?: PriorityDimensions;
      allowSimulation?: boolean;
      actor?: string;
    } = {}
  ): Promise<Result<ScoreOpportunityResult, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    // Guardrail: Hanya topik berstatus QUALIFIED yang dapat dinilai (kecuali simulasi)
    if (topic.status !== 'QUALIFIED' && topic.status !== 'PRIORITIZED' && !options.allowSimulation) {
      return err(
        createDomainError(
          'TOPIC_NOT_QUALIFIED',
          `Topik berstatus '${topic.status}' belum lolos kualifikasi. Hanya topik 'QUALIFIED' yang dapat dinilai prioritasnya.`
        )
      );
    }

    const inputDims = options.customDimensions || topic.priority;
    if (!inputDims) {
      return err(
        createDomainError(
          'VALIDATION_FAILED',
          'Dimensi prioritas tidak ditemukan pada topik atau argumen.'
        )
      );
    }

    const scoreRes = scoreOpportunity(inputDims, {
      allowSimulation: options.allowSimulation
    });

    if (!scoreRes.success || !scoreRes.scoring) {
      return err(
        createDomainError(
          'VALIDATION_FAILED',
          scoreRes.error || 'Perhitungan skor prioritas gagal.'
        )
      );
    }

    // Simpan hasil prioritas ke topik
    topic.priority = {
      ...scoreRes.scoring.dimensions,
      overall: scoreRes.scoring.overall
    };
    topic.updatedAt = new Date().toISOString();

    await this.topicRepo.update(topic);

    return ok(scoreRes);
  }

  /**
   * Memvalidasi dan mengubah status topik menjadi PRIORITIZED (QUALIFIED -> PRIORITIZED)
   */
  async prioritizeTopic(
    id: string,
    actor = 'editorial-prioritizer'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    if (topic.priority?.overall === undefined || topic.priority?.overall === null) {
      return err(
        createDomainError(
          'VALIDATION_FAILED',
          'Topik harus dihitung skor prioritasnya terlebih dahulu sebelum diprioritaskan.'
        )
      );
    }

    const trans = validateTopicTransition(topic.status, 'PRIORITIZED');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke PRIORITIZED ditolak.'));
    }

    topic.status = 'PRIORITIZED';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      id,
      'TOPIC_PRIORITIZED',
      actor,
      `Topik '${topic.title}' berhasil diprioritaskan dengan skor keseluruhan ${topic.priority.overall}.`
    );

    return ok(updateRes.value);
  }

  // ==========================================================================
  // 4. APPROVAL & PRODUCTION
  // ==========================================================================

  /**
   * Menyetujui topik untuk masuk lini produksi (HANYA DARI PRIORITIZED -> APPROVED)
   */
  async approveTopic(
    id: string,
    approvedBy: string,
    approvalNote?: string
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    // Guardrail: Hanya topik PRIORITIZED yang dapat diapprove
    if (topic.status !== 'PRIORITIZED') {
      return err(
        createDomainError(
          'TOPIC_NOT_PRIORITIZED',
          `Topik berstatus '${topic.status}' tidak dapat disetujui. Topik harus berada pada status 'PRIORITIZED' terlebih dahulu.`
        )
      );
    }

    const trans = validateTopicTransition(topic.status, 'APPROVED');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke APPROVED ditolak.'));
    }

    const now = new Date().toISOString();
    topic.status = 'APPROVED';
    topic.approvedAt = now;
    topic.approvedBy = approvedBy;
    topic.approvalNote = approvalNote || null;
    topic.updatedAt = now;

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      id,
      'TOPIC_APPROVED',
      approvedBy,
      `Topik disetujui oleh '${approvedBy}' untuk produksi editorial. Catatan: ${approvalNote || 'Tanpa catatan khusus'}.`
    );

    return ok(updateRes.value);
  }

  /**
   * Memulai penulisan artikel (APPROVED -> IN_PRODUCTION)
   */
  async startProduction(
    id: string,
    actor = 'production-lead'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    // Guardrail: Hanya topik APPROVED yang boleh masuk produksi
    if (topic.status !== 'APPROVED') {
      return err(
        createDomainError(
          'TOPIC_NOT_APPROVED',
          `Topik berstatus '${topic.status}' tidak dapat masuk produksi. Topik harus berstatus 'APPROVED' terlebih dahulu.`
        )
      );
    }

    // Completeness check saat produksi dimulai
    const missing: string[] = [];
    if (!topic.title) missing.push('title');
    if (!topic.territory) missing.push('territory');
    if (!topic.audience?.segment) missing.push('audience.segment');
    if (!topic.problem) missing.push('problem');
    if (!topic.informationGain?.expectedContribution) missing.push('informationGain.expectedContribution');
    if (!topic.recommendedArticleType) missing.push('recommendedArticleType');

    if (missing.length > 0) {
      return err(
        createDomainError(
          'VALIDATION_FAILED',
          `Topik belum lengkap untuk masuk produksi. Bidang yang kurang: ${missing.join(', ')}.`
        )
      );
    }

    const trans = validateTopicTransition(topic.status, 'IN_PRODUCTION');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke IN_PRODUCTION ditolak.'));
    }

    topic.status = 'IN_PRODUCTION';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      id,
      'TOPIC_PRODUCTION_STARTED',
      actor,
      `Produksi artikel naskah dimulai untuk topik '${topic.title}' di folder editorial-ops/production.`
    );

    return ok(updateRes.value);
  }

  // ==========================================================================
  // 5. RELASI ARTIKEL & PUBLIKASI
  // ==========================================================================

  /**
   * Menghubungkan sebuah Article ke Topic (Mendukung 1 Topic -> N Articles)
   */
  async linkArticle(
    topicId: string,
    articleId: string,
    relationType: TopicArticleRelationType = 'PRIMARY',
    actor = 'content-manager'
  ): Promise<Result<TopicArticleRelation, DomainError>> {
    const topic = await this.topicRepo.getById(topicId);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${topicId}' tidak ditemukan.`));
    }

    const relation: TopicArticleRelation = {
      topicId,
      articleId,
      relationType,
      createdAt: new Date().toISOString()
    };

    const savedRelation = await this.relationRepo.add(relation);

    // Pastikan articleId tersimpan di array articleIds topik
    if (!topic.articleIds) topic.articleIds = [];
    if (!topic.articleIds.includes(articleId)) {
      topic.articleIds.push(articleId);
      topic.updatedAt = new Date().toISOString();
      await this.topicRepo.update(topic);
    }

    await this.recordEvent(
      topicId,
      'TOPIC_ARTICLE_LINKED',
      actor,
      `Artikel '${articleId}' dihubungkan ke topik sebagai relasi '${relationType}'.`
    );

    return ok(savedRelation);
  }

  /**
   * Menandai topik telah berhasil terbit (IN_PRODUCTION -> PUBLISHED)
   */
  async markPublished(
    topicId: string,
    articleId: string,
    publishedAt?: string,
    actor = 'publisher'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(topicId);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${topicId}' tidak ditemukan.`));
    }

    // Guardrail: Wajib memiliki relasi artikel sebelum publish
    const hasRelation = await this.relationRepo.exists(topicId, articleId);
    if (!hasRelation && (!topic.articleIds || !topic.articleIds.includes(articleId))) {
      return err(
        createDomainError(
          'ARTICLE_RELATION_REQUIRED',
          `Artikel '${articleId}' belum terhubung ke topik '${topicId}'. Topik tidak dapat ditandai PUBLISHED tanpa relasi artikel terverifikasi.`
        )
      );
    }

    const trans = validateTopicTransition(topic.status, 'PUBLISHED');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke PUBLISHED ditolak.'));
    }

    const now = publishedAt || new Date().toISOString();
    topic.status = 'PUBLISHED';
    topic.updatedAt = now;

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(
      topicId,
      'TOPIC_PUBLISHED',
      actor,
      `Topik berhasil terbit melalui artikel '${articleId}' pada ${now}.`
    );

    return ok(updateRes.value);
  }

  // ==========================================================================
  // 6. ALTERNATE STATE CONTROLS
  // ==========================================================================

  async putOnHold(
    id: string,
    reason: string,
    actor = 'editor'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    const trans = validateTopicTransition(topic.status, 'ON_HOLD');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke ON_HOLD ditolak.'));
    }

    topic.status = 'ON_HOLD';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(id, 'TOPIC_ON_HOLD', actor, `Topik ditahan (on hold): ${reason}.`);
    return ok(updateRes.value);
  }

  async resumeTopic(id: string, actor = 'editor'): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    const trans = validateTopicTransition(topic.status, 'SCREENING');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi resume ditolak.'));
    }

    topic.status = 'SCREENING';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(id, 'TOPIC_RESUMED', actor, 'Topik diaktifkan kembali dan masuk tahap SCREENING.');
    return ok(updateRes.value);
  }

  async rejectTopic(
    id: string,
    reason: string,
    actor = 'editor'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    const trans = validateTopicTransition(topic.status, 'REJECTED');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke REJECTED ditolak.'));
    }

    topic.status = 'REJECTED';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(id, 'TOPIC_REJECTED', actor, `Topik ditolak: ${reason}.`);
    return ok(updateRes.value);
  }

  async archiveTopic(
    id: string,
    reason: string,
    actor = 'editor'
  ): Promise<Result<Topic, DomainError>> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) {
      return err(createDomainError('TOPIC_NOT_FOUND', `Topik dengan id '${id}' tidak ditemukan.`));
    }

    const trans = validateTopicTransition(topic.status, 'ARCHIVED');
    if (!trans.allowed) {
      return err(createDomainError('INVALID_TOPIC_TRANSITION', trans.reason || 'Transisi ke ARCHIVED ditolak.'));
    }

    topic.status = 'ARCHIVED';
    topic.updatedAt = new Date().toISOString();

    const updateRes = await this.topicRepo.update(topic);
    if (!updateRes.ok) return updateRes;

    await this.recordEvent(id, 'TOPIC_ARCHIVED', actor, `Topik diarsipkan: ${reason}.`);
    return ok(updateRes.value);
  }

  // ==========================================================================
  // 7. READ & SNAPSHOT METHODS
  // ==========================================================================

  async getTopic(id: string): Promise<Topic | null> {
    return this.topicRepo.getById(id);
  }

  async getTopicBySlug(slug: string): Promise<Topic | null> {
    return this.topicRepo.getBySlug(slug);
  }

  async getTopicHistory(topicId: string): Promise<TopicEvent[]> {
    return this.eventRepo.listByTopicId(topicId);
  }

  async getTopicSnapshot(id: string): Promise<TopicSnapshot | null> {
    const topic = await this.topicRepo.getById(id);
    if (!topic) return null;

    const [events, relations] = await Promise.all([
      this.eventRepo.listByTopicId(id),
      this.relationRepo.listByTopicId(id)
    ]);

    const lastEvent = events.length > 0 ? events[events.length - 1] : null;

    return {
      topic,
      qualification: topic.qualification || null,
      priority: topic.priority || null,
      articleRelations: relations,
      lastEvent
    };
  }

  async listTopics(query?: TopicQueryParams): Promise<TopicQueryResult> {
    return this.topicRepo.list(query);
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async recordEvent(
    topicId: string,
    type: TopicEventType,
    actor: string,
    summary: string,
    metadata?: Record<string, unknown> | null
  ): Promise<TopicEvent> {
    const event: TopicEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      topicId,
      type,
      timestamp: new Date().toISOString(),
      actor,
      summary,
      metadata
    };

    return this.eventRepo.append(event);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
