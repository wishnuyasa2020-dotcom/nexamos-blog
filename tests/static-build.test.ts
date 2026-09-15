/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Static Build & Local Preview - Comprehensive Test Suite
 *
 * Sourced from Production Pilot 01 Step 1–2 specifications.
 * Menguji:
 * 1. Package configuration & scripts
 * 2. Static File Exporter (Index, Articles, Sitemap, Asset copy, Manifest)
 * 3. Canonical URL integrity (https://nexamos.cloud/blog/[slug])
 * 4. Safety Hard Blocks (PRODUCTION_SYNTHETIC_DATA_BLOCKED, anti-traversal, slug collisions)
 * 5. Clean build (stale artifact removal)
 * 6. Content fidelity (body, metadata, structured data)
 * 7. HTTP Preview Server (routing, MIME types, path traversal security, cache headers)
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';

import { StaticFileExporter } from '../infrastructure/publishing/static-file-exporter.ts';
import { startPreviewServer, MIME_TYPES } from '../scripts/preview-blog.ts';
import { createDevFixturePackage, runBuild } from '../scripts/build-blog.ts';
import type { PublicationPackage } from '../engines/publishing/publication.ts';

const TEST_WORKSPACE = path.resolve(process.cwd(), 'temp_test_build_workspace');
const TEST_DIST = path.join(TEST_WORKSPACE, 'dist');

function createValidArticlePackage(slug: string = 'arsitektur-informasi-ai'): PublicationPackage {
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
    title: 'Arsitektur Informasi untuk Mesin Penjawab Generatif',
    description: 'Panduan rekayasa struktur konten agar dapat disintesis secara presisi oleh LLM.',
    territory: 'STRATEGY',
    articleType: 'ANALYSIS',
    editorialRole: 'AUTHORITY',
    articleContent: {
      headline: 'Arsitektur Informasi untuk Mesin Penjawab Generatif',
      dek: 'Panduan rekayasa struktur konten agar dapat disintesis secara presisi oleh LLM.',
      sections: [
        {
          id: 'sec-1',
          heading: 'Fondasi Grounding Epistemik',
          content: 'Konten harus memisahkan antara fakta yang diverifikasi dan opini analisis editorial.',
          order: 1,
          purpose: 'CONTEXT'
        },
        {
          id: 'sec-2',
          heading: 'Metrik Keterlacakan Sumber',
          content: 'Sistem evaluasi mengonfirmasi korelasi tinggi antara keberadaan kutipan spesifik dan akurasi AI retrieval.',
          order: 2,
          purpose: 'EVIDENCE'
        }
      ]
    },
    author: {
      name: 'NexaMOS Editorial Lab',
      role: 'Head of Information Architecture'
    },
    publishedAt: '2026-09-15T01:00:00.000Z',
    updatedAt: null,
    seoMetadata: {
      metaTitle: 'Arsitektur Informasi untuk Mesin Penjawab Generatif | NexaMOS',
      metaDescription: 'Panduan rekayasa struktur konten agar dapat disintesis secara presisi oleh LLM.'
    },
    discoverMetadata: {
      hasLargeImagePreview: true,
      visualReadinessScore: 88
    },
    aiVisibilityMetadata: {
      retrievability: 'HIGH',
      answerability: 'HIGH',
      claimTraceability: 'HIGH'
    },
    heroImage: {
      url: '/images/hero-arch.webp',
      alt: 'Diagram struktur informasi',
      width: 1200,
      height: 630
    },
    visualAssets: [],
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: 'Arsitektur Informasi untuk Mesin Penjawab Generatif',
          mainEntityOfPage: `${siteUrl}/blog/${slug}`,
          datePublished: '2026-09-15T01:00:00.000Z'
        }
      ]
    },
    internalLinks: [],
    externalCitations: [
      {
        id: 'cite-01',
        title: 'Google Search Central Documentation',
        url: 'https://developers.google.com/search',
        isPubliclyAccessible: true
      }
    ],
    robots: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1
    },
    sitemapEntry: {
      loc: `${siteUrl}/blog/${slug}`,
      lastmod: '2026-09-15T01:00:00.000Z',
      changefreq: 'weekly',
      priority: 0.8
    },
    isSyntheticTestData: false,
    fixtureOnly: false,
    generatedAt: '2026-09-15T01:00:00.000Z',
    packageVersion: 'v1.0.0'
  };
}

describe('Pilot 01: Build Tooling, Static Exporter & Local Preview', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIST, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    } catch {}
  });

  // ===========================================================================
  // 1. PACKAGE CONFIGURATION & SCRIPTS
  // ===========================================================================
  describe('1. Package Tooling & Scripts', () => {
    test('package.json tersedia dengan metadata dan scripts yang ditentukan', async () => {
      const packageJsonPath = path.resolve('package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      assert.strictEqual(pkg.name, 'nexamos-blog');
      assert.strictEqual(pkg.private, true);
      assert.strictEqual(pkg.type, 'module');

      assert.ok(pkg.scripts, 'scripts object harus ada');
      assert.ok(pkg.scripts.test.includes('node --test'), 'script test harus menggunakan node --test');
      assert.ok(pkg.scripts.build.includes('scripts/build-blog.ts'), 'script build harus mengarah ke scripts/build-blog.ts');
      assert.ok(pkg.scripts['build:fixture'].includes('--fixture'), 'script build:fixture harus menyertakan flag --fixture');
      assert.ok(pkg.scripts.preview.includes('scripts/preview-blog.ts'), 'script preview harus mengarah ke scripts/preview-blog.ts');
    });

    test('.env.example tersedia dengan variabel non-secret', async () => {
      const envPath = path.resolve('.env.example');
      const content = await fs.readFile(envPath, 'utf-8');

      assert.match(content, /PUBLIC_SITE_URL=https:\/\/nexamos\.cloud/);
      assert.match(content, /PUBLIC_BLOG_BASE_PATH=\/blog/);
      assert.match(content, /PORT=4173/);
    });
  });

  // ===========================================================================
  // 2. STATIC FILE EXPORTER
  // ===========================================================================
  describe('2. Static File Exporter', () => {
    test('Mengekspor dist/index.html, dist/[slug]/index.html, dan dist/sitemap.xml', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('arsitektur-informasi-ai');

      const result = await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      assert.strictEqual(result.articleCount, 1);
      assert.ok(result.filesWritten.includes('index.html'), 'index.html harus ditulis');
      assert.ok(result.filesWritten.includes('arsitektur-informasi-ai/index.html'), 'artikel harus ditulis');
      assert.ok(result.filesWritten.includes('sitemap.xml'), 'sitemap.xml harus ditulis');

      // Verifikasi keberadaan file fisik di disk
      const indexStat = await fs.stat(path.join(TEST_DIST, 'index.html'));
      assert.ok(indexStat.isFile());

      const articleStat = await fs.stat(path.join(TEST_DIST, 'arsitektur-informasi-ai', 'index.html'));
      assert.ok(articleStat.isFile());

      const sitemapStat = await fs.stat(path.join(TEST_DIST, 'sitemap.xml'));
      assert.ok(sitemapStat.isFile());

      // Verifikasi content hashes
      assert.strictEqual(result.contentHashes.length, 1);
      assert.strictEqual(result.contentHashes[0].slug, 'arsitektur-informasi-ai');
      assert.ok(result.contentHashes[0].hash.length > 10);
    });

    test('Canonical URL di HTML dan Sitemap selalu mengarah ke https://nexamos.cloud/blog/[slug]', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('arsitektur-informasi-ai');

      await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      // Periksa canonical di file HTML artikel
      const articleHtml = await fs.readFile(path.join(TEST_DIST, 'arsitektur-informasi-ai', 'index.html'), 'utf-8');
      assert.match(
        articleHtml,
        /<link\s+rel=["']canonical["']\s+href=["']https:\/\/nexamos\.cloud\/blog\/arsitektur-informasi-ai["']\s*\/>/i,
        'HTML artikel harus memiliki rel="canonical" publik nexamos.cloud/blog/slug'
      );
      assert.doesNotMatch(articleHtml, /localhost/, 'HTML artikel tidak boleh memuat canonical localhost');

      // Periksa sitemap XML
      const sitemapXml = await fs.readFile(path.join(TEST_DIST, 'sitemap.xml'), 'utf-8');
      assert.match(sitemapXml, /<loc>https:\/\/nexamos\.cloud\/blog<\/loc>/, 'Sitemap harus memuat blog index publik');
      assert.match(sitemapXml, /<loc>https:\/\/nexamos\.cloud\/blog\/arsitektur-informasi-ai<\/loc>/, 'Sitemap harus memuat artikel publik');
      assert.doesNotMatch(sitemapXml, /localhost/, 'Sitemap tidak boleh memuat localhost');
    });

    test('Clean build: Menghapus file basi dari build sebelumnya', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);

      // Buat file basi tiruan dari build lama
      const staleFilePath = path.join(TEST_DIST, 'stale-article', 'index.html');
      await fs.mkdir(path.dirname(staleFilePath), { recursive: true });
      await fs.writeFile(staleFilePath, 'stale content');

      const pkg = createValidArticlePackage('fresh-article');
      await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      // Pastikan stale file sudah terhapus
      const staleExists = await fs.stat(staleFilePath).then(() => true).catch(() => false);
      assert.strictEqual(staleExists, false, 'File basi dari build sebelumnya harus dibersihkan');

      // Pastikan file baru ada
      const freshExists = await fs.stat(path.join(TEST_DIST, 'fresh-article', 'index.html')).then(() => true).catch(() => false);
      assert.strictEqual(freshExists, true, 'File artikel baru harus ada');
    });

    test('Menyalin static assets dari folder public tanpa menyalin .gitkeep', async () => {
      const publicDir = path.join(TEST_WORKSPACE, 'public');
      const testImageDir = path.join(publicDir, 'images');
      await fs.mkdir(testImageDir, { recursive: true });
      await fs.writeFile(path.join(testImageDir, '.gitkeep'), '');
      await fs.writeFile(path.join(testImageDir, 'test-hero.webp'), 'binary-test-data');

      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('asset-test');

      const result = await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true,
        copyPublicAssets: true
      });

      assert.ok(result.filesWritten.includes('images/test-hero.webp'), 'test-hero.webp harus disalin');
      assert.ok(!result.filesWritten.includes('images/.gitkeep'), '.gitkeep tidak boleh dicatat sebagai disalin');

      const copiedAssetStat = await fs.stat(path.join(TEST_DIST, 'images', 'test-hero.webp'));
      assert.ok(copiedAssetStat.isFile());
    });
  });

  // ===========================================================================
  // 3. SAFETY & HARD GUARDS
  // ===========================================================================
  describe('3. Safety Guards & Hard Blocks', () => {
    test('HARD BLOCK: Data sintetis ditolak keras pada mode produksi (PRODUCTION_SYNTHETIC_DATA_BLOCKED)', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const syntheticPkg = createValidArticlePackage('synthetic-test');
      syntheticPkg.isSyntheticTestData = true;
      syntheticPkg.fixtureOnly = true;

      await assert.rejects(
        async () => {
          await exporter.exportBlog({
            workspaceRoot: TEST_WORKSPACE,
            outputDirectory: TEST_DIST,
            packages: [syntheticPkg],
            clean: true,
            isDevelopmentFixture: false // mode produksi
          });
        },
        (err: Error) => {
          assert.match(err.message, /STATIC_EXPORT_FAILED/);
          assert.match(err.message, /PRODUCTION_SYNTHETIC_DATA_BLOCKED/);
          return true;
        }
      );
    });

    test('Deteksi dan penolakan kolisi slug duplikat antar artikel', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg1 = createValidArticlePackage('same-slug');
      const pkg2 = createValidArticlePackage('same-slug');
      pkg2.id = 'pkg-same-slug-2';
      pkg2.articleId = 'art-same-slug-2';

      await assert.rejects(
        async () => {
          await exporter.exportBlog({
            workspaceRoot: TEST_WORKSPACE,
            outputDirectory: TEST_DIST,
            packages: [pkg1, pkg2],
            clean: true
          });
        },
        (err: Error) => {
          assert.match(err.message, /STATIC_EXPORT_FAILED/);
          assert.match(err.message, /kolisi slug duplikat/i);
          return true;
        }
      );
    });

    test('Pencegahan path traversal pada slug artikel (misal ../evil)', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const evilPkg = createValidArticlePackage('valid');
      evilPkg.slug = '../evil-directory';

      await assert.rejects(
        async () => {
          await exporter.exportBlog({
            workspaceRoot: TEST_WORKSPACE,
            outputDirectory: TEST_DIST,
            packages: [evilPkg],
            clean: true
          });
        },
        (err: Error) => {
          assert.match(err.message, /STATIC_EXPORT_FAILED/);
          assert.match(err.message, /tidak valid atau mengandung karakter terlarang/i);
          return true;
        }
      );
    });

    test('Exporter menolak menulis ke luar direktori workspace (output escape guard)', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('safe-slug');

      await assert.rejects(
        async () => {
          await exporter.exportBlog({
            workspaceRoot: TEST_WORKSPACE,
            outputDirectory: path.resolve(TEST_WORKSPACE, '../../outside-secret'),
            packages: [pkg],
            clean: true
          });
        },
        (err: Error) => {
          assert.match(err.message, /STATIC_EXPORT_FAILED/);
          assert.match(err.message, /berada di luar workspace root/i);
          return true;
        }
      );
    });

    test('Exporter menolak menargetkan direktori sistem kritis (engines, tests, dll.)', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('safe-slug');

      await assert.rejects(
        async () => {
          await exporter.exportBlog({
            workspaceRoot: TEST_WORKSPACE,
            outputDirectory: path.join(TEST_WORKSPACE, 'engines'),
            packages: [pkg],
            clean: true
          });
        },
        (err: Error) => {
          assert.match(err.message, /STATIC_EXPORT_FAILED/);
          assert.match(err.message, /tidak boleh menargetkan folder sistem/i);
          return true;
        }
      );
    });
  });

  // ===========================================================================
  // 4. CONTENT FIDELITY
  // ===========================================================================
  describe('4. Content Fidelity in Physical Files', () => {
    test('Halaman HTML artikel memuat seluruh elemen primer: artikel, judul, penulis, seksi, sitasi, structured data', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('arsitektur-informasi-ai');

      await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      const html = await fs.readFile(path.join(TEST_DIST, 'arsitektur-informasi-ai', 'index.html'), 'utf-8');

      assert.match(html, /<h1 itemprop="headline">Arsitektur Informasi untuk Mesin Penjawab Generatif<\/h1>/);
      assert.match(html, /itemprop="author">NexaMOS Editorial Lab<\/span>/);
      assert.match(html, /<h2>Fondasi Grounding Epistemik<\/h2>/);
      assert.match(html, /Konten harus memisahkan antara fakta yang diverifikasi dan opini analisis editorial\./);
      assert.match(html, /https:\/\/developers\.google\.com\/search/);
      assert.match(html, /"headline":\s*"Arsitektur Informasi untuk Mesin Penjawab Generatif"/);
      assert.match(html, /<meta name="robots" content="index, follow/);
    });

    test('Blog Index memuat kartu artikel publik dengan tautan /blog/[slug]', async () => {
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('arsitektur-informasi-ai');

      await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      const indexHtml = await fs.readFile(path.join(TEST_DIST, 'index.html'), 'utf-8');
      assert.match(indexHtml, /href="\/blog\/arsitektur-informasi-ai"/);
      assert.match(indexHtml, /<h2>Arsitektur Informasi untuk Mesin Penjawab Generatif<\/h2>/);
    });
  });

  // ===========================================================================
  // 5. LOCAL PREVIEW SERVER INTEGRATION
  // ===========================================================================
  describe('5. Local Preview Server Integration', () => {
    let previewInstance: Awaited<ReturnType<typeof startPreviewServer>>;
    let baseUrl: string;

    beforeEach(async () => {
      // Export minimal site
      const exporter = new StaticFileExporter(TEST_WORKSPACE, TEST_DIST);
      const pkg = createValidArticlePackage('arsitektur-informasi-ai');
      await exporter.exportBlog({
        workspaceRoot: TEST_WORKSPACE,
        outputDirectory: TEST_DIST,
        packages: [pkg],
        clean: true
      });

      // Start preview server on ephemeral port (port 0)
      previewInstance = await startPreviewServer({
        distDir: TEST_DIST,
        port: 0,
        host: '127.0.0.1'
      });
      baseUrl = `http://127.0.0.1:${previewInstance.port}`;
    });

    afterEach(async () => {
      if (previewInstance) {
        await previewInstance.close();
      }
    });

    test('GET / mengembalikan 200 dan konten Blog Index', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/html/);
      assert.strictEqual(res.headers.get('cache-control'), 'no-store, no-cache, must-revalidate');

      const body = await res.text();
      assert.match(body, /NexaMOS Knowledge & Engineering Journal/);
    });

    test('GET /arsitektur-informasi-ai mengembalikan 200 dan konten artikel', async () => {
      const res = await fetch(`${baseUrl}/arsitektur-informasi-ai`);
      assert.strictEqual(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/html/);

      const body = await res.text();
      assert.match(body, /Arsitektur Informasi untuk Mesin Penjawab Generatif/);
    });

    test('GET /arsitektur-informasi-ai/ (dengan trailing slash) mengembalikan 200', async () => {
      const res = await fetch(`${baseUrl}/arsitektur-informasi-ai/`);
      assert.strictEqual(res.status, 200);

      const body = await res.text();
      assert.match(body, /Arsitektur Informasi untuk Mesin Penjawab Generatif/);
    });

    test('GET /blog/arsitektur-informasi-ai (alias rute publik) mengembalikan 200', async () => {
      const res = await fetch(`${baseUrl}/blog/arsitektur-informasi-ai`);
      assert.strictEqual(res.status, 200);

      const body = await res.text();
      assert.match(body, /Arsitektur Informasi untuk Mesin Penjawab Generatif/);
    });

    test('GET /sitemap.xml mengembalikan 200 dengan MIME type application/xml', async () => {
      const res = await fetch(`${baseUrl}/sitemap.xml`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), MIME_TYPES['.xml']);

      const body = await res.text();
      assert.match(body, /<urlset/);
      assert.match(body, /https:\/\/nexamos\.cloud\/blog\/arsitektur-informasi-ai/);
    });

    test('GET /missing-page mengembalikan status 404', async () => {
      const res = await fetch(`${baseUrl}/halaman-tidak-ada`);
      assert.strictEqual(res.status, 404);

      const body = await res.text();
      assert.match(body, /404 — Halaman Tidak Ditemukan/);
    });

    test('SECURITY: Request dengan path traversal langsung (/../package.json) diblokir dengan status 403', async () => {
      const status = await new Promise<number>((resolve, reject) => {
        const req = http.get({ host: '127.0.0.1', port: previewInstance.port, path: '/../package.json' }, (res: http.IncomingMessage) => {
          resolve(res.statusCode || 0);
        });
        req.on('error', reject);
      });
      assert.strictEqual(status, 403);
    });

    test('SECURITY: Request di luar folder dist dicegah mengakses file root proyek', async () => {
      const res = await fetch(`${baseUrl}/package.json`);
      // File package.json ada di root proyek, tetapi TIDAK boleh disajikan dari dist/ (harus 404 atau 403)
      assert.ok(res.status === 404 || res.status === 403);
    });
  });

  // ===========================================================================
  // 6. BUILD COMMAND & RUNNER LOGIC
  // ===========================================================================
  describe('6. Build Command & Runner Logic', () => {
    test('runBuild dalam mode produksi menghasilkan 0 artikel jika tidak ada artikel produksi nyata', async () => {
      const summary = await runBuild({
        isFixture: false,
        workspaceRoot: TEST_WORKSPACE
      });

      assert.strictEqual(summary.mode, 'PRODUCTION');
      assert.strictEqual(summary.articleCount, 0);
      assert.strictEqual(summary.status, 'SUCCESS');
      assert.match(summary.notice || '', /No production publication candidates found/);

      // Verifikasi dist/index.html tetap dibuat untuk mode produksi 0 artikel
      const indexStat = await fs.stat(path.join(TEST_WORKSPACE, 'dist', 'index.html'));
      assert.ok(indexStat.isFile());
    });

    test('runBuild dalam mode fixture (--fixture) mengekspor dev fixture dengan warning', async () => {
      const summary = await runBuild({
        isFixture: true,
        workspaceRoot: TEST_WORKSPACE
      });

      assert.strictEqual(summary.mode, 'FIXTURE');
      assert.strictEqual(summary.articleCount, 1);
      assert.strictEqual(summary.status, 'SUCCESS');
      assert.ok(summary.warning?.includes('DEVELOPMENT_ONLY'));

      const articleStat = await fs.stat(path.join(TEST_WORKSPACE, 'dist', 'blog-masih-relevan-di-era-ai', 'index.html'));
      assert.ok(articleStat.isFile());
    });
  });
});
