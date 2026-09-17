/**
 * NexaMOS Static File Exporter (Infrastructure Boundary)
 *
 * Sourced from NexaMOS Blog Master Reference & Pilot 01 specifications.
 * Bertanggung jawab menerima PublicationPackage terverifikasi, merender HTML statis,
 * dan menulis file fisik ke folder output (default: /dist).
 *
 * Prinsip:
 * 1. Native-First: Menggunakan node:fs/promises dan node:path tanpa framework eksternal.
 * 2. Atomic-Safety: Penulisan file aman untuk mencegah file setengah jadi.
 * 3. Clean Output Guard: Pembersihan output dibatasi strictly di dalam direktori target.
 * 4. Path Traversal Guard: Mencegah slug atau path berbahaya meloloskan diri dari target output.
 * 5. Public Canonical Preservation: Canonical URL tetap selalu mengarah ke https://nexamos.cloud/blog/[slug].
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { PublicationPackage } from '../../engines/publishing/publication.ts';
import { PublicationHtmlRenderer } from '../../engines/publishing/html-renderer.ts';
import { PublicationManifestBuilder } from '../../engines/publishing/publication-manifest.ts';
import { publicConfig } from '../config/public-config.ts';

export interface StaticExportOptions {
  outputDirectory?: string;
  workspaceRoot?: string;
  packages: PublicationPackage[];
  clean?: boolean;
  siteUrl?: string;
  copyPublicAssets?: boolean;
  isDevelopmentFixture?: boolean;
  googleSiteVerification?: string;
  gaMeasurementId?: string;
}

export interface ContentHashItem {
  slug: string;
  hash: string;
}

export interface StaticExportResult {
  outputDirectory: string;
  filesWritten: string[];
  articleCount: number;
  contentHashes: ContentHashItem[];
  generatedAt: string;
  isDevelopmentFixture?: boolean;
  feedStatus?: 'NOT_IMPLEMENTED';
}

const RESERVED_SLUGS = new Set([
  'index',
  'blog',
  'api',
  'feed',
  'sitemap',
  'admin',
  'rss',
  'search',
  'draft',
  'tag',
  'category',
  'author',
  'articles'
]);

export class StaticFileExporter {
  private readonly defaultWorkspaceRoot: string;
  private readonly defaultOutputDir: string;

  constructor(workspaceRoot?: string, outputDir?: string) {
    this.defaultWorkspaceRoot = workspaceRoot ? path.resolve(workspaceRoot) : process.cwd();
    this.defaultOutputDir = outputDir ? path.resolve(outputDir) : path.join(this.defaultWorkspaceRoot, 'dist');
  }

  /**
   * Menjalankan proses export seluruh halaman blog dan aset ke folder fisik
   */
  public async exportBlog(options: StaticExportOptions): Promise<StaticExportResult> {
    const workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : this.defaultWorkspaceRoot;
    const outputDirectory = options.outputDirectory ? path.resolve(options.outputDirectory) : this.defaultOutputDir;
    const siteUrl = options.siteUrl ? options.siteUrl.replace(/\/+$/, '') : publicConfig.siteUrl;
    const clean = options.clean !== false;
    const copyAssets = options.copyPublicAssets !== false;
    const isDevelopmentFixture = Boolean(options.isDevelopmentFixture);

    const filesWritten: string[] = [];
    const contentHashes: ContentHashItem[] = [];
    const generatedAt = new Date().toISOString();

    try {
      // 1. Guard dan Validasi Output Directory
      this.validateSafeOutputDirectory(outputDirectory, workspaceRoot);

      // 2. Clean Target Directory jika diminta
      if (clean) {
        await this.cleanOutputDirectory(outputDirectory);
      } else {
        await fs.mkdir(outputDirectory, { recursive: true });
      }

      // 3. Validasi Slug dan Integritas Paket
      this.validatePackages(options.packages, isDevelopmentFixture);

      const googleSiteVerification = options.googleSiteVerification ?? publicConfig.googleSiteVerification;
      const gaMeasurementId = options.gaMeasurementId ?? publicConfig.gaMeasurementId;
      const renderOptions = {
        siteUrl,
        googleSiteVerification,
        gaMeasurementId
      };

      // 4. Render & Write Blog Index: dist/index.html
      const indexHtml = PublicationHtmlRenderer.renderBlogIndexPage(options.packages, renderOptions);
      const indexPath = path.join(outputDirectory, 'index.html');
      await this.atomicWriteFile(indexPath, indexHtml);
      filesWritten.push('index.html');

      // 5. Render & Write Articles: dist/[slug]/index.html
      for (const pkg of options.packages) {
        const articleHtml = PublicationHtmlRenderer.renderArticlePage(pkg, renderOptions);
        const articleDir = path.join(outputDirectory, pkg.slug);
        const articlePath = path.join(articleDir, 'index.html');

        await this.atomicWriteFile(articlePath, articleHtml);
        filesWritten.push(`${pkg.slug}/index.html`);

        const hash = PublicationManifestBuilder.computePackageHash(pkg);
        contentHashes.push({
          slug: pkg.slug,
          hash
        });
      }

      // 6. Generate & Write Sitemap: dist/sitemap.xml
      const sitemapXml = this.generateSitemapXml(options.packages, siteUrl);
      const sitemapPath = path.join(outputDirectory, 'sitemap.xml');
      await this.atomicWriteFile(sitemapPath, sitemapXml);
      filesWritten.push('sitemap.xml');

      // 7. Generate & Write Articles JSON Feed: dist/articles.json
      const articlesJson = this.generateArticlesJson(options.packages, siteUrl);
      const articlesJsonPath = path.join(outputDirectory, 'articles.json');
      await this.atomicWriteFile(articlesJsonPath, articlesJson);
      filesWritten.push('articles.json');

      // 8. Copy Public Assets jika ada
      if (copyAssets) {
        const publicDir = path.join(workspaceRoot, 'public');
        const copied = await this.copyStaticAssets(publicDir, outputDirectory);
        filesWritten.push(...copied);
      }

      return {
        outputDirectory,
        filesWritten,
        articleCount: options.packages.length,
        contentHashes,
        generatedAt,
        isDevelopmentFixture,
        feedStatus: 'NOT_IMPLEMENTED'
      };
    } catch (error: any) {
      if (error?.message?.startsWith('STATIC_EXPORT_FAILED')) {
        throw error;
      }
      throw new Error(`STATIC_EXPORT_FAILED: ${error?.message || String(error)}`);
    }
  }

  /**
   * Validasi integritas slug dan larangan data sintetis pada mode produksi
   */
  private validatePackages(packages: PublicationPackage[], isDevelopmentFixture: boolean): void {
    const seenSlugs = new Set<string>();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    for (const pkg of packages) {
      if (!isDevelopmentFixture && (pkg.isSyntheticTestData || pkg.fixtureOnly)) {
        throw new Error(
          `STATIC_EXPORT_FAILED: PRODUCTION_SYNTHETIC_DATA_BLOCKED. Artikel '${pkg.slug}' merupakan fixture sintetis dan ditolak pada build produksi.`
        );
      }

      if (!pkg.slug || !slugRegex.test(pkg.slug)) {
        throw new Error(
          `STATIC_EXPORT_FAILED: Format slug '${pkg.slug}' tidak valid atau mengandung karakter terlarang / traversal.`
        );
      }

      if (RESERVED_SLUGS.has(pkg.slug)) {
        throw new Error(
          `STATIC_EXPORT_FAILED: Slug '${pkg.slug}' menggunakan kata kunci sistem yang dicadangkan.`
        );
      }

      if (seenSlugs.has(pkg.slug)) {
        throw new Error(
          `STATIC_EXPORT_FAILED: Terdeteksi kolisi slug duplikat '${pkg.slug}'.`
        );
      }
      seenSlugs.add(pkg.slug);
    }
  }

  /**
   * Memastikan outputDirectory strictly berada di dalam workspace root dan bukan direktori sistem
   */
  private validateSafeOutputDirectory(targetDir: string, workspaceRoot: string): void {
    const resolvedTarget = path.resolve(targetDir);
    const resolvedRoot = path.resolve(workspaceRoot);

    const relative = path.relative(resolvedRoot, resolvedTarget);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(
        `STATIC_EXPORT_FAILED: Target output directory "${targetDir}" berada di luar workspace root.`
      );
    }

    const topSubdir = relative.split(path.sep)[0].toLowerCase();
    const protectedDirs = new Set([
      'agent',
      'components',
      'content',
      'data',
      'docs',
      'editorial-ops',
      'engines',
      'infrastructure',
      'knowledge',
      'lib',
      'node_modules',
      'scripts',
      'tests'
    ]);

    if (protectedDirs.has(topSubdir)) {
      throw new Error(
        `STATIC_EXPORT_FAILED: Target output directory "${targetDir}" tidak boleh menargetkan folder sistem proyek ('${topSubdir}').`
      );
    }
  }

  /**
   * Membersihkan isi outputDirectory secara aman
   */
  private async cleanOutputDirectory(outputDir: string): Promise<void> {
    const exists = await fs.stat(outputDir).then(() => true).catch(() => false);
    if (exists) {
      const entries = await fs.readdir(outputDir);
      for (const entry of entries) {
        const fullPath = path.join(outputDir, entry);
        await fs.rm(fullPath, { recursive: true, force: true });
      }
    } else {
      await fs.mkdir(outputDir, { recursive: true });
    }
  }

  /**
   * Menulis file secara aman (atomic write) dengan fallback yang andal
   */
  private async atomicWriteFile(targetPath: string, content: string | Uint8Array): Promise<void> {
    const dir = path.dirname(targetPath);
    await fs.mkdir(dir, { recursive: true });

    const tempFilename = `.${path.basename(targetPath)}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    const tempPath = path.join(dir, tempFilename);

    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, targetPath);
    } catch {
      // Fallback untuk antisipasi kendala filesystem lock (misal di sistem tertentu)
      try {
        await fs.unlink(tempPath).catch(() => {});
      } catch {}
      await fs.writeFile(targetPath, content, 'utf-8');
    }
  }

  /**
   * Membangun format XML kanonikal untuk sitemap.xml
   */
  private generateSitemapXml(packages: PublicationPackage[], siteUrl: string): string {
    const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
    const now = new Date().toISOString();

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      `    <loc>${cleanSiteUrl}/blog</loc>`,
      `    <lastmod>${now}</lastmod>`,
      '    <changefreq>daily</changefreq>',
      '    <priority>1.0</priority>',
      '  </url>'
    ];

    for (const pkg of packages) {
      // Selalu gunakan canonicalUrl publik resmi (bukan internal route atau localhost)
      const loc = pkg.canonicalUrl || `${cleanSiteUrl}/blog/${pkg.slug}`;
      const lastmod = pkg.sitemapEntry?.lastmod || pkg.publishedAt || now;
      const changefreq = pkg.sitemapEntry?.changefreq || 'weekly';
      const priority = pkg.sitemapEntry?.priority !== undefined ? pkg.sitemapEntry.priority : 0.8;

      lines.push('  <url>');
      lines.push(`    <loc>${loc}</loc>`);
      lines.push(`    <lastmod>${lastmod}</lastmod>`);
      lines.push(`    <changefreq>${changefreq}</changefreq>`);
      lines.push(`    <priority>${priority.toFixed(1)}</priority>`);
      lines.push('  </url>');
    }

    lines.push('</urlset>');
    return lines.join('\n');
  }

  /**
   * Menyalin file statis publik (gambar, brand assets) kecuali file placeholder .gitkeep
   */
  private async copyStaticAssets(sourceDir: string, targetDir: string): Promise<string[]> {
    const copiedFiles: string[] = [];
    const exists = await fs.stat(sourceDir).then(() => true).catch(() => false);
    if (!exists) return copiedFiles;

    const copyRecursive = async (currentSrc: string, currentDst: string, relPrefix: string) => {
      const entries = await fs.readdir(currentSrc, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.gitkeep') continue;

        const srcPath = path.join(currentSrc, entry.name);
        const dstPath = path.join(currentDst, entry.name);
        const relPath = path.join(relPrefix, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          await fs.mkdir(dstPath, { recursive: true });
          await copyRecursive(srcPath, dstPath, relPath);
        } else if (entry.isFile()) {
          await fs.mkdir(path.dirname(dstPath), { recursive: true });
          await fs.copyFile(srcPath, dstPath);
          copiedFiles.push(relPath);
        }
      }
    };

    await copyRecursive(sourceDir, targetDir, '');
    return copiedFiles;
  }

  /**
   * Membangun feed data JSON statis untuk integrasi eksternal (misal: Landing Page Highlight)
   * Menyediakan metadata artikel terurut dari yang terbaru (publishedAt descending)
   */
  public generateArticlesJson(packages: PublicationPackage[], siteUrl: string): string {
    const cleanSiteUrl = siteUrl.replace(/\/+$/, '');

    // Urutkan artikel dari yang paling baru (publishedAt descending)
    const sorted = [...packages].sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });

    const feed = sorted.map((pkg) => {
      const url = pkg.canonicalUrl || `${cleanSiteUrl}/blog/${pkg.slug}`;
      let heroImageUrl: string | undefined = undefined;

      if (pkg.heroImage?.url) {
        if (pkg.heroImage.url.startsWith('http://') || pkg.heroImage.url.startsWith('https://')) {
          heroImageUrl = pkg.heroImage.url;
        } else if (pkg.heroImage.url.startsWith('/blog/')) {
          heroImageUrl = pkg.heroImage.url;
        } else if (pkg.heroImage.url.startsWith('/')) {
          heroImageUrl = `/blog${pkg.heroImage.url}`;
        } else {
          heroImageUrl = `/blog/${pkg.heroImage.url}`;
        }
      }

      return {
        slug: pkg.slug,
        title: pkg.title,
        dek: pkg.articleContent?.dek || pkg.description || '',
        territory: pkg.territory,
        articleType: pkg.articleType,
        editorialRole: pkg.editorialRole,
        url,
        heroImageUrl,
        heroImageAlt: pkg.heroImage?.alt || pkg.title,
        author: {
          name: pkg.author?.name || 'Tim Riset & Rekayasa NexaMOS',
          role: pkg.author?.role || 'NexaMOS Knowledge & AI Engineering',
          avatarUrl: pkg.author?.avatarUrl || 'https://nexamos.cloud/authors/default.png'
        },
        publishedAt: pkg.publishedAt || new Date().toISOString(),
        translations: pkg.translations ? {
          id: pkg.translations.id ? { title: pkg.translations.id.title, dek: pkg.translations.id.dek } : undefined,
          en: pkg.translations.en ? { title: pkg.translations.en.title, dek: pkg.translations.en.dek } : undefined
        } : undefined
      };
    });

    return JSON.stringify(feed, null, 2);
  }
}

