/**
 * NexaMOS Blog Local Preview Server
 *
 * Sourced from NexaMOS Blog Master Reference & Pilot 01 specifications.
 * Server HTTP lokal berbasis Node.js native (node:http, node:fs/promises, node:path)
 * tanpa framework eksternal (No Express, No Vite).
 *
 * Fitur:
 * 1. Resolusi rute internal: / -> dist/index.html, /[slug] -> dist/[slug]/index.html
 * 2. MIME type mapping lengkap (.html, .xml, .css, .js, .json, .svg, .png, .jpg, .webp)
 * 3. Security guards: Pencegahan path traversal (../, %2e%2e, null bytes, escape dist/)
 * 4. Cache control: no-store untuk preview instan
 * 5. Dapat dijalankan via CLI atau diuji secara programatik dengan port efemeral
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { publicConfig } from '../infrastructure/config/public-config.ts';

export const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

export interface PreviewServerOptions {
  distDir?: string;
  port?: number;
  host?: string;
}

export interface PreviewServerInstance {
  server: http.Server;
  port: number;
  host: string;
  distDir: string;
  close: () => Promise<void>;
}

/**
 * Membuat dan mengonfigurasi instance server HTTP preview
 */
export function createPreviewServer(options: PreviewServerOptions = {}): http.Server {
  const distDir = options.distDir ? path.resolve(options.distDir) : path.resolve(process.cwd(), 'dist');

  const server = http.createServer(async (req, res) => {
    // 1. Terapkan Cache-Control no-store untuk local preview
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const rawUrl = req.url || '/';
    let urlPath: string;

    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      urlPath = decodeURIComponent(parsedUrl.pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('400 Bad Request: Malformed URI');
      return;
    }

    // 2. SECURITY GUARD: Path Traversal & Escape Check
    if (
      urlPath.includes('\0') ||
      rawUrl.includes('..') ||
      urlPath.includes('..') ||
      /%2e/i.test(rawUrl)
    ) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Path traversal prohibited');
      return;
    }

    // Dukung alias rute publik /blog dan /blog/[slug] untuk kompatibilitas preview
    let normalizedUrlPath = urlPath;
    if (normalizedUrlPath === '/blog' || normalizedUrlPath === '/blog/') {
      normalizedUrlPath = '/';
    } else if (normalizedUrlPath.startsWith('/blog/')) {
      normalizedUrlPath = normalizedUrlPath.slice('/blog'.length);
    }

    // Normalisasi path relatif terhadap dist
    const safeSubPath = path.normalize(normalizedUrlPath).replace(/^(\.\.[\/\\])+/, '');
    let targetPath = path.join(distDir, safeSubPath);

    // Pastikan path hasil resolve tetap berada di dalam distDir
    const relative = path.relative(distDir, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Access denied outside output directory');
      return;
    }

    try {
      let stat = await fs.stat(targetPath).catch(() => null);

      // Jika target adalah direktori (misal / atau /slug/), cari index.html di dalamnya
      if (stat && stat.isDirectory()) {
        const potentialIndex = path.join(targetPath, 'index.html');
        const indexStat = await fs.stat(potentialIndex).catch(() => null);
        if (indexStat && indexStat.isFile()) {
          targetPath = potentialIndex;
          stat = indexStat;
        }
      }

      // Jika target file langsung belum ketemu, coba append /index.html (misal request /slug tanpa slash penutup)
      if (!stat) {
        const potentialArticleIndex = path.join(targetPath, 'index.html');
        const articleIndexStat = await fs.stat(potentialArticleIndex).catch(() => null);
        if (articleIndexStat && articleIndexStat.isFile()) {
          targetPath = potentialArticleIndex;
          stat = articleIndexStat;
        }
      }

      // Jika tetap tidak ditemukan: 404
      if (!stat || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>404 Tidak Ditemukan | NexaMOS Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1f2937; padding: 2rem; border-radius: 8px; border: 1px solid #374151; max-width: 480px; text-align: center; }
    h1 { color: #f87171; margin-top: 0; font-size: 1.75rem; }
    p { color: #9ca3af; line-height: 1.5; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>404 — Halaman Tidak Ditemukan</h1>
    <p>File atau rute internal <code>${escapeHtml(urlPath)}</code> tidak ditemukan pada folder <code>dist/</code>.</p>
    <p><a href="/">&larr; Kembali ke Blog Index</a></p>
  </div>
</body>
</html>`);
        return;
      }

      // Tentukan MIME Type
      const ext = path.extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const content = await fs.readFile(targetPath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length
      });
      res.end(content);
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`500 Internal Server Error: ${err.message}`);
    }
  });

  return server;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Memulai server preview secara programatik (berguna untuk test runner)
 */
export async function startPreviewServer(options: PreviewServerOptions = {}): Promise<PreviewServerInstance> {
  const port = options.port !== undefined ? options.port : publicConfig.previewPort;
  const host = options.host || publicConfig.previewHost;
  const distDir = options.distDir ? path.resolve(options.distDir) : path.resolve(process.cwd(), 'dist');

  const server = createPreviewServer({ distDir, port, host });

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({
        server,
        port: actualPort,
        host,
        distDir,
        close: async () => {
          return new Promise<void>((resClose) => {
            server.close(() => resClose());
          });
        }
      });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

// Eksekusi jika dipanggil via CLI
if (process.argv[1] && (process.argv[1].endsWith('preview-blog.ts') || process.argv[1].endsWith('preview-blog.js'))) {
  const distPath = path.resolve(process.cwd(), 'dist');

  fs.stat(distPath)
    .then(() => {
      return startPreviewServer();
    })
    .then((instance) => {
      console.log('====================================================');
      console.log(`NexaMOS Blog Local Preview Server`);
      console.log(`Serving: ${instance.distDir}`);
      console.log(`URL:     http://${instance.host}:${instance.port}/`);
      console.log('Routing:');
      console.log('  /            -> dist/index.html (Blog Index)');
      console.log('  /[slug]      -> dist/[slug]/index.html (Article)');
      console.log('  /sitemap.xml -> dist/sitemap.xml');
      console.log('Cache:   no-store (instant refresh)');
      console.log('Tekan Ctrl+C untuk menghentikan server.');
      console.log('====================================================');
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        console.error('\n[ERROR] Direktori dist/ belum ada.');
        console.error('Jalankan build terlebih dahulu:');
        console.error('  npm run build');
        console.error('atau untuk development preview:');
        console.error('  npm run build:fixture\n');
      } else {
        console.error('\nGagal menjalankan preview server:', err.message);
      }
      process.exit(1);
    });
}
