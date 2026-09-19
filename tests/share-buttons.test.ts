/// <reference path="./ambient.d.ts" />
/**
 * Test Suite: Social Share Buttons (WhatsApp, Instagram, Facebook, Copy Link)
 * Memverifikasi integritas tombol share pada halaman baca artikel dan kartu indeks blog
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { PublicationHtmlRenderer } from '../engines/publishing/html-renderer.ts';
import type { PublicationPackage } from '../engines/publishing/publication.ts';

function createMockArticle(slug: string = 'analisis-ai-marketing'): PublicationPackage {
  const siteUrl = 'https://nexamos.cloud';
  return {
    id: `pkg-${slug}`,
    candidateId: `cand-${slug}`,
    articleId: `art-${slug}`,
    slug,
    internalRoute: `/${slug}`,
    publicCanonicalPath: `/blog/${slug}`,
    canonicalPath: `/blog/${slug}`,
    canonicalUrl: `${siteUrl}/blog/${slug}`,
    title: 'Analisis AI Marketing Modern & Prediksi Siklus Pasar',
    description: 'Riset primer penerapan model prediktif pada retensi pelanggan.',
    territory: 'TACTICAL',
    articleType: 'CASE_STUDY',
    editorialRole: 'AUTHORITY',
    articleContent: {
      headline: 'Analisis AI Marketing Modern & Prediksi Siklus Pasar',
      dek: 'Riset primer penerapan model prediktif pada retensi pelanggan.',
      sections: [
        {
          id: 'sec-1',
          heading: 'Pengantar Analisis',
          content: 'Data primer membuktikan peningkatan efisiensi akuisisi sebesar 38%.',
          order: 1,
          purpose: 'EVIDENCE'
        }
      ]
    },
    translations: {
      en: {
        title: 'Modern AI Marketing Analysis & Market Cycle Prediction',
        description: 'Primary research on predictive model application in customer retention.',
        headline: 'Modern AI Marketing Analysis & Market Cycle Prediction',
        dek: 'Primary research on predictive model application in customer retention.',
        sections: [
          {
            id: 'sec-1',
            heading: 'Introduction to Analysis',
            content: 'Primary data demonstrates a 38% increase in acquisition efficiency.',
            order: 1,
            purpose: 'EVIDENCE'
          }
        ]
      },
      id: {
        title: 'Analisis AI Marketing Modern & Prediksi Siklus Pasar',
        description: 'Riset primer penerapan model prediktif pada retensi pelanggan.',
        headline: 'Analisis AI Marketing Modern & Prediksi Siklus Pasar',
        dek: 'Riset primer penerapan model prediktif pada retensi pelanggan.',
        sections: [
          {
            id: 'sec-1',
            heading: 'Pengantar Analisis',
            content: 'Data primer membuktikan peningkatan efisiensi akuisisi sebesar 38%.',
            order: 1,
            purpose: 'EVIDENCE'
          }
        ]
      }
    },
    author: {
      name: 'NexaMOS Intelligence Unit',
      role: 'Chief Analyst'
    },
    publishedAt: '2026-09-18T10:00:00.000Z',
    updatedAt: null,
    seoMetadata: {
      metaTitle: 'Analisis AI Marketing | NexaMOS',
      metaDescription: 'Riset primer penerapan model prediktif.',
      openGraph: {}
    },
    discoverMetadata: {
      hasLargeImagePreview: true,
      visualReadinessScore: 90
    },
    aiVisibilityMetadata: {
      retrievability: 'HIGH',
      answerability: 'HIGH',
      claimTraceability: 'HIGH'
    },
    heroImage: {
      url: '/images/hero-ai-marketing.webp',
      alt: 'Hero visual',
      width: 1200,
      height: 630
    },
    visualAssets: [],
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': []
    },
    internalLinks: [],
    externalCitations: [],
    robots: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1
    },
    sitemapEntry: {
      loc: `${siteUrl}/blog/${slug}`,
      lastmod: '2026-09-18T10:00:00.000Z',
      changefreq: 'weekly',
      priority: 0.8
    },
    isSyntheticTestData: true,
    fixtureOnly: true,
    generatedAt: '2026-09-18T10:00:00.000Z',
    packageVersion: 'v1.0.0'
  };
}

describe('Social Share Buttons & Toast Interactive Features', () => {
  test('Halaman artikel merender share bar atas dan call-to-action share bawah', () => {
    const pkg = createMockArticle('uji-fitur-share');
    const html = PublicationHtmlRenderer.renderArticlePage(pkg);

    // Share bar atas (setelah byline)
    assert.ok(html.includes('class="article-share-bar"'), 'Harus menyertakan class article-share-bar');
    // CTA share bawah (sebelum sitasi)
    assert.ok(html.includes('class="article-share-cta"'), 'Harus menyertakan class article-share-cta');

    // Keberadaan platform share
    assert.ok(html.includes('share-whatsapp'), 'Harus ada tombol share WhatsApp');
    assert.ok(html.includes('share-instagram'), 'Harus ada tombol share Instagram');
    assert.ok(html.includes('share-facebook'), 'Harus ada tombol share Facebook');
    assert.ok(html.includes('share-copy'), 'Harus ada tombol copy link');
  });

  test('URL share WhatsApp dan Facebook terformat dengan benar dan aman', () => {
    const pkg = createMockArticle('uji-format-url');
    const html = PublicationHtmlRenderer.renderArticlePage(pkg);

    // WhatsApp endpoint & parameter
    const encodedCanonical = encodeURIComponent(pkg.canonicalUrl);
    assert.ok(html.includes('https://api.whatsapp.com/send?text='), 'Harus mengarah ke api.whatsapp.com');
    assert.ok(html.includes(encodedCanonical), 'URL canonical harus ter-encode di parameter WhatsApp');

    // Facebook endpoint & parameter
    assert.ok(html.includes(`https://www.facebook.com/sharer/sharer.php?u=${encodedCanonical}`), 'Harus mengarah ke facebook.com/sharer');

    // Atribut keamanan
    assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'), 'Harus memiliki rel noopener noreferrer');
  });

  test('Tombol Instagram dan Salin Tautan memicu handler JavaScript interaktif', () => {
    const pkg = createMockArticle('uji-handler-interaktif');
    const html = PublicationHtmlRenderer.renderArticlePage(pkg);

    assert.ok(html.includes('onclick="shareToInstagram('), 'Tombol Instagram harus memiliki pemanggil onclick shareToInstagram');
    assert.ok(html.includes('onclick="copyArticleLink('), 'Tombol Copy link harus memiliki pemanggil onclick copyArticleLink');
  });

  test('Kartu artikel pada /blog menyertakan quick-share bar dengan event isolation', () => {
    const pkg1 = createMockArticle('artikel-satu');
    const pkg2 = createMockArticle('artikel-dua');
    const indexHtml = PublicationHtmlRenderer.renderBlogIndexPage([pkg1, pkg2]);

    assert.ok(indexHtml.includes('class="card-share-bar"'), 'Indeks blog harus memiliki card-share-bar pada kartu');
    assert.ok(indexHtml.includes('event.stopPropagation()'), 'Harus mengisolasi event klik agar tidak memicu link kartu');
    assert.ok(indexHtml.includes('shareToInstagram('), 'Kartu harus mendukung share ke Instagram');
    assert.ok(indexHtml.includes('copyArticleLink('), 'Kartu harus mendukung salin tautan');
  });

  test('Markup Toast Notification dan Kamus i18n dwibahasa (EN & ID) tersedia lengkap', () => {
    const pkg = createMockArticle('uji-i18n-toast');
    const html = PublicationHtmlRenderer.renderArticlePage(pkg);

    // Toast markup
    assert.ok(html.includes('id="nexamos-toast"'), 'Harus ada elemen nexamos-toast');
    assert.ok(html.includes('id="nexamos-toast-msg"'), 'Harus ada elemen pesan nexamos-toast-msg');

    // Helper functions
    assert.ok(html.includes('window.showToast = function'), 'Harus mendefinisikan window.showToast');
    assert.ok(html.includes('window.copyArticleLink = function'), 'Harus mendefinisikan window.copyArticleLink');
    assert.ok(html.includes('window.shareToInstagram = function'), 'Harus mendefinisikan window.shareToInstagram');

    // i18n keys
    assert.ok(html.includes('share_label: "Share:"'), 'Kamus EN harus memiliki share_label');
    assert.ok(html.includes('share_label: "Bagikan:"'), 'Kamus ID harus memiliki share_label');
    assert.ok(html.includes('toast_copied:'), 'Harus ada pesan toast disalin');
    assert.ok(html.includes('toast_instagram:'), 'Harus ada panduan toast Instagram');
  });

  test('Sistem badge teritorial dan article-type konsisten dengan landing page', () => {
    const pkgTactical = createMockArticle('artikel-taktikal');
    pkgTactical.territory = 'TACTICAL';
    pkgTactical.articleType = 'HOW_TO';

    const pkgStrategy = createMockArticle('artikel-strategi');
    pkgStrategy.territory = 'STRATEGY';
    pkgStrategy.articleType = 'ANALYSIS';

    const pkgIntel = createMockArticle('artikel-intelijen');
    pkgIntel.territory = 'INTELLIGENCE';
    pkgIntel.articleType = 'CASE_STUDY';

    // Test renderArticlePage
    const articleHtml = PublicationHtmlRenderer.renderArticlePage(pkgTactical);
    assert.ok(articleHtml.includes('badge-tactical'), 'Halaman artikel taktikal harus memiliki class badge-tactical');
    assert.ok(articleHtml.includes('badge-type'), 'Halaman artikel harus memiliki class badge-type');
    assert.ok(articleHtml.includes('data-territory="TACTICAL"'), 'Harus menyertakan data-territory');
    assert.ok(articleHtml.includes('data-article-type="HOW_TO"'), 'Harus menyertakan data-article-type');

    // Test renderBlogIndexPage
    const indexHtml = PublicationHtmlRenderer.renderBlogIndexPage([pkgTactical, pkgStrategy, pkgIntel]);
    assert.ok(indexHtml.includes('hero-badge-pill'), 'Halaman indeks blog harus memiliki hero-badge-pill');
    assert.ok(indexHtml.includes('hero-pulse-dot'), 'Hero badge pill harus memiliki hero-pulse-dot');
    assert.ok(indexHtml.includes('badge-tactical'), 'Kartu taktikal harus memiliki badge-tactical');
    assert.ok(indexHtml.includes('badge-strategy'), 'Kartu strategi harus memiliki badge-strategy');
    assert.ok(indexHtml.includes('badge-intelligence'), 'Kartu intelijen harus memiliki badge-intelligence');
  });

  test('Struktur navigasi header memisahkan baris bahasa (site-nav-top) dan baris utama (site-nav-main)', () => {
    const navHtml = PublicationHtmlRenderer.renderSiteNav();
    assert.ok(navHtml.includes('class="site-nav-top"'), 'Harus memiliki wrapper site-nav-top untuk toggle bahasa baris 1');
    assert.ok(navHtml.includes('class="site-nav-main"'), 'Harus memiliki wrapper site-nav-main untuk logo dan link nav baris 2');
    assert.ok(navHtml.includes('class="lang-switch-wrap"'), 'Harus memiliki tombol switch bahasa');
    assert.ok(navHtml.includes('class="brand-logo"'), 'Harus memiliki brand logo');
    assert.ok(navHtml.includes('data-i18n="nav_home"'), 'Harus memiliki link home dengan data-i18n');
    assert.ok(navHtml.includes('data-i18n="nav_blog"'), 'Harus memiliki link blog dengan data-i18n');
  });
});
