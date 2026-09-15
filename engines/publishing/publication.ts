/**
 * NexaMOS Publishing & Production Workflow - Domain Models & Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Hard Principles:
 * Editorial Status ≠ Distribution Status ≠ Publication Status
 * Static-First Rendering: Primary article content exists in generated HTML.
 * Provider-Aware but Deployment-Safe.
 */

import type { Territory } from '../ideation/domain/territory.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';
import type { PublicationCandidate, DistributionIssue, WarningAcknowledgment } from '../distribution/distribution-readiness.ts';
import type { DiscoverVisualAsset } from '../discover-validator/discover-validation.ts';

/**
 * Status Publikasi Kanonikal
 */
export type PublicationStatus =
  | 'CANDIDATE'
  | 'PACKAGING'
  | 'PREFLIGHT_FAILED'
  | 'READY_FOR_RELEASE'
  | 'SCHEDULED'
  | 'RELEASE_REQUESTED'
  | 'PUBLISHED'
  | 'PUBLISH_FAILED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';

export const PUBLICATION_STATUSES: readonly PublicationStatus[] = [
  'CANDIDATE',
  'PACKAGING',
  'PREFLIGHT_FAILED',
  'READY_FOR_RELEASE',
  'SCHEDULED',
  'RELEASE_REQUESTED',
  'PUBLISHED',
  'PUBLISH_FAILED',
  'UNPUBLISHED',
  'ARCHIVED'
] as const;

/**
 * Metadata Penulis Artikel
 */
export interface PublicationAuthor {
  name: string;
  role?: string;
  avatarUrl?: string;
  bio?: string;
}

/**
 * Hero Image Metadata
 */
export interface PublicationHeroImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  aspectRatio?: string; // '16:9', '4:3', etc.
}

/**
 * Tautan Internal yang Diresolusi
 */
export interface ResolvedInternalLink {
  slug: string;
  title: string;
  url: string;
  relationType?: 'PARENT' | 'CHILD' | 'SIBLING' | 'RELATED';
}

/**
 * Sitasi Eksternal Ramah Pembaca (Tanpa mengekspos ID rahasia internal)
 */
export interface RenderedExternalCitation {
  id: string;
  title: string;
  publisher?: string;
  url?: string;
  publicationDate?: string;
  locator?: string;
  isPubliclyAccessible: boolean;
}

/**
 * Seksi Artikel yang Diformat untuk Publikasi
 */
export interface PublicationArticleSection {
  id: string;
  heading: string;
  content: string;
  order: number;
  purpose: string;
}

/**
 * Konten Artikel Terstruktur Lengkap
 */
export interface PublicationArticleContent {
  headline: string;
  dek?: string | null;
  sections: PublicationArticleSection[];
  renderedHtml?: string;
  plainTextSummary?: string;
}

/**
 * Sitemap Entry Contract
 */
export interface PublicationSitemapEntry {
  loc: string; // URL Kanonikal
  lastmod: string; // ISO 8601
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
}

/**
 * Robots Configuration
 */
export interface PublicationRobotsConfig {
  index: boolean;
  follow: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

/**
 * Structured Data (Schema.org JSON-LD)
 */
export interface PublicationStructuredData {
  '@context': 'https://schema.org';
  '@graph': Array<Record<string, any>>;
}

/**
 * Publication Package
 * Paket naskah dan metadata siap terbit yang dibangun dari PublicationCandidate
 */
export interface PublicationPackage {
  id: string;
  candidateId: string;
  articleId: string;

  slug: string;
  internalRoute: string;        // Route internal di deployment Blog: /[slug]
  publicCanonicalPath: string;  // Path publik kanonikal di domain utama: /blog/[slug]
  canonicalPath: string;        // Alias kompatibilitas mundur ke publicCanonicalPath
  canonicalUrl: string;         // Full public canonical URL: https://nexamos.cloud/blog/[slug]

  title: string;
  description: string;

  territory: Territory;
  articleType: ArticleType;
  editorialRole: EditorialRole;

  articleContent: PublicationArticleContent;

  author: PublicationAuthor;
  publishedAt?: string | null; // ISO 8601
  updatedAt?: string | null;   // ISO 8601

  seoMetadata: {
    metaTitle: string;
    metaDescription: string;
    openGraph?: Record<string, string>;
    twitterCard?: Record<string, string>;
  };

  discoverMetadata: {
    hasLargeImagePreview: boolean;
    visualReadinessScore?: number;
    interestFit?: string;
  };

  aiVisibilityMetadata: {
    retrievability: string;
    answerability: string;
    claimTraceability: string;
  };

  heroImage?: PublicationHeroImage | null;
  visualAssets: DiscoverVisualAsset[];

  structuredData: PublicationStructuredData;

  internalLinks: ResolvedInternalLink[];
  externalCitations: RenderedExternalCitation[];

  robots: PublicationRobotsConfig;
  sitemapEntry: PublicationSitemapEntry;

  // Guardrail Data Sintetis
  isSyntheticTestData?: boolean;
  fixtureOnly?: boolean;

  generatedAt: string; // ISO 8601
  packageVersion: string; // 'v1.0.0'
}

/**
 * Versi Publikasi Artikel (History tracking untuk analytics & rollback)
 */
export interface ArticlePublicationVersion {
  version: number;
  articleId: string;
  slug: string;
  contentHash: string;
  packageId: string;
  createdAt: string; // ISO 8601
  publicationStatus: PublicationStatus;
  changelog?: string;
}

/**
 * Manifest Publikasi Resmi
 */
export interface PublicationManifest {
  publicationId: string;
  articleId: string;
  slug: string;
  canonicalUrl: string;

  contentHash: string;

  publishedAt: string; // ISO 8601
  updatedAt?: string | null; // ISO 8601

  packageVersion: string;
  distributionPolicyVersion: string;

  buildId?: string | null;
  deploymentId?: string | null;

  status: PublicationStatus;
}

/**
 * Permintaan Rollback Publikasi
 */
export interface PublicationRollbackRequest {
  publicationId: string;
  targetPreviousVersion: number;
  reason: string;
  requestedBy: string;
  requestedAt: string; // ISO 8601
}
