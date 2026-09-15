/**
 * NexaMOS Publication Manifest Generator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Menghasilkan manifest publikasi resmi dengan content hash yang stabil untuk:
 * - Change detection
 * - Publication integrity
 * - Future analytics attribution
 * - Rollback comparison
 */

import { computeContentHash } from '../research/ingestion/content-hasher.ts';
import type { PublicationPackage, PublicationManifest, PublicationStatus } from './publication.ts';
import { UNIFIED_DISTRIBUTION_POLICY_VERSION } from '../distribution/distribution-policy.ts';

export class PublicationManifestBuilder {
  /**
   * Menghitung hash konten stabil dari seluruh payload publikasi (judul, dek, seksi, sitasi, dan metadata)
   */
  public static computePackageHash(pkg: PublicationPackage): string {
    const payload = {
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      sections: pkg.articleContent.sections.map((s) => ({
        heading: s.heading,
        content: s.content,
        order: s.order
      })),
      author: pkg.author,
      citations: pkg.externalCitations.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url
      })),
      packageVersion: pkg.packageVersion
    };

    return computeContentHash(JSON.stringify(payload));
  }

  /**
   * Membangun manifest publikasi resmi
   */
  public static createManifest(params: {
    publicationId: string;
    pkg: PublicationPackage;
    status: PublicationStatus;
    publishedAt?: string;
    updatedAt?: string | null;
    buildId?: string | null;
    deploymentId?: string | null;
  }): PublicationManifest {
    const { publicationId, pkg, status, publishedAt, updatedAt, buildId, deploymentId } = params;
    const contentHash = this.computePackageHash(pkg);

    return {
      publicationId,
      articleId: pkg.articleId,
      slug: pkg.slug,
      canonicalUrl: pkg.canonicalUrl,
      contentHash,
      publishedAt: publishedAt || pkg.publishedAt || new Date().toISOString(),
      updatedAt: updatedAt || pkg.updatedAt || null,
      packageVersion: pkg.packageVersion,
      distributionPolicyVersion: UNIFIED_DISTRIBUTION_POLICY_VERSION,
      buildId: buildId || null,
      deploymentId: deploymentId || null,
      status
    };
  }
}
