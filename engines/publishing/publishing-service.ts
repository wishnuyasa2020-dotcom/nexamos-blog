/**
 * NexaMOS Publishing Service (Master Production Orchestrator)
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Menegakkan alur:
 * PUBLICATION_CANDIDATE
 * ↓
 * PACKAGING
 * ↓
 * PREFLIGHT
 * ↓
 * READY_FOR_RELEASE
 * ↓
 * SCHEDULED / RELEASE_REQUESTED
 * ↓
 * PUBLISHED
 */

import type { PublicationCandidate } from '../distribution/distribution-readiness.ts';
import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type {
  PublicationPackage,
  PublicationManifest,
  PublicationStatus,
  ArticlePublicationVersion,
  PublicationRollbackRequest
} from './publication.ts';
import { PublicationStatusManager } from './publication-status.ts';
import { PublicationPackageBuilder, type BuildPackageOptions } from './publication-package.ts';
import { PublicationPreflightValidator, type PreflightValidationResult, type PreflightOptions } from './publication-preflight.ts';
import { PublicationManifestBuilder } from './publication-manifest.ts';
import { PublicationEventLogger } from './publishing-event.ts';
import {
  type PublishingProvider,
  MockPublishingProvider,
  type ProductionApproval,
  type DeploymentMode
} from './publishing-provider.ts';
import {
  type CreatePackageResult,
  type PublishResult,
  type UnpublishResult,
  type ArchiveResult,
  type RollbackResult
} from './publishing-result.ts';

export interface PublishingServiceConfig {
  provider?: PublishingProvider;
  eventLogger?: PublicationEventLogger;
  preflightValidator?: PublicationPreflightValidator;
}

export class PublishingService {
  private readonly provider: PublishingProvider;
  private readonly eventLogger: PublicationEventLogger;
  private readonly preflightValidator: PublicationPreflightValidator;

  // Repositori internal state publikasi
  private readonly packages = new Map<string, PublicationPackage>(); // publicationId -> PublicationPackage
  private readonly statuses = new Map<string, PublicationStatus>();   // publicationId -> PublicationStatus
  private readonly manifests = new Map<string, PublicationManifest>(); // publicationId -> PublicationManifest
  private readonly publishedSlugs = new Map<string, string>();        // slug -> articleId
  private readonly versions = new Map<string, ArticlePublicationVersion[]>(); // articleId -> versions[]

  constructor(config: PublishingServiceConfig = {}) {
    this.provider = config.provider || new MockPublishingProvider();
    this.eventLogger = config.eventLogger || new PublicationEventLogger();
    this.preflightValidator = config.preflightValidator || new PublicationPreflightValidator();
  }

  /**
   * 1. PACKAGING: Mengonversi PublicationCandidate menjadi PublicationPackage
   */
  public createPackage(
    candidate: PublicationCandidate,
    draft: ArticleDraft,
    topic: Topic,
    seoMeta: ArticleSEOMetadata,
    brief?: ResearchBrief | null,
    options: BuildPackageOptions = {}
  ): CreatePackageResult {
    const pkg = PublicationPackageBuilder.build(candidate, draft, topic, seoMeta, brief, options);
    const publicationId = pkg.id;

    this.packages.set(publicationId, pkg);
    this.statuses.set(publicationId, 'PACKAGING');

    const event = this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_PACKAGE_CREATED',
      summary: `Paket publikasi berhasil dibuat untuk artikel '${pkg.title}' (slug: ${pkg.slug}).`,
      metadata: { slug: pkg.slug, canonicalUrl: pkg.canonicalUrl }
    });

    return {
      success: true,
      package: pkg,
      event
    };
  }

  /**
   * 2. PREFLIGHT: Menjalankan validasi pra-terbang
   */
  public runPreflight(
    publicationId: string,
    options: PreflightOptions = {}
  ): PreflightValidationResult {
    const pkg = this.packages.get(publicationId);
    if (!pkg) {
      throw new Error(`PublicationPackage dengan ID '${publicationId}' tidak ditemukan.`);
    }

    this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_PREFLIGHT_STARTED',
      summary: `Memulai pemeriksaan preflight untuk paket publikasi '${publicationId}'.`
    });

    const preflightOpts: PreflightOptions = {
      existingPublishedSlugs: this.publishedSlugs,
      ...options
    };

    const result = this.preflightValidator.validate(pkg, preflightOpts);

    if (result.status === 'FAIL') {
      this.statuses.set(publicationId, 'PREFLIGHT_FAILED');
      this.eventLogger.log({
        publicationId,
        articleId: pkg.articleId,
        event: 'PUBLICATION_PREFLIGHT_FAILED',
        summary: `Pemeriksaan preflight GAGAL: ${result.blockingErrors.join('; ')}`,
        metadata: { blockingErrors: result.blockingErrors }
      });
    } else {
      this.statuses.set(publicationId, 'READY_FOR_RELEASE');
      this.eventLogger.log({
        publicationId,
        articleId: pkg.articleId,
        event: 'PUBLICATION_PREFLIGHT_PASSED',
        summary: `Pemeriksaan preflight LOLOS dengan status: ${result.status}.`,
        metadata: { warnings: result.warnings }
      });
    }

    return result;
  }

  /**
   * 3. READY FOR RELEASE
   */
  public markReadyForRelease(publicationId: string): void {
    const current = this.getStatus(publicationId);
    PublicationStatusManager.assertTransition(current, 'READY_FOR_RELEASE');
    this.statuses.set(publicationId, 'READY_FOR_RELEASE');
  }

  /**
   * 4. SCHEDULE PUBLICATION
   */
  public schedulePublication(publicationId: string, scheduledDate: string): void {
    const current = this.getStatus(publicationId);
    PublicationStatusManager.assertTransition(current, 'SCHEDULED');
    this.statuses.set(publicationId, 'SCHEDULED');

    const pkg = this.packages.get(publicationId)!;
    this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_RELEASE_REQUESTED',
      summary: `Publikasi dijadwalkan pada ${scheduledDate}.`,
      metadata: { scheduledDate }
    });
  }

  /**
   * 5. REQUEST RELEASE
   */
  public requestRelease(publicationId: string, actor: string = 'Editorial Lead'): void {
    const current = this.getStatus(publicationId);
    PublicationStatusManager.assertTransition(current, 'RELEASE_REQUESTED');
    this.statuses.set(publicationId, 'RELEASE_REQUESTED');

    const pkg = this.packages.get(publicationId)!;
    this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_RELEASE_REQUESTED',
      actor,
      summary: `Permintaan rilis publik diajukan oleh ${actor}.`
    });
  }

  /**
   * 6. PUBLISH: Mengeksekusi rilis publik (Preview atau Production)
   */
  public async publish(params: {
    publicationId: string;
    mode?: DeploymentMode;
    approval?: ProductionApproval;
    preflightOptions?: PreflightOptions;
  }): Promise<PublishResult> {
    const { publicationId, mode = 'PREVIEW', approval, preflightOptions } = params;
    const pkg = this.packages.get(publicationId);
    if (!pkg) {
      throw new Error(`Paket publikasi '${publicationId}' tidak ditemukan.`);
    }

    // 1. Jalankan atau pastikan preflight lolos
    const preflightResult = this.runPreflight(publicationId, preflightOptions);
    if (preflightResult.status === 'FAIL') {
      return {
        success: false,
        publicationId,
        articleId: pkg.articleId,
        slug: pkg.slug,
        canonicalUrl: pkg.canonicalUrl,
        status: 'PREFLIGHT_FAILED',
        preflightResult,
        error: `Preflight gagal dengan ${preflightResult.blockingErrors.length} kesalahan kritis.`,
        events: this.eventLogger.getEvents(publicationId)
      };
    }

    // 2. Request release jika belum
    if (this.getStatus(publicationId) !== 'RELEASE_REQUESTED') {
      this.statuses.set(publicationId, 'RELEASE_REQUESTED');
    }

    try {
      // 3. Bangun artefak via Provider
      const buildOutput = await this.provider.build(pkg, mode);

      // 4. Deploy via Provider (Production butuh human approval)
      const deployOutput = await this.provider.deploy(buildOutput.buildId, mode, approval);

      // 5. Update state resmi published
      this.statuses.set(publicationId, 'PUBLISHED');
      this.publishedSlugs.set(pkg.slug, pkg.articleId);

      // 6. Buat Manifest Resmi
      const publishedAt = new Date().toISOString();
      pkg.publishedAt = publishedAt;

      const manifest = PublicationManifestBuilder.createManifest({
        publicationId,
        pkg,
        status: 'PUBLISHED',
        publishedAt,
        buildId: buildOutput.buildId,
        deploymentId: deployOutput.deploymentId
      });
      this.manifests.set(publicationId, manifest);

      // 7. Catat Versi Publikasi (History)
      this.recordPublicationVersion(pkg, manifest.contentHash, 'PUBLISHED');

      // 8. Catat Event Terbit
      this.eventLogger.log({
        publicationId,
        articleId: pkg.articleId,
        event: 'PUBLICATION_PUBLISHED',
        actor: approval?.approvedBy || 'System Publisher',
        summary: `Artikel resmi DITERBITKAN di mode ${mode}: ${deployOutput.deploymentUrl}`,
        metadata: {
          deploymentId: deployOutput.deploymentId,
          deploymentUrl: deployOutput.deploymentUrl,
          mode,
          contentHash: manifest.contentHash
        }
      });

      return {
        success: true,
        publicationId,
        articleId: pkg.articleId,
        slug: pkg.slug,
        canonicalUrl: pkg.canonicalUrl,
        status: 'PUBLISHED',
        manifest,
        preflightResult,
        deploymentUrl: deployOutput.deploymentUrl,
        events: this.eventLogger.getEvents(publicationId)
      };
    } catch (err: any) {
      this.statuses.set(publicationId, 'PUBLISH_FAILED');
      this.eventLogger.log({
        publicationId,
        articleId: pkg.articleId,
        event: 'PUBLICATION_FAILED',
        summary: `Eksekusi rilis publikasi GAGAL: ${err.message}`,
        metadata: { error: err.message }
      });

      return {
        success: false,
        publicationId,
        articleId: pkg.articleId,
        slug: pkg.slug,
        canonicalUrl: pkg.canonicalUrl,
        status: 'PUBLISH_FAILED',
        preflightResult,
        error: err.message,
        events: this.eventLogger.getEvents(publicationId)
      };
    }
  }

  /**
   * 7. UNPUBLISH
   */
  public unpublish(publicationId: string, reason: string, actor: string = 'Editorial Lead'): UnpublishResult {
    const current = this.getStatus(publicationId);
    PublicationStatusManager.assertTransition(current, 'UNPUBLISHED');
    this.statuses.set(publicationId, 'UNPUBLISHED');

    const pkg = this.packages.get(publicationId)!;
    this.publishedSlugs.delete(pkg.slug);

    const event = this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_UNPUBLISHED',
      actor,
      summary: `Artikel dicabut dari publikasi. Alasan: ${reason}`,
      metadata: { reason }
    });

    return {
      success: true,
      publicationId,
      status: 'UNPUBLISHED',
      unpublishedAt: event.timestamp,
      event
    };
  }

  /**
   * 8. ARCHIVE
   */
  public archive(publicationId: string, reason: string, actor: string = 'Archive Manager'): ArchiveResult {
    const current = this.getStatus(publicationId);
    PublicationStatusManager.assertTransition(current, 'ARCHIVED');
    this.statuses.set(publicationId, 'ARCHIVED');

    const pkg = this.packages.get(publicationId)!;
    this.publishedSlugs.delete(pkg.slug);

    const event = this.eventLogger.log({
      publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_ARCHIVED',
      actor,
      summary: `Artikel diarsipkan secara permanen. Alasan: ${reason}`,
      metadata: { reason }
    });

    return {
      success: true,
      publicationId,
      status: 'ARCHIVED',
      archivedAt: event.timestamp,
      event
    };
  }

  /**
   * 9. ROLLBACK CONTRACT
   */
  public rollback(request: PublicationRollbackRequest): RollbackResult {
    const pkg = this.packages.get(request.publicationId);
    if (!pkg) {
      throw new Error(`PublicationPackage '${request.publicationId}' tidak ditemukan.`);
    }

    const versionHistory = this.versions.get(pkg.articleId) || [];
    const target = versionHistory.find((v) => v.version === request.targetPreviousVersion);

    if (!target) {
      throw new Error(
        `Target versi ${request.targetPreviousVersion} tidak ditemukan dalam riwayat artikel '${pkg.articleId}'.`
      );
    }

    const event = this.eventLogger.log({
      publicationId: request.publicationId,
      articleId: pkg.articleId,
      event: 'PUBLICATION_PUBLISHED',
      actor: request.requestedBy,
      summary: `Rollback ke versi ${request.targetPreviousVersion} berhasil dilakukan. Alasan: ${request.reason}`,
      metadata: { targetVersion: request.targetPreviousVersion, previousHash: target.contentHash }
    });

    return {
      success: true,
      publicationId: request.publicationId,
      revertedToVersion: request.targetPreviousVersion,
      newContentHash: target.contentHash,
      event
    };
  }

  /**
   * Query Helpers
   */
  public getStatus(publicationId: string): PublicationStatus {
    const status = this.statuses.get(publicationId);
    if (!status) {
      throw new Error(`Status publikasi untuk '${publicationId}' tidak ditemukan.`);
    }
    return status;
  }

  public getPackage(publicationId: string): PublicationPackage | undefined {
    return this.packages.get(publicationId);
  }

  public getManifest(publicationId: string): PublicationManifest | undefined {
    return this.manifests.get(publicationId);
  }

  public getArticleVersions(articleId: string): ArticlePublicationVersion[] {
    return [...(this.versions.get(articleId) || [])];
  }

  public listPublicArticles(): PublicationPackage[] {
    const result: PublicationPackage[] = [];
    for (const [id, pkg] of this.packages.entries()) {
      if (this.statuses.get(id) === 'PUBLISHED') {
        result.push(pkg);
      }
    }
    return result;
  }

  private recordPublicationVersion(
    pkg: PublicationPackage,
    contentHash: string,
    status: PublicationStatus
  ): void {
    const list = this.versions.get(pkg.articleId) || [];
    const newVersionNumber = list.length + 1;

    list.push({
      version: newVersionNumber,
      articleId: pkg.articleId,
      slug: pkg.slug,
      contentHash,
      packageId: pkg.id,
      createdAt: new Date().toISOString(),
      publicationStatus: status,
      changelog: newVersionNumber === 1 ? 'Publikasi Awal' : 'Pembaruan Artikel'
    });

    this.versions.set(pkg.articleId, list);
  }
}
