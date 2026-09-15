/**
 * NexaMOS Blog Static Build Script
 *
 * Sourced from NexaMOS Blog Master Reference & Pilot 01 specifications.
 * Menjalankan alur:
 * Publication Package -> Preflight -> HTML Render -> Static File Export -> dist/
 *
 * Mode:
 * 1. PRODUCTION MODE (default: npm run build):
 *    - Menegakkan hard guard: PRODUCTION_SYNTHETIC_DATA_BLOCKED.
 *    - Jika tidak ada artikel produksi nyata, menghasilkan 0 published articles tanpa fallback ke fixture.
 * 2. FIXTURE / DEV MODE (npm run build:fixture):
 *    - Secara eksplisit menggunakan synthetic fixture untuk visual preview lokal.
 *    - Menandai output sebagai DEVELOPMENT_ONLY.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { PublicationPreflightValidator } from '../engines/publishing/publication-preflight.ts';
import type { PublicationPackage } from '../engines/publishing/publication.ts';
import { StaticFileExporter } from '../infrastructure/publishing/static-file-exporter.ts';
import { publicConfig } from '../infrastructure/config/public-config.ts';

export interface BuildSummary {
  mode: 'PRODUCTION' | 'FIXTURE';
  articleCount: number;
  filesWritten: string[];
  outputDirectory: string;
  status: 'SUCCESS' | 'FAILED';
  warning?: string;
  notice?: string;
}

/**
 * Membangun fixture artikel sintetis untuk tujuan dev visual preview
 */
export function createDevFixturePackage(): PublicationPackage {
  const slug = 'blog-masih-relevan-di-era-ai';
  const siteUrl = publicConfig.siteUrl;

  return {
    id: 'pkg-fixture-001',
    candidateId: 'cand-fixture-001',
    articleId: 'art-fixture-001',
    slug,
    internalRoute: `/${slug}`,
    publicCanonicalPath: `/blog/${slug}`,
    canonicalPath: `/blog/${slug}`,
    canonicalUrl: `${siteUrl}/blog/${slug}`,
    title: 'Apakah Blog Masih Relevan di Era Pencarian Generatif?',
    description: 'Analisis berbasis bukti primer mengenai pergeseran perilaku pencarian dan strategi arsitektur informasi untuk sistem AI Overviews.',
    territory: 'STRATEGY',
    articleType: 'ANALYSIS',
    editorialRole: 'AUTHORITY',
    articleContent: {
      headline: 'Apakah Blog Masih Relevan di Era Pencarian Generatif?',
      dek: 'Analisis berbasis bukti primer mengenai pergeseran perilaku pencarian dan strategi arsitektur informasi untuk sistem AI Overviews.',
      sections: [
        {
          id: 'sec-1',
          heading: 'Pergeseran Lanskap Pencarian Menuju Sistem Penjawab',
          content: 'Integrasi mesin penjawab generatif (seperti Google AI Overviews) telah mengubah pola konsumsi informasi secara fundamental. Konten komoditas dan artikel repetitif mengalami erosi visibilitas organik yang sangat signifikan.\n\nNamun, publikasi otoritatif dengan sudut pandang mandiri dan bukti data primer tetap menjadi rujukan utama yang disintesis oleh model bahasa.',
          order: 1,
          purpose: 'CONTEXT'
        },
        {
          id: 'sec-2',
          heading: 'Bukti Keterlacakan dan Retrievabilitas Konten Mandiri',
          content: 'Evaluasi independen terhadap keterlacakan sumber membuktikan bahwa artikel dengan struktur klaim terikat (bounded claim) dan sitasi eksplisit memiliki peluang sitasi AI 42% lebih tinggi.\n\nOtoritas informasi tidak lagi dibangun dengan volume posting tinggi, melainkan dengan information gain nyata dan keterandalan metodologis yang dapat diverifikasi.',
          order: 2,
          purpose: 'EVIDENCE'
        },
        {
          id: 'sec-3',
          heading: 'Kesimpulan Taktis untuk Rekayasa Informasi',
          content: 'Aktivitas blog tetap relevan bukan sebagai saluran distribusi komoditas, melainkan sebagai jurnal riset dan repositori otoritas pemikiran utama organisasi.\n\nArsitektur informasi yang terstruktur rapi memastikan materi dapat dipahami oleh pembaca manusia sekaligus diretrieve secara presisi oleh mesin penjawab generatif.',
          order: 3,
          purpose: 'CONCLUSION'
        }
      ]
    },
    author: {
      name: 'Tim Riset & Rekayasa NexaMOS',
      role: 'NexaMOS Knowledge & AI Engineering'
    },
    publishedAt: '2026-09-15T00:00:00.000Z',
    updatedAt: null,
    seoMetadata: {
      metaTitle: 'Apakah Blog Masih Relevan di Era AI? | NexaMOS',
      metaDescription: 'Analisis berbasis bukti primer mengenai pergeseran perilaku pencarian dan strategi arsitektur informasi untuk sistem AI Overviews.',
      openGraph: {
        'og:type': 'article',
        'og:title': 'Apakah Blog Masih Relevan di Era Pencarian Generatif?',
        'og:description': 'Analisis mendalam mengenai arsitektur informasi dan AI Overviews.'
      }
    },
    discoverMetadata: {
      hasLargeImagePreview: true,
      visualReadinessScore: 85,
      interestFit: 'Enterprise AI & Search Architecture'
    },
    aiVisibilityMetadata: {
      retrievability: 'HIGH',
      answerability: 'HIGH',
      claimTraceability: 'HIGH'
    },
    heroImage: {
      url: '/blog/images/hero-blog-ai-era.webp',
      alt: 'Visualisasi grafik keterlacakan sumber informasi pada sistem AI search',
      width: 1200,
      height: 630
    },
    visualAssets: [],
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: 'Apakah Blog Masih Relevan di Era Pencarian Generatif?',
          description: 'Analisis berbasis bukti primer mengenai pergeseran perilaku pencarian dan strategi arsitektur informasi untuk sistem AI Overviews.',
          mainEntityOfPage: `${siteUrl}/blog/${slug}`,
          datePublished: '2026-09-15T00:00:00.000Z',
          author: {
            '@type': 'Person',
            name: 'Tim Riset & Rekayasa NexaMOS'
          }
        }
      ]
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
      lastmod: '2026-09-15T00:00:00.000Z',
      changefreq: 'weekly',
      priority: 0.8
    },
    isSyntheticTestData: true,
    fixtureOnly: true,
    generatedAt: '2026-09-15T00:00:00.000Z',
    packageVersion: 'v1.0.0'
  };
}

/**
 * Membaca paket publikasi produksi dari direktori content/published (jika ada)
 */
async function loadProductionPackages(workspaceRoot: string): Promise<PublicationPackage[]> {
  const publishedDirs = [
    path.join(workspaceRoot, 'content', 'published'),
    path.join(workspaceRoot, 'data', 'published')
  ];

  const packages: PublicationPackage[] = [];

  for (const dir of publishedDirs) {
    const exists = await fs.stat(dir).then(() => true).catch(() => false);
    if (!exists) continue;

    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const raw = await fs.readFile(path.join(dir, file), 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.slug && parsed.articleContent) {
            packages.push(parsed);
          }
        } catch (e: any) {
          console.warn(`[WARN] Gagal membaca paket publikasi ${file}: ${e.message}`);
        }
      }
    }
  }

  return packages;
}

/**
 * Runner utama build blog
 */
export async function runBuild(options: { isFixture?: boolean; workspaceRoot?: string } = {}): Promise<BuildSummary> {
  const workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : process.cwd();
  const isFixtureMode = options.isFixture ?? (process.argv.includes('--fixture') || process.argv.includes('--dev'));

  const exporter = new StaticFileExporter(workspaceRoot);
  const preflightValidator = new PublicationPreflightValidator();

  console.log('====================================================');
  console.log(`NexaMOS Blog Build Engine`);
  console.log(`Mode: ${isFixtureMode ? 'FIXTURE / DEV (Explicit Fixture Build)' : 'PRODUCTION'}`);
  console.log(`Workspace: ${workspaceRoot}`);
  console.log('====================================================');

  if (isFixtureMode) {
    const fixturePkg = createDevFixturePackage();

    // Jalankan export dalam mode fixture
    const result = await exporter.exportBlog({
      workspaceRoot,
      packages: [fixturePkg],
      clean: true,
      isDevelopmentFixture: true
    });

    console.log(`\nNexaMOS Blog Build [DEVELOPMENT_ONLY FIXTURE]`);
    console.log(`Articles: ${result.articleCount}`);
    console.log(`Files: ${result.filesWritten.length} (${result.filesWritten.join(', ')})`);
    console.log(`Output: ${result.outputDirectory}`);
    console.log(`Status: SUCCESS`);
    console.log(`Warning: Output contains synthetic test fixture. Not suitable for production deployment.\n`);

    return {
      mode: 'FIXTURE',
      articleCount: result.articleCount,
      filesWritten: result.filesWritten,
      outputDirectory: result.outputDirectory,
      status: 'SUCCESS',
      warning: 'DEVELOPMENT_ONLY: Synthetic test fixture used.'
    };
  }

  // PRODUCTION MODE:
  const productionPackages = await loadProductionPackages(workspaceRoot);

  if (productionPackages.length === 0) {
    // Tidak ada artikel produksi rill (Real AI Adapter belum terpasang).
    // Menghasilkan index kosong yang aman tanpa membocorkan fixture sintetis.
    const result = await exporter.exportBlog({
      workspaceRoot,
      packages: [],
      clean: true,
      isDevelopmentFixture: false
    });

    console.log(`\nNexaMOS Blog Build`);
    console.log(`Articles: 0`);
    console.log(`Files: ${result.filesWritten.length} (${result.filesWritten.join(', ')})`);
    console.log(`Output: ${result.outputDirectory}`);
    console.log(`Status: SUCCESS`);
    console.log(`Notice: No production publication candidates found. 0 published articles exported.\n`);

    return {
      mode: 'PRODUCTION',
      articleCount: 0,
      filesWritten: result.filesWritten,
      outputDirectory: result.outputDirectory,
      status: 'SUCCESS',
      notice: 'No production publication candidates found.'
    };
  }

  // Jika ada artikel produksi, jalankan preflight validator secara ketat
  for (const pkg of productionPackages) {
    const preflightResult = preflightValidator.validate(pkg);
    if (preflightResult.status === 'FAIL') {
      const errorMsg = `Preflight validation FAIL untuk artikel '${pkg.slug}':\n` +
        preflightResult.blockingErrors.map((e) => ` - ${e}`).join('\n');
      console.error(`\n[FATAL] ${errorMsg}\n`);
      throw new Error(`BUILD_FAILED: ${errorMsg}`);
    }
  }

  const result = await exporter.exportBlog({
    workspaceRoot,
    packages: productionPackages,
    clean: true,
    isDevelopmentFixture: false
  });

  console.log(`\nNexaMOS Blog Build`);
  console.log(`Articles: ${result.articleCount}`);
  console.log(`Files: ${result.filesWritten.length}`);
  console.log(`Output: ${result.outputDirectory}`);
  console.log(`Status: SUCCESS\n`);

  return {
    mode: 'PRODUCTION',
    articleCount: result.articleCount,
    filesWritten: result.filesWritten,
    outputDirectory: result.outputDirectory,
    status: 'SUCCESS'
  };
}

// Eksekusi jika dijalankan langsung via CLI
if (process.argv[1] && (process.argv[1].endsWith('build-blog.ts') || process.argv[1].endsWith('build-blog.js'))) {
  runBuild()
    .catch((err) => {
      console.error('\nBuild execution failed:', err.message);
      process.exit(1);
    });
}
