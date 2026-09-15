/**
 * NexaMOS Static-First HTML Renderer & Sanitizer
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Menghasilkan markup HTML bersih untuk /blog (Index) dan /blog/[slug] (Article)
 * dengan prinsip:
 * 1. Static-First: Teks primer hadir di HTML tanpa membutuhkan JavaScript.
 * 2. Clean Semantic: <article>, <h1>, <h2>, <p>, <blockquote>, <figure>, <cite>.
 * 3. Security: Sanitasi tag <script> berbahaya dan sanitasi URL eksternal.
 * 4. Multi-Channel Meta: SEO, Discover max-image-preview, dan Structured Data.
 */

import type { PublicationPackage } from './publication.ts';

export class PublicationHtmlRenderer {
  /**
   * Sanitasi konten editorial dari tag skrip berbahaya atau URL javascript:
   */
  public static sanitizeHtml(content: string): string {
    if (!content) return '';
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:[^"'\s>]+/gi, '#')
      .replace(/onload\s*=\s*["'][^"']*["']/gi, '')
      .replace(/onerror\s*=\s*["'][^"']*["']/gi, '')
      .replace(/onclick\s*=\s*["'][^"']*["']/gi, '');
  }

  /**
   * Render Halaman Penuh Artikel /blog/[slug]
   */
  public static renderArticlePage(pkg: PublicationPackage): string {
    const sanitizedHeadline = this.sanitizeHtml(pkg.title);
    const sanitizedDek = pkg.articleContent.dek ? this.sanitizeHtml(pkg.articleContent.dek) : '';
    const authorName = this.sanitizeHtml(pkg.author.name);
    const authorRole = pkg.author.role ? this.sanitizeHtml(pkg.author.role) : '';

    // Render Seksi Artikel
    const renderedSections = pkg.articleContent.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        const headingHtml = s.heading ? `<h2>${this.sanitizeHtml(s.heading)}</h2>` : '';
        const bodyParagraphs = s.content
          .split('\n\n')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
          .map((p) => `<p>${this.sanitizeHtml(p)}</p>`)
          .join('\n');

        return `
    <section id="${s.id}" class="article-section" data-purpose="${s.purpose}">
      ${headingHtml}
      ${bodyParagraphs}
    </section>`;
      })
      .join('\n');

    // Render Hero Image jika tersedia
    let heroImageHtml = '';
    if (pkg.heroImage) {
      const captionHtml = pkg.heroImage.caption
        ? `<figcaption>${this.sanitizeHtml(pkg.heroImage.caption)}</figcaption>`
        : '';
      heroImageHtml = `
    <figure class="article-hero-image">
      <img src="${pkg.heroImage.url}" alt="${this.sanitizeHtml(pkg.heroImage.alt)}" width="${pkg.heroImage.width}" height="${pkg.heroImage.height}" loading="eager" fetchpriority="high" />
      ${captionHtml}
    </figure>`;
    }

    // Render Sitasi Eksternal (Hanya yang diizinkan publik)
    let citationsHtml = '';
    if (pkg.externalCitations.length > 0) {
      const citationItems = pkg.externalCitations
        .map((c) => {
          const title = this.sanitizeHtml(c.title);
          const publisher = c.publisher ? ` — <span class="publisher">${this.sanitizeHtml(c.publisher)}</span>` : '';
          const link = c.url
            ? `<a href="${c.url}" target="_blank" rel="noopener noreferrer">${title}</a>`
            : title;
          const locator = c.locator ? ` <span class="locator">(${this.sanitizeHtml(c.locator)})</span>` : '';
          return `<li id="${c.id}">${link}${publisher}${locator}</li>`;
        })
        .join('\n');

      citationsHtml = `
    <aside class="article-citations" aria-label="Referensi dan Sumber Data">
      <h3>Sumber & Rujukan Otoritatif</h3>
      <ol>
        ${citationItems}
      </ol>
    </aside>`;
    }

    // Render Tautan Internal Terkait
    let relatedHtml = '';
    if (pkg.internalLinks.length > 0) {
      const linkItems = pkg.internalLinks
        .map((l) => `<li><a href="${l.url}">${this.sanitizeHtml(l.title)}</a></li>`)
        .join('\n');
      relatedHtml = `
    <nav class="article-related-links" aria-label="Artikel Terkait">
      <h3>Eksplorasi Lanjutan</h3>
      <ul>
        ${linkItems}
      </ul>
    </nav>`;
    }

    // JSON-LD Structured Data
    const jsonLdScript = JSON.stringify(pkg.structuredData, null, 2);

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${sanitizedHeadline} | NexaMOS</title>
  <meta name="description" content="${this.sanitizeHtml(pkg.description)}" />
  <link rel="canonical" href="${pkg.canonicalUrl}" />
  <link rel="stylesheet" href="/style.css" />
  <meta name="robots" content="${pkg.robots.index ? 'index' : 'noindex'}, ${pkg.robots.follow ? 'follow' : 'nofollow'}, max-image-preview:large, max-snippet:-1" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${sanitizedHeadline}" />
  <meta property="og:description" content="${this.sanitizeHtml(pkg.description)}" />
  <meta property="og:url" content="${pkg.canonicalUrl}" />
  <meta property="og:type" content="article" />
  ${pkg.heroImage ? `<meta property="og:image" content="${pkg.heroImage.url}" />` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="${pkg.heroImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${sanitizedHeadline}" />
  <meta name="twitter:description" content="${this.sanitizeHtml(pkg.description)}" />
  ${pkg.heroImage ? `<meta name="twitter:image" content="${pkg.heroImage.url}" />` : ''}

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
${jsonLdScript}
  </script>
</head>
<body class="nexamos-article-view">
  <header class="site-nav">
    <a href="/" class="brand-logo">NexaMOS</a>
    <nav>
      <a href="/">Beranda</a>
      <a href="/blog" class="active">Blog Otoritas</a>
    </nav>
  </header>

  <main>
    <article class="primary-article" itemscope itemtype="https://schema.org/BlogPosting">
      <header class="article-header">
        <div class="article-meta-badge">
          <span class="territory-tag">${pkg.territory}</span>
          <span class="article-type-tag">${pkg.articleType}</span>
        </div>
        <h1 itemprop="headline">${sanitizedHeadline}</h1>
        ${sanitizedDek ? `<p class="article-dek" itemprop="description">${sanitizedDek}</p>` : ''}
        <div class="article-byline">
          <span class="author-name" itemprop="author">${authorName}</span>
          ${authorRole ? `<span class="author-role">${authorRole}</span>` : ''}
          ${pkg.publishedAt ? `<time itemprop="datePublished" datetime="${pkg.publishedAt}">${new Date(pkg.publishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</time>` : ''}
        </div>
      </header>

      ${heroImageHtml}

      <div class="article-body" itemprop="articleBody">
        ${renderedSections}
      </div>

      ${citationsHtml}
      ${relatedHtml}
    </article>
  </main>

  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} NexaMOS. Seluruh hak cipta dilindungi undang-undang.</p>
  </footer>
</body>
</html>`;
  }

  /**
   * Render Halaman Indeks Blog /blog
   */
  public static renderBlogIndexPage(
    publishedArticles: PublicationPackage[],
    siteUrl: string = 'https://nexamos.cloud'
  ): string {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');

    // Urutkan artikel terbit berdasarkan publishedAt DESC
    const sortedArticles = [...publishedArticles].sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });

    const articleCards = sortedArticles
      .map((item) => {
        const title = this.sanitizeHtml(item.title);
        const excerpt = this.sanitizeHtml(item.description);
        const dateStr = item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        const heroThumb = item.heroImage
          ? `<img src="${item.heroImage.url}" alt="${this.sanitizeHtml(item.heroImage.alt)}" width="400" height="225" loading="lazy" />`
          : '';

        return `
      <article class="blog-card">
        <a href="${item.internalRoute || `/${item.slug}`}" class="card-link">
          ${heroThumb}
          <div class="card-content">
            <div class="card-meta">
              <span class="territory">${item.territory}</span>
              <time datetime="${item.publishedAt || ''}">${dateStr}</time>
            </div>
            <h2>${title}</h2>
            <p>${excerpt}</p>
            <span class="read-more">Baca Selengkapnya &rarr;</span>
          </div>
        </a>
      </article>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Blog Otoritas & Riset Rekayasa Informasi | NexaMOS</title>
  <meta name="description" content="Kumpulan pemikiran strategis, bukti riset primer, dan panduan taktis arsitektur informasi NexaMOS di era pencarian generatif." />
  <link rel="canonical" href="${cleanSiteUrl}/blog" />
  <link rel="stylesheet" href="/style.css" />
  <meta name="robots" content="index, follow" />
</head>
<body class="nexamos-blog-index">
  <header class="site-nav">
    <a href="/" class="brand-logo">NexaMOS</a>
    <nav>
      <a href="/">Beranda</a>
      <a href="/blog" class="active">Blog Otoritas</a>
    </nav>
  </header>

  <main>
    <section class="blog-hero">
      <h1>NexaMOS Knowledge & Engineering Journal</h1>
      <p>Publikasi otoritas pemikiran, analisis data primer, dan arsitektur informasi mandiri.</p>
    </section>

    <section class="article-grid">
      ${articleCards.length > 0 ? articleCards : '<p class="no-articles">Belum ada artikel yang dipublikasikan.</p>'}
    </section>
  </main>

  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} NexaMOS. Seluruh hak cipta dilindungi undang-undang.</p>
  </footer>
</body>
</html>`;
  }
}
