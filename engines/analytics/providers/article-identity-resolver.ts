/**
 * NexaMOS Article Identity Resolver
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 13).
 * Hard Principle:
 * - Provider page URL → Canonical URL → PublicationManifest → articleId → topicId.
 * - Jangan mengandalkan slug saja sebagai immutable identity.
 */

import type { PublicationManifest } from '../../publishing/publication.ts';

export interface ResolvedArticleIdentity {
  articleId: string;
  topicId?: string;
  publicationId?: string;
  slug: string;
  canonicalUrl: string;
}

export class ArticleIdentityResolver {
  private manifestByCanonicalUrl: Map<string, PublicationManifest> = new Map();
  private manifestByArticleId: Map<string, PublicationManifest> = new Map();
  private topicIdByArticleId: Map<string, string> = new Map();

  /**
   * Menormalisasi URL provider menjadi path kanonikal yang bersih
   */
  public normalizeUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
      // Jika merupakan URL absolut
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const parsed = new URL(rawUrl);
        let path = parsed.pathname;
        if (path.endsWith('/') && path.length > 1) {
          path = path.slice(0, -1);
        }
        return `https://${parsed.host}${path}`;
      }
      
      // Jika path relatif (e.g. /blog/my-slug)
      let cleaned = rawUrl.trim();
      if (!cleaned.startsWith('/')) {
        cleaned = `/${cleaned}`;
      }
      if (cleaned.endsWith('/') && cleaned.length > 1) {
        cleaned = cleaned.slice(0, -1);
      }
      return `https://nexamos.cloud${cleaned}`;
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Mengekstrak slug dari URL / path
   */
  public extractSlugFromUrl(rawUrl: string): string {
    const normalized = this.normalizeUrl(rawUrl);
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
  }

  /**
   * Mendaftarkan manifest publikasi untuk identifikasi artikel
   */
  public registerManifest(manifest: PublicationManifest, topicId?: string): void {
    const normalizedCanonical = this.normalizeUrl(manifest.canonicalUrl);
    this.manifestByCanonicalUrl.set(normalizedCanonical, manifest);
    this.manifestByArticleId.set(manifest.articleId, manifest);
    if (topicId) {
      this.topicIdByArticleId.set(manifest.articleId, topicId);
    }
  }

  /**
   * Menghubungkan relasi articleId ke topicId
   */
  public linkArticleToTopic(articleId: string, topicId: string): void {
    this.topicIdByArticleId.set(articleId, topicId);
  }

  /**
   * Memetakan identifier halaman dari provider (URL absolut atau path) ke identitas kanonikal NexaMOS
   */
  public resolve(providerPageIdentifier: string): ResolvedArticleIdentity | null {
    if (!providerPageIdentifier) return null;

    const normalized = this.normalizeUrl(providerPageIdentifier);
    let manifest = this.manifestByCanonicalUrl.get(normalized);

    // Jika tidak langsung cocok dengan host asli, coba cari berdasarkan path-nya saja
    if (!manifest) {
      for (const [canonicalUrl, m] of this.manifestByCanonicalUrl.entries()) {
        const canonicalPath = new URL(canonicalUrl).pathname;
        const inputPath = normalized.startsWith('http') ? new URL(normalized).pathname : normalized;
        if (canonicalPath === inputPath) {
          manifest = m;
          break;
        }
      }
    }

    if (!manifest) {
      return null;
    }

    const topicId = this.topicIdByArticleId.get(manifest.articleId) || 'unknown-topic';

    return {
      articleId: manifest.articleId,
      topicId,
      publicationId: manifest.publicationId,
      slug: manifest.slug,
      canonicalUrl: manifest.canonicalUrl
    };
  }

  /**
   * Mendapatkan identitas berdasarkan articleId langsung (kebal terhadap pergantian slug)
   */
  public resolveByArticleId(articleId: string): ResolvedArticleIdentity | null {
    const manifest = this.manifestByArticleId.get(articleId);
    if (!manifest) return null;

    const topicId = this.topicIdByArticleId.get(articleId) || 'unknown-topic';
    return {
      articleId: manifest.articleId,
      topicId,
      publicationId: manifest.publicationId,
      slug: manifest.slug,
      canonicalUrl: manifest.canonicalUrl
    };
  }
}
