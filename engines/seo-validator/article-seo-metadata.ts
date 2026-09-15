/**
 * NexaMOS Technical Article SEO Metadata Contract
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 */

export interface ArticleSEORobots {
  index: boolean;
  follow: boolean;
}

export interface ArticleSEOAuthor {
  name: string;
  url?: string | null;
  role?: string | null;
  credentialsVerified?: boolean;
}

export interface ArticleSEOPublisher {
  name: string;
  logoUrl?: string | null;
  url?: string | null;
}

export interface ArticleSEOImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string | null;
}

export interface ArticleSEOMetadata {
  title: string;
  description: string;
  slug: string;
  canonicalUrl?: string | null;
  robots: ArticleSEORobots;
  author?: ArticleSEOAuthor | null;
  publisher?: ArticleSEOPublisher | null;
  publishedAt?: string | null; // ISO 8601
  updatedAt?: string | null;   // ISO 8601
  primaryImage?: ArticleSEOImage | null;
  additionalImages?: ArticleSEOImage[];
  structuredData?: Record<string, any>[];
  publicationStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
