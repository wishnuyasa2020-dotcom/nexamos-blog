/// <reference path="./ambient.d.ts" />
/**
 * Test Suite: Editorial Territory Filter & Free Search Bar
 *
 * Menguji:
 * 1. Struktur toolbar filter teritori (INTELLIGENCE, STRATEGY, TACTICAL, ALL) dan badge counter.
 * 2. Kolom pencarian bebas judul & sub-judul beserta ikon dan tombol pembersih.
 * 3. Atribut selektor kartu artikel (data-territory, data-search-text).
 * 4. Komponen empty state pencarian.
 * 5. Script logika interaktif di sisi klien (filter, search, i18n dictionary).
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import type { PublicationPackage } from '../engines/publishing/publication.ts';
import { PublicationHtmlRenderer } from '../engines/publishing/html-renderer.ts';

function createMockArticle(slug: string, territory: 'INTELLIGENCE' | 'STRATEGY' | 'TACTICAL', title: string, dek: string): PublicationPackage {
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
    title,
    description: dek,
    territory,
    articleType: 'ANALYSIS',
    editorialRole: 'AUTHORITY',
    articleContent: {
      headline: title,
      dek,
      sections: [
        {
          id: 'sec-1',
          heading: 'Pendahuluan',
          content: 'Isi pengantar artikel uji...',
          order: 1,
          purpose: 'CONTEXT'
        }
      ]
    },
    author: {
      name: 'Tim Editorial NexaMOS',
      role: 'Knowledge Engineering'
    },
    publishedAt: '2026-09-18T10:00:00.000Z',
    updatedAt: null,
    seoMetadata: {
      metaTitle: `${title} | NexaMOS`,
      metaDescription: dek
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
      url: `/blog/images/hero-${slug}.webp`,
      alt: `Hero visual for ${title}`,
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
    fixtureOnly: false,
    generatedAt: '2026-09-18T10:00:00.000Z',
    packageVersion: 'v1.0.0'
  };
}

describe('Editorial Territory Filter & Free Search Bar Test Suite', () => {
  const articles: PublicationPackage[] = [
    createMockArticle('art-intel-1', 'INTELLIGENCE', 'Competitive Intelligence Modern', 'Analisis sinyal pasar berbasis data.'),
    createMockArticle('art-intel-2', 'INTELLIGENCE', 'Sinyal Pasar & Pricing Dynamics', 'Pemantauan komputasi AI untuk dinamika harga.'),
    createMockArticle('art-strat-1', 'STRATEGY', 'Arsitektur Informasi Sovereign', 'Memilih positioning tanpa komoditisasi.'),
    createMockArticle('art-tact-1', 'TACTICAL', 'CRM Bertenaga AI', 'Otomasi alur kerja dan lifecycle prospek.')
  ];

  test('Render toolbar filter dengan 3 teritori utama editorial dan ALL beserta badge counter yang presisi', () => {
    const html = PublicationHtmlRenderer.renderBlogIndexPage(articles);

    // Filter toolbar section
    assert.ok(html.includes('class="blog-filter-section"'), 'Harus menyertakan section filter blog');
    assert.ok(html.includes('class="territory-filter-bar"'), 'Harus menyertakan territory-filter-bar');

    // Filter buttons
    assert.ok(html.includes('data-filter-territory="ALL"'), 'Harus ada tombol filter ALL');
    assert.ok(html.includes('data-filter-territory="INTELLIGENCE"'), 'Harus ada tombol filter INTELLIGENCE');
    assert.ok(html.includes('data-filter-territory="STRATEGY"'), 'Harus ada tombol filter STRATEGY');
    assert.ok(html.includes('data-filter-territory="TACTICAL"'), 'Harus ada tombol filter TACTICAL');

    // Badge counts
    assert.ok(html.includes('badge-all">4</span>'), 'Badge ALL harus berjumlah 4');
    assert.ok(html.includes('badge-intelligence">2</span>'), 'Badge INTELLIGENCE harus berjumlah 2');
    assert.ok(html.includes('badge-strategy">1</span>'), 'Badge STRATEGY harus berjumlah 1');
    assert.ok(html.includes('badge-tactical">1</span>'), 'Badge TACTICAL harus berjumlah 1');
  });

  test('Render kolom input pencarian bebas judul dan sub-judul lengkap dengan ikon dan tombol reset', () => {
    const html = PublicationHtmlRenderer.renderBlogIndexPage(articles);

    assert.ok(html.includes('class="blog-search-bar-wrap"'), 'Harus memiliki wrapper blog-search-bar-wrap');
    assert.ok(html.includes('id="article-search-input"'), 'Harus memiliki elemen input dengan id article-search-input');
    assert.ok(html.includes('data-i18n-placeholder="search_placeholder"'), 'Harus menyertakan placeholder dwibahasa');
    assert.ok(html.includes('id="search-clear-btn"'), 'Harus memiliki tombol clear search');
    assert.ok(html.includes('id="search-status-bar"'), 'Harus memiliki baris status hasil');
  });

  test('Setiap kartu artikel memiliki data-card-territory dan corpus data-search-text', () => {
    const html = PublicationHtmlRenderer.renderBlogIndexPage(articles);

    assert.ok(html.includes('data-card-territory="INTELLIGENCE"'), 'Kartu intelijen harus memiliki data-card-territory="INTELLIGENCE"');
    assert.ok(html.includes('data-card-territory="STRATEGY"'), 'Kartu strategi harus memiliki data-card-territory="STRATEGY"');
    assert.ok(html.includes('data-card-territory="TACTICAL"'), 'Kartu taktikal harus memiliki data-card-territory="TACTICAL"');
    assert.ok(html.includes('data-search-text="competitive intelligence modern'), 'Kartu harus memuat korpus teks pencarian lowercase');
  });

  test('Render empty state interaktif untuk pencarian yang tidak menghasilkan kecocokan', () => {
    const html = PublicationHtmlRenderer.renderBlogIndexPage(articles);

    assert.ok(html.includes('id="filter-empty-state"'), 'Harus menyertakan elemen filter-empty-state');
    assert.ok(html.includes('data-i18n="empty_title"'), 'Harus memiliki judul empty state ber-i18n');
    assert.ok(html.includes('data-i18n="empty_desc"'), 'Harus memiliki deskripsi empty state ber-i18n');
    assert.ok(html.includes('onclick="resetArticleFilters()"'), 'Harus memiliki pemanggil resetArticleFilters');
  });

  test('Menyertakan fungsi klien dan kamus dwibahasa (EN & ID) untuk filter dan search', () => {
    const html = PublicationHtmlRenderer.renderBlogIndexPage(articles);

    // JS Function handlers
    assert.ok(html.includes('window.setTerritoryFilter = function'), 'Harus mengekspos setTerritoryFilter');
    assert.ok(html.includes('window.handleArticleSearch = function'), 'Harus mengekspos handleArticleSearch');
    assert.ok(html.includes('window.clearArticleSearch = function'), 'Harus mengekspos clearArticleSearch');
    assert.ok(html.includes('window.resetArticleFilters = function'), 'Harus mengekspos resetArticleFilters');
    assert.ok(html.includes('window.applyArticleFilters = function'), 'Harus mengekspos applyArticleFilters');

    // i18n keys
    assert.ok(html.includes('filter_intelligence: "Intelligence"'), 'Kamus EN harus memiliki filter_intelligence');
    assert.ok(html.includes('filter_intelligence: "Intelijen"'), 'Kamus ID harus memiliki filter_intelligence');
    assert.ok(html.includes('search_placeholder: "Cari artikel'), 'Kamus ID harus memiliki search_placeholder');
    assert.ok(html.includes('search_placeholder: "Search articles'), 'Kamus EN harus memiliki search_placeholder');
    assert.ok(html.includes('empty_reset: "Reset Filter"'), 'Kamus ID harus memiliki empty_reset');
  });
});
