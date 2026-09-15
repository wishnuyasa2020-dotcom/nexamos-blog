/**
 * NexaMOS Publication Package Builder
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Merangkum dan mengonversi PublicationCandidate menjadi paket siap rilis.
 */

import type { PublicationCandidate } from '../distribution/distribution-readiness.ts';
import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';
import type {
  PublicationPackage,
  PublicationHeroImage,
  PublicationStructuredData,
  RenderedExternalCitation,
  ResolvedInternalLink,
  PublicationRobotsConfig,
  PublicationSitemapEntry
} from './publication.ts';

export const DEFAULT_PUBLIC_SITE_URL = 'https://nexamos.cloud';
export const DEFAULT_PUBLIC_BLOG_BASE_PATH = '/blog';

export interface BuildPackageOptions {
  siteUrl?: string;
  blogBasePath?: string; // Default: '/blog'
  heroImage?: PublicationHeroImage | null;
  internalLinks?: ResolvedInternalLink[];
  packageVersion?: string;
  isSyntheticTestData?: boolean;
  fixtureOnly?: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

export class PublicationPackageBuilder {
  /**
   * Membangun PublicationPackage dari PublicationCandidate dan entitas pendukung kanonikal
   */
  public static build(
    candidate: PublicationCandidate,
    draft: ArticleDraft,
    topic: Topic,
    seoMeta: ArticleSEOMetadata,
    brief?: ResearchBrief | null,
    options: BuildPackageOptions = {}
  ): PublicationPackage {
    const siteUrl = (options.siteUrl || DEFAULT_PUBLIC_SITE_URL).replace(/\/$/, '');
    const blogBasePath = (options.blogBasePath || DEFAULT_PUBLIC_BLOG_BASE_PATH).replace(/\/$/, '');
    const slug = candidate.slug.toLowerCase().trim();

    // Membedakan Route Internal Blog Application dan Public Canonical Path
    const internalRoute = `/${slug}`;
    const publicCanonicalPath = `${blogBasePath}/${slug}`;
    const canonicalPath = publicCanonicalPath; // Alias kompatibilitas
    const canonicalUrl = `${siteUrl}${publicCanonicalPath}`;

    const now = new Date().toISOString();
    const packageId = `pkg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // Ekstrak Sitasi Eksternal dari references atau brief tanpa mengekspos ID rahasia internal
    const externalCitations: RenderedExternalCitation[] = [];
    if (Array.isArray((draft as any).references)) {
      for (const [idx, ref] of (draft as any).references.entries()) {
        externalCitations.push({
          id: `cit-${idx + 1}`,
          title: ref.title || 'Rujukan Dokumentasi Otoritatif',
          url: ref.url,
          publisher: ref.publisher || 'Penerbit Primer',
          publicationDate: ref.publicationDate,
          locator: ref.locator,
          isPubliclyAccessible: Boolean(ref.url)
        });
      }
    } else if (brief && Array.isArray(brief.sourceIndex)) {
      for (const [idx, src] of brief.sourceIndex.entries()) {
        if (src.publicationAllowed !== false) {
          externalCitations.push({
            id: `cit-${idx + 1}`,
            title: src.title,
            url: src.canonicalUrl || src.url || undefined,
            publisher: src.publisher,
            publicationDate: src.publishedDate,
            isPubliclyAccessible: Boolean(src.canonicalUrl || src.url)
          });
        }
      }
    }

    // Bangun Structured Data Schema.org
    const structuredData: PublicationStructuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': `${canonicalUrl}#article`,
          headline: candidate.title,
          description: seoMeta.description || draft.dek || '',
          mainEntityOfPage: canonicalUrl,
          datePublished: options.publishedAt || seoMeta.publishedAt || now,
          dateModified: options.updatedAt || seoMeta.updatedAt || options.publishedAt || now,
          author: {
            '@type': 'Person',
            name: seoMeta.author?.name || 'NexaMOS Editorial Board',
            jobTitle: seoMeta.author?.role || 'Author'
          },
          publisher: {
            '@type': 'Organization',
            name: seoMeta.publisher?.name || 'NexaMOS Editorial Board',
            logo: {
              '@type': 'ImageObject',
              url: seoMeta.publisher?.logoUrl || `${siteUrl}/brand/logo.png`
            }
          },
          image: options.heroImage ? [options.heroImage.url] : []
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: siteUrl
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${siteUrl}/blog`
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: candidate.title,
              item: canonicalUrl
            }
          ]
        }
      ]
    };

    // Bangun Konfigurasi Robots
    const robots: PublicationRobotsConfig = {
      index: seoMeta.robots?.index !== false,
      follow: seoMeta.robots?.follow !== false,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1
    };

    // Bangun Sitemap Entry
    const sitemapEntry: PublicationSitemapEntry = {
      loc: canonicalUrl,
      lastmod: options.updatedAt || options.publishedAt || now,
      changefreq: 'weekly',
      priority: 0.8
    };

    return {
      id: packageId,
      candidateId: candidate.candidateId,
      articleId: candidate.articleId,
      slug,
      internalRoute,
      publicCanonicalPath,
      canonicalPath,
      canonicalUrl,
      title: candidate.title,
      description: seoMeta.description || draft.dek || '',
      territory: draft.territory,
      articleType: draft.articleType,
      editorialRole: draft.editorialRole,
      articleContent: {
        headline: draft.title || candidate.title,
        dek: draft.dek,
        sections: draft.sections.map((s) => ({
          id: s.id,
          heading: s.heading ?? '',
          content: s.content,
          order: s.order,
          purpose: s.purpose
        })),
        plainTextSummary: draft.sections.map((s) => s.content).join(' ')
      },
      author: {
        name: seoMeta.author?.name || 'NexaMOS Editorial Board',
        role: seoMeta.author?.role || 'Staff Writer',
        avatarUrl: `${siteUrl}/authors/default.png`
      },
      publishedAt: options.publishedAt || seoMeta.publishedAt || null,
      updatedAt: options.updatedAt || seoMeta.updatedAt || null,
      seoMetadata: {
        metaTitle: seoMeta.title || candidate.title,
        metaDescription: seoMeta.description || draft.dek || '',
        openGraph: {
          'og:title': candidate.title,
          'og:description': seoMeta.description || draft.dek || '',
          'og:url': canonicalUrl,
          'og:type': 'article'
        }
      },
      discoverMetadata: {
        hasLargeImagePreview: Boolean(options.heroImage && options.heroImage.width >= 1200),
        interestFit: topic.intent?.primary || undefined
      },
      aiVisibilityMetadata: {
        retrievability: 'HIGH',
        answerability: 'STRONG',
        claimTraceability: 'FULL'
      },
      heroImage: options.heroImage || null,
      visualAssets: options.heroImage
        ? [
            {
              url: options.heroImage.url,
              width: options.heroImage.width,
              height: options.heroImage.height,
              aspectRatio: options.heroImage.aspectRatio || '16:9',
              alt: options.heroImage.alt,
              caption: options.heroImage.caption
            }
          ]
        : [],
      structuredData,
      internalLinks: options.internalLinks || [],
      externalCitations,
      robots,
      sitemapEntry,
      isSyntheticTestData: options.isSyntheticTestData || false,
      fixtureOnly: options.fixtureOnly || false,
      generatedAt: now,
      packageVersion: options.packageVersion || 'v1.0.0'
    };
  }
}
