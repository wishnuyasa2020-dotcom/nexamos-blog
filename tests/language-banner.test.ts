/// <reference path="./ambient.d.ts" />
/**
 * Test Suite: Language Suggestion Banner (Bilingual ID/EN Navigation)
 * Memverifikasi integritas render banner notifikasi alih bahasa ke ID untuk landing page & halaman artikel
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
    author: {
      name: 'NexaMOS Editorial Team',
      role: 'Research & Intelligence'
    },
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

describe('Language Suggestion Banner Test Suite', () => {
  test('1. renderLanguageSuggestionBanner menghasilkan markup yang presisi', () => {
    const bannerHtml = PublicationHtmlRenderer.renderLanguageSuggestionBanner();

    assert.ok(bannerHtml.includes('id="nexamos-lang-banner"'), 'Harus menyertakan ID nexamos-lang-banner');
    assert.ok(bannerHtml.includes('class="nexamos-lang-banner"'), 'Harus menyertakan kelas nexamos-lang-banner');
    assert.ok(bannerHtml.includes('Baca Konten dalam Bahasa Indonesia'), 'Harus menyertakan teks utama bahasa Indonesia');
    assert.ok(bannerHtml.includes('Read content in Indonesian'), 'Harus menyertakan subteks bahasa Inggris');
    assert.ok(bannerHtml.includes('Ubah Bahasa'), 'Harus menyertakan tombol aksi Ubah Bahasa');
    assert.ok(bannerHtml.includes('Nanti'), 'Harus menyertakan tombol tutup Nanti');
    assert.ok(bannerHtml.includes('onclick="acceptLanguageSwitch()"'), 'Tombol Ubah Bahasa harus memicu acceptLanguageSwitch');
    assert.ok(bannerHtml.includes('onclick="dismissLanguageBanner()"'), 'Tombol Nanti harus memicu dismissLanguageBanner');
    assert.ok(bannerHtml.includes('🇮🇩'), 'Harus menyertakan bendera Indonesia');
  });

  test('2. Halaman Index / Landing Page menyertakan banner notifikasi bahasa dan logic interaktif', () => {
    const article = createMockArticle('test-article');
    const indexHtml = PublicationHtmlRenderer.renderBlogIndexPage([article]);

    assert.ok(indexHtml.includes('id="nexamos-lang-banner"'), 'Landing page harus merender nexamos-lang-banner');
    assert.ok(indexHtml.includes('Baca Konten dalam Bahasa Indonesia'), 'Landing page harus memiliki teks banner');
    assert.ok(indexHtml.includes('acceptLanguageSwitch'), 'Landing page harus memiliki fungsi script acceptLanguageSwitch');
    assert.ok(indexHtml.includes('dismissLanguageBanner'), 'Landing page harus memiliki fungsi script dismissLanguageBanner');
    assert.ok(indexHtml.includes('checkLanguageBanner'), 'Landing page harus memiliki fungsi script checkLanguageBanner');
  });

  test('3. Halaman Baca Artikel menyertakan banner notifikasi bahasa dan logic interaktif', () => {
    const article = createMockArticle('test-article');
    const articleHtml = PublicationHtmlRenderer.renderArticlePage(article);

    assert.ok(articleHtml.includes('id="nexamos-lang-banner"'), 'Halaman artikel harus merender nexamos-lang-banner');
    assert.ok(articleHtml.includes('Baca Konten dalam Bahasa Indonesia'), 'Halaman artikel harus memiliki teks banner');
    assert.ok(articleHtml.includes('acceptLanguageSwitch'), 'Halaman artikel harus memiliki fungsi script acceptLanguageSwitch');
    assert.ok(articleHtml.includes('dismissLanguageBanner'), 'Halaman artikel harus memiliki fungsi script dismissLanguageBanner');
    assert.ok(articleHtml.includes('checkLanguageBanner'), 'Halaman artikel harus memiliki fungsi script checkLanguageBanner');
  });
});
