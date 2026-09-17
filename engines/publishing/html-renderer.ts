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

export interface HtmlRenderOptions {
  siteUrl?: string;
  googleSiteVerification?: string;
  gaMeasurementId?: string;
}

export class PublicationHtmlRenderer {
  /**
   * Render tag verifikasi Google Search Console dan Google Analytics 4 jika tersedia
   */
  public static renderAnalyticsAndVerification(options?: HtmlRenderOptions): string {
    if (!options) return '';
    const tags: string[] = [];

    if (options.googleSiteVerification) {
      tags.push(`  <meta name="google-site-verification" content="${this.sanitizeHtml(options.googleSiteVerification)}" />`);
    }

    if (options.gaMeasurementId && /^G-[A-Za-z0-9]+$/i.test(options.gaMeasurementId)) {
      const sanitizedId = this.sanitizeHtml(options.gaMeasurementId.toUpperCase());
      tags.push(`  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${sanitizedId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${sanitizedId}');
  </script>`);
    }

    return tags.length > 0 ? `${tags.join('\n')}\n` : '';
  }

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
   * Konversi inline markdown (bold, italic, inline code) menjadi elemen HTML semantis
   */
  public static renderInlineMarkdown(content: string): string {
    if (!content) return '';
    const sanitized = this.sanitizeHtml(content);
    return sanitized
      // Bold: **text**
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text* (dijalankan 2 pass untuk menangani token berdampingan e.g. (*a*) (*b*))
      .replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/g, '$1<em>$2</em>$3')
      .replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/g, '$1<em>$2</em>$3')
      // Inline code: `text`
      .replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  }

  /**
   * Normalisasi path aset lokal agar kompatibel dengan reverse proxy /blog
   */
  public static normalizeAssetUrl(url: string, siteUrl: string = 'https://nexamos.cloud'): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/blog/')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `/blog${url}`;
    }
    return `/blog/${url}`;
  }

  /**
   * Mengubah aset URL menjadi absolut untuk meta tag OG / Twitter
   */
  public static toAbsoluteAssetUrl(url: string, siteUrl: string = 'https://nexamos.cloud'): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const normalized = this.normalizeAssetUrl(url, siteUrl);
    const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
    return `${cleanSiteUrl}${normalized}`;
  }

  /**
   * Ekstraksi naskah artikel dwibahasa (EN & ID) dengan fallback aman
   */
  public static getBilingualContent(pkg: PublicationPackage): {
    en: { headline: string; dek: string; sections: Array<{ id: string; heading: string; content: string; order: number; purpose: string }> };
    id: { headline: string; dek: string; sections: Array<{ id: string; heading: string; content: string; order: number; purpose: string }> };
    hasTranslations: boolean;
  } {
    const hasTranslations = Boolean(pkg.translations && (pkg.translations.en || pkg.translations.id));

    // Base fallback dari properti utama paket
    const baseSections = (pkg.articleContent?.sections || []).map((s, idx) => ({
      id: s.id || `sec-${idx + 1}`,
      heading: s.heading ?? '',
      content: s.content ?? '',
      order: s.order ?? idx + 1,
      purpose: s.purpose ?? 'ANALYSIS'
    }));

    const baseHeadline = pkg.articleContent?.headline || pkg.title || '';
    const baseDek = pkg.articleContent?.dek ?? pkg.description ?? '';

    // English content (prioritas: translations.en -> pkg jika defaultLanguage !== 'id')
    let enHeadline = baseHeadline;
    let enDek = baseDek;
    let enSections = baseSections;

    if (pkg.translations?.en) {
      enHeadline = pkg.translations.en.headline || pkg.translations.en.title || enHeadline;
      enDek = pkg.translations.en.dek ?? pkg.translations.en.description ?? enDek;
      if (pkg.translations.en.sections && pkg.translations.en.sections.length > 0) {
        enSections = pkg.translations.en.sections.map((s, idx) => ({
          id: s.id || `sec-${idx + 1}`,
          heading: s.heading ?? '',
          content: s.content ?? '',
          order: s.order ?? idx + 1,
          purpose: s.purpose ?? 'ANALYSIS'
        }));
      }
    }

    // Indonesian content (prioritas: translations.id -> base)
    let idHeadline = baseHeadline;
    let idDek = baseDek;
    let idSections = baseSections;

    if (pkg.translations?.id) {
      idHeadline = pkg.translations.id.headline || pkg.translations.id.title || idHeadline;
      idDek = pkg.translations.id.dek ?? pkg.translations.id.description ?? idDek;
      if (pkg.translations.id.sections && pkg.translations.id.sections.length > 0) {
        idSections = pkg.translations.id.sections.map((s, idx) => ({
          id: s.id || `sec-${idx + 1}`,
          heading: s.heading ?? '',
          content: s.content ?? '',
          order: s.order ?? idx + 1,
          purpose: s.purpose ?? 'ANALYSIS'
        }));
      }
    }

    return {
      en: { headline: enHeadline, dek: enDek, sections: enSections },
      id: { headline: idHeadline, dek: idDek, sections: idSections },
      hasTranslations
    };
  }

  /**
   * Render Halaman Penuh Artikel /blog/[slug]
   */
  public static renderArticlePage(pkg: PublicationPackage, options?: HtmlRenderOptions): string {
    const { en, id, hasTranslations } = this.getBilingualContent(pkg);
    const sanitizedHeadlineEn = this.sanitizeHtml(en.headline);
    const sanitizedDekEn = en.dek ? this.sanitizeHtml(en.dek) : '';
    const sanitizedHeadlineId = this.sanitizeHtml(id.headline);
    const sanitizedDekId = id.dek ? this.sanitizeHtml(id.dek) : '';

    const authorName = this.sanitizeHtml(pkg.author.name);
    const authorRole = pkg.author.role ? this.sanitizeHtml(pkg.author.role) : '';

    const renderSections = (sections: typeof en.sections) => {
      return sections
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const headingHtml = s.heading ? `<h2>${this.renderInlineMarkdown(s.heading)}</h2>` : '';
          const bodyParagraphs = s.content
            .split('\n\n')
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((p) => `<p>${this.renderInlineMarkdown(p)}</p>`)
            .join('\n');

          return `
      <section id="${s.id}" class="article-section" data-purpose="${s.purpose}">
        ${headingHtml}
        ${bodyParagraphs}
      </section>`;
        })
        .join('\n');
    };

    const renderedSectionsEn = renderSections(en.sections);
    const renderedSectionsId = renderSections(id.sections);

    // Render Hero Image jika tersedia
    let heroImageHtml = '';
    if (pkg.heroImage) {
      const heroUrl = this.normalizeAssetUrl(pkg.heroImage.url);
      const captionHtml = pkg.heroImage.caption
        ? `<figcaption>${this.sanitizeHtml(pkg.heroImage.caption)}</figcaption>`
        : '';
      heroImageHtml = `
    <figure class="article-hero-image">
      <img src="${heroUrl}" alt="${this.sanitizeHtml(pkg.heroImage.alt)}" width="${pkg.heroImage.width}" height="${pkg.heroImage.height}" loading="eager" fetchpriority="high" />
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
      <h3 data-i18n="citations_heading">Authoritative References &amp; Sources</h3>
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
      <h3 data-i18n="related_heading">Further Exploration</h3>
      <ul>
        ${linkItems}
      </ul>
    </nav>`;
    }

    // JSON-LD Structured Data
    const jsonLdScript = JSON.stringify(pkg.structuredData, null, 2);

    const formattedDate = pkg.publishedAt
      ? new Date(pkg.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${this.renderAnalyticsAndVerification(options)}  <title>${sanitizedHeadlineEn} | NexaMOS</title>
  <meta name="description" content="${sanitizedDekEn || this.sanitizeHtml(pkg.description)}" />
  <link rel="canonical" href="${pkg.canonicalUrl}" />
  <link rel="icon" type="image/png" href="/blog/brand/favicon.png" />
  <link rel="apple-touch-icon" href="/blog/brand/favicon.png" />
  <link rel="stylesheet" href="/blog/style.css" />
  <meta name="robots" content="${pkg.robots.index ? 'index' : 'noindex'}, ${pkg.robots.follow ? 'follow' : 'nofollow'}, max-image-preview:large, max-snippet:-1" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${sanitizedHeadlineEn}" />
  <meta property="og:description" content="${sanitizedDekEn || this.sanitizeHtml(pkg.description)}" />
  <meta property="og:url" content="${pkg.canonicalUrl}" />
  <meta property="og:type" content="article" />
  ${pkg.heroImage ? `<meta property="og:image" content="${this.toAbsoluteAssetUrl(pkg.heroImage.url)}" />` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="${pkg.heroImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${sanitizedHeadlineEn}" />
  <meta name="twitter:description" content="${sanitizedDekEn || this.sanitizeHtml(pkg.description)}" />
  ${pkg.heroImage ? `<meta name="twitter:image" content="${this.toAbsoluteAssetUrl(pkg.heroImage.url)}" />` : ''}

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
${jsonLdScript}
  </script>
</head>
<body class="nexamos-article-view">
${this.renderSiteNav()}

  <main>
    <article class="primary-article" itemscope itemtype="https://schema.org/BlogPosting">
      <header class="article-header">
        <div class="article-meta-badge">
          <span class="territory-tag">${pkg.territory}</span>
          <span class="article-type-tag">${pkg.articleType}</span>
        </div>
        <div class="article-lang-block" data-lang="en">
          <h1 itemprop="headline">${sanitizedHeadlineEn}</h1>
          ${sanitizedDekEn ? `<p class="article-dek" itemprop="description">${sanitizedDekEn}</p>` : ''}
        </div>
        ${hasTranslations ? `
        <div class="article-lang-block" data-lang="id" style="display:none;">
          <h1 itemprop="headline">${sanitizedHeadlineId}</h1>
          ${sanitizedDekId ? `<p class="article-dek">${sanitizedDekId}</p>` : ''}
        </div>` : ''}
        <div class="article-byline">
          <span class="author-name" itemprop="author">${authorName}</span>
          ${authorRole ? `<span class="author-role">${authorRole}</span>` : ''}
          ${pkg.publishedAt ? `<time itemprop="datePublished" datetime="${pkg.publishedAt}" data-pubdate="${pkg.publishedAt}">${formattedDate}</time>` : ''}
        </div>
      </header>

      ${heroImageHtml}

      <div class="article-body" itemprop="articleBody">
        <div class="article-lang-block" data-lang="en">
          ${renderedSectionsEn}
        </div>
        ${hasTranslations ? `
        <div class="article-lang-block" data-lang="id" style="display:none;">
          ${renderedSectionsId}
        </div>` : ''}
      </div>

      ${citationsHtml}
      ${relatedHtml}
    </article>
  </main>

  <footer class="site-footer">
    <p data-i18n="footer_copy">&copy; ${new Date().getFullYear()} NexaMOS. All rights reserved.</p>
  </footer>
${this.renderI18nScript()}
</body>
</html>`;
  }

  /**
   * Render Halaman Indeks Blog /blog
   */
  public static renderBlogIndexPage(
    publishedArticles: PublicationPackage[],
    siteUrlOrOptions: string | HtmlRenderOptions = 'https://nexamos.cloud'
  ): string {
    const opts: HtmlRenderOptions = typeof siteUrlOrOptions === 'string'
      ? { siteUrl: siteUrlOrOptions }
      : (siteUrlOrOptions || {});
    const cleanSiteUrl = (opts.siteUrl || 'https://nexamos.cloud').replace(/\/+$/, '');

    // Urutkan artikel terbit berdasarkan publishedAt DESC
    const sortedArticles = [...publishedArticles].sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });

    const articleCards = sortedArticles
      .map((item) => {
        const { en, id, hasTranslations } = this.getBilingualContent(item);
        const titleEn = this.sanitizeHtml(en.headline);
        const excerptEn = this.sanitizeHtml(en.dek);
        const titleId = this.sanitizeHtml(id.headline);
        const excerptId = this.sanitizeHtml(id.dek);

        const dateStr = item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        const heroUrl = item.heroImage ? this.normalizeAssetUrl(item.heroImage.url, cleanSiteUrl) : '';
        const heroThumb = heroUrl
          ? `<img src="${heroUrl}" alt="${this.sanitizeHtml(item.heroImage!.alt)}" width="400" height="225" loading="lazy" />`
          : '';

        return `
      <article class="blog-card">
        <a href="${item.canonicalPath || item.publicCanonicalPath || `/blog/${item.slug}`}" class="card-link">
          ${heroThumb}
          <div class="card-content">
            <div class="card-meta">
              <span class="territory">${item.territory}</span>
              <time datetime="${item.publishedAt || ''}" data-pubdate="${item.publishedAt || ''}">${dateStr}</time>
            </div>
            <div class="card-lang-block" data-lang="en">
              <h2>${titleEn}</h2>
              <p>${excerptEn}</p>
            </div>
            ${hasTranslations ? `
            <div class="card-lang-block" data-lang="id" style="display:none;">
              <h2>${titleId}</h2>
              <p>${excerptId}</p>
            </div>` : ''}
            <span class="read-more" data-i18n="read_more">Read Full Article &rarr;</span>
          </div>
        </a>
      </article>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${this.renderAnalyticsAndVerification(opts)}  <title>Blog Otoritas & Riset Rekayasa Informasi | NexaMOS</title>
  <meta name="description" content="Kumpulan pemikiran strategis, bukti riset primer, dan panduan taktis arsitektur informasi NexaMOS di era pencarian generatif." />
  <link rel="canonical" href="${cleanSiteUrl}/blog" />
  <link rel="icon" type="image/png" href="/blog/brand/favicon.png" />
  <link rel="apple-touch-icon" href="/blog/brand/favicon.png" />
  <link rel="stylesheet" href="/blog/style.css" />
  <meta name="robots" content="index, follow" />
</head>
<body class="nexamos-blog-index">
${this.renderSiteNav()}

  <main>
    <section class="blog-hero">
      <h1>NexaMOS Knowledge & Engineering Journal</h1>
      <p data-i18n="hero_sub">Authority publication, primary data insights, and sovereign information architecture.</p>
    </section>

    <section class="article-grid">
      ${articleCards.length > 0 ? articleCards : '<p class="no-articles" data-i18n="no_articles">No articles published yet.</p>'}
    </section>
  </main>

  <footer class="site-footer">
    <p data-i18n="footer_copy">&copy; ${new Date().getFullYear()} NexaMOS. All rights reserved.</p>
  </footer>
${this.renderI18nScript()}
</body>
</html>`;
  }

  /**
   * Render Navigation Header Bersama dengan Toggle Switcher Bahasa
   */
  public static renderSiteNav(): string {
    return `  <header class="site-nav">
    <a href="/" class="brand-logo" aria-label="NexaMOS">
      <img src="/blog/brand/logoNexa.png" alt="NexaMOS" class="brand-logo-img" width="133" height="50" />
    </a>
    <nav>
      <a href="/" data-i18n="nav_home">Home</a>
      <a href="/blog" class="active" data-i18n="nav_blog">Authority Blog</a>
      <div class="lang-switch-wrap" role="group" aria-label="Pilih Bahasa / Language Selection">
        <button type="button" class="lang-btn" data-lang="id" onclick="setBlogLanguage('id')">
          <span class="lang-flag">🇮🇩</span> ID
        </button>
        <button type="button" class="lang-btn active" data-lang="en" onclick="setBlogLanguage('en')">
          <span class="lang-flag">🇬🇧</span> EN
        </button>
      </div>
    </nav>
  </header>`;
  }

  /**
   * Render Script i18n Ringan Sinkron dengan localStorage landing page
   */
  public static renderI18nScript(): string {
    const currentYear = new Date().getFullYear();
    return `  <script>
    (function() {
      const I18N_BLOG = {
        en: {
          nav_home: "Home",
          nav_blog: "Authority Blog",
          hero_sub: "Authority publication, primary data insights, and sovereign information architecture.",
          read_more: "Read Full Article &rarr;",
          no_articles: "No articles published yet.",
          citations_heading: "Authoritative References &amp; Sources",
          related_heading: "Further Exploration",
          footer_copy: "&copy; ${currentYear} NexaMOS. All rights reserved."
        },
        id: {
          nav_home: "Beranda",
          nav_blog: "Blog Otoritas",
          hero_sub: "Publikasi otoritas pemikiran, analisis data primer, dan arsitektur informasi mandiri.",
          read_more: "Baca Selengkapnya &rarr;",
          no_articles: "Belum ada artikel yang dipublikasikan.",
          citations_heading: "Sumber &amp; Rujukan Otoritatif",
          related_heading: "Eksplorasi Lanjutan",
          footer_copy: "&copy; ${currentYear} NexaMOS. Seluruh hak cipta dilindungi undang-undang."
        }
      };

      window.setBlogLanguage = function(lang) {
        if (lang !== 'id' && lang !== 'en') lang = 'en';
        try {
          localStorage.setItem('nexamos_lang', lang);
        } catch(e) {}
        document.documentElement.lang = lang;

        const dict = I18N_BLOG[lang] || I18N_BLOG.en;
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
          const key = el.getAttribute('data-i18n');
          if (dict[key]) el.innerHTML = dict[key];
        });

        // Toggle blok dwibahasa artikel & kartu index
        document.querySelectorAll('.article-lang-block, .card-lang-block').forEach(function(el) {
          const elLang = el.getAttribute('data-lang');
          if (elLang === lang) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });

        // Update tanggal lokal secara reaktif
        document.querySelectorAll('time[data-pubdate]').forEach(function(el) {
          const dtStr = el.getAttribute('data-pubdate');
          if (!dtStr) return;
          try {
            const d = new Date(dtStr);
            if (!isNaN(d.getTime())) {
              el.textContent = d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
          } catch(e) {}
        });

        // Update document title jika ada headline aktif
        const activeHeadline = document.querySelector('.article-lang-block[data-lang="' + lang + '"] h1');
        if (activeHeadline && activeHeadline.textContent) {
          document.title = activeHeadline.textContent.trim() + ' | NexaMOS';
        }

        document.querySelectorAll('.lang-btn').forEach(function(btn) {
          btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
      };

      let initial = 'en';
      try {
        const saved = localStorage.getItem('nexamos_lang');
        if (saved === 'id' || saved === 'en') initial = saved;
      } catch(e) {}

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setBlogLanguage(initial); });
      } else {
        setBlogLanguage(initial);
      }
    })();
  </script>`;
  }
}
