/**
 * NexaMOS Production Pilot 01 — Article Publishing Script
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6/Pilot 01 specifications.
 * Alur Kerja:
 * 1. Membaca naskah tervalidasi dari content/drafts/pilot-article-draft.json
 * 2. Membaca konfigurasi input dari data/pilot/pilot-article-input.json
 * 3. Membangun PublicationPackage produksi resmi (bukan fixture, isSyntheticTestData: false)
 * 4. Menjalankan PublicationPreflightValidator untuk memverifikasi kelayakan rilis
 * 5. Menyimpan paket terverifikasi ke content/published/blog-masih-relevan-di-era-ai.json
 * 6. Menjalankan runBuild() untuk menghasilkan output statis fisik ke dist/
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { PublicationPackageBuilder } from '../engines/publishing/publication-package.ts';
import { PublicationPreflightValidator } from '../engines/publishing/publication-preflight.ts';
import type { PublicationCandidate } from '../engines/distribution/distribution-readiness.ts';
import type { ArticleDraft } from '../engines/editorial/article-draft.ts';
import type { Topic } from '../engines/ideation/domain/topic.types.ts';
import type { ArticleSEOMetadata } from '../engines/seo-validator/article-seo-metadata.ts';
import type { ResearchBrief } from '../engines/research/orchestrator/research-brief.ts';
import { runBuild } from './build-blog.ts';

async function publishPilotArticle(): Promise<void> {
  const workspaceRoot = process.cwd();
  console.log('====================================================');
  console.log('NexaMOS Production Pilot 01 — Official Article Publisher');
  console.log('Mode: PRODUCTION PUBLICATION');
  console.log('====================================================');

  const draftPath = path.join(workspaceRoot, 'content', 'drafts', 'pilot-article-draft.json');
  const inputPath = path.join(workspaceRoot, 'data', 'pilot', 'pilot-article-input.json');

  // 1. Baca Draft dan Input Pilot
  const rawDraft = await fs.readFile(draftPath, 'utf-8');
  const draftFile = JSON.parse(rawDraft);
  const draftData: ArticleDraft = draftFile.draft;

  const rawInput = await fs.readFile(inputPath, 'utf-8');
  const inputData = JSON.parse(rawInput);

  console.log(`Judul Draft: "${draftData.title}"`);
  console.log(`Slug:        ${draftData.slug}`);
  console.log(`Grounding:   ${draftFile.guardEvaluation?.status || 'UNKNOWN'}`);

  if (draftFile.guardEvaluation?.status !== 'PASS') {
    throw new Error(`DILARANG MEMPUBLIKASIKAN: Grounding Guard tidak berstatus PASS.`);
  }

  // 2. Siapkan Entitas Pendukung Kanonikal
  const slug = draftData.slug || inputData.topic.slug;
  const candidate: PublicationCandidate = {
    candidateId: `cand-pilot-${Date.now().toString(36)}`,
    articleId: `art-pilot-${Date.now().toString(36)}`,
    slug,
    title: draftData.title,
    distributionReadinessId: 'dist-ready-pilot-01',
    approvedAt: new Date().toISOString(),
    overallStatus: 'READY_TO_PUBLISH',
    warnings: [],
    policyVersion: 'PILOT_01_EDITORIAL_APPROVAL'
  };

  const topic: Topic = {
    id: 'top-pilot-01',
    title: inputData.topic.title,
    slug,
    territory: inputData.topic.territory || 'STRATEGY',
    recommendedArticleType: inputData.topic.articleType || 'ANALYSIS',
    editorialRole: inputData.topic.editorialRole || 'AUTHORITY',
    audience: {
      segment: inputData.topic.audience?.segment || 'Enterprise Content Leaders'
    },
    problem: inputData.topic.problem,
    intent: { primary: 'Investigasi peran dan arsitektur blog di era AI Overviews' },
    thesis: draftData.thesis,
    whyNow: null,
    status: 'APPROVED',
    informationGain: {
      originalityType: ['ORIGINAL_FRAMEWORK'],
      expectedContribution: 'Arsitektur informasi mandiri untuk retrieval model bahasa',
      commodityRisk: 'LOW'
    },
    evidencePlan: {
      requiredEvidenceLevel: 'E2',
      plannedSources: ['Google Search Central Documentation'],
      originalEvidenceRequired: true
    },
    businessRelevance: {
      objective: 'Thought Leadership',
      funnelRole: 'TOFU'
    },
    distributionTargets: ['GOOGLE_SEARCH', 'GOOGLE_AI'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const seoMeta: ArticleSEOMetadata = {
    title: `${draftData.title} | NexaMOS`,
    description: draftData.dek || 'Analisis mendalam mengenai arsitektur informasi mandiri dan relevansi blog di era pencarian AI generatif.',
    slug,
    canonicalUrl: `https://nexamos.cloud/blog/${slug}`,
    robots: {
      index: true,
      follow: true
    },
    author: {
      name: 'Tim Riset & Rekayasa NexaMOS',
      role: 'NexaMOS Knowledge & AI Engineering'
    },
    publisher: {
      name: 'NexaMOS Knowledge Journal',
      logoUrl: 'https://nexamos.cloud/brand/logo.png'
    },
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 3. Sumber Sitasi Eksternal Otoritatif
  const brief: Partial<ResearchBrief> = {
    sourceIndex: [
      {
        sourceId: 'src-google-helpful',
        title: 'Creating Helpful, Reliable, People-First Content — Google Search Central',
        url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
        canonicalUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
        publisher: 'Google Search Central',
        publishedDate: '2023',
        sourceType: 'OFFICIAL_DOCUMENTATION',
        authorityScore: 95,
        publicationAllowed: true
      },
      {
        sourceId: 'src-google-ai-guidance',
        title: "Google Search's Guidance About AI-Generated Content — Google Search Central Blog",
        url: 'https://developers.google.com/search/blog/2023/02/google-search-and-ai-content',
        canonicalUrl: 'https://developers.google.com/search/blog/2023/02/google-search-and-ai-content',
        publisher: 'Google Search Central Blog',
        publishedDate: '2023-02-08',
        sourceType: 'COMPANY_PUBLICATION',
        authorityScore: 95,
        publicationAllowed: true
      }
    ]
  };

  // 4. Bangun Paket Publikasi Produksi
  draftData.territory = draftData.territory || topic.territory;
  draftData.articleType = draftData.articleType || topic.recommendedArticleType;
  draftData.editorialRole = draftData.editorialRole || topic.editorialRole;

  const publicationPackage = PublicationPackageBuilder.build(
    candidate,
    draftData,
    topic,
    seoMeta,
    brief as ResearchBrief,
    {
      siteUrl: 'https://nexamos.cloud',
      blogBasePath: '/blog',
      publishedAt: new Date().toISOString(),
      heroImage: {
        url: '/blog/images/hero-blog-ai-era.webp',
        alt: 'Arsitektur Informasi Mandiri dan Retrievabilitas Konten di Era AI Overviews',
        width: 1200,
        height: 630,
        caption: 'Diagram relasi antara arsitektur informasi mandiri, grounding klaim, dan retrieval model generatif.'
      },
      isSyntheticTestData: false,
      fixtureOnly: false
    }
  );

  // 5. Jalankan Preflight Validator secara Ketat
  console.log('\n--- Menjalankan Preflight Validator ---');
  const preflightValidator = new PublicationPreflightValidator();
  const preflightResult = preflightValidator.validate(publicationPackage);

  console.log(`Preflight Status: ${preflightResult.status}`);
  if (preflightResult.status === 'FAIL') {
    console.error('Kesalahan Pemblokir Preflight:');
    for (const err of preflightResult.blockingErrors) {
      console.error(` - ${err}`);
    }
    throw new Error('PUBLICATION_ABORTED: Preflight validation gagal.');
  }

  if (preflightResult.warnings.length > 0) {
    console.log('Peringatan Preflight:');
    for (const w of preflightResult.warnings) {
      console.log(` [WARN] ${w}`);
    }
  }

  // 6. Simpan Paket Terbit ke content/published/[slug].json
  const publishedDir = path.join(workspaceRoot, 'content', 'published');
  await fs.mkdir(publishedDir, { recursive: true });

  const publishedFilePath = path.join(publishedDir, `${slug}.json`);
  await fs.writeFile(publishedFilePath, JSON.stringify(publicationPackage, null, 2), 'utf-8');
  console.log(`\nPaket publikasi resmi disimpan di: ${publishedFilePath}`);

  // 7. Jalankan Static Build Resmi (Mode Produksi)
  console.log('\n--- Menjalankan Static Site Exporter (Production Build) ---');
  const buildSummary = await runBuild({ isFixture: false, workspaceRoot });

  console.log('====================================================');
  console.log('PUBLIKASI ARTIKEL PILOT 01 BERHASIL SEPENUHNYA!');
  console.log(`Artikel:    ${buildSummary.articleCount} artikel dipublikasikan`);
  console.log(`Direktori:  ${buildSummary.outputDirectory}`);
  console.log(`File:       ${buildSummary.filesWritten.join(', ')}`);
  console.log('====================================================\n');
}

publishPilotArticle().catch((err) => {
  console.error('\nPublish execution failed:', err.message);
  process.exit(1);
});
