# NexaMOS Blog — Static Build & Local Preview Documentation

Dokumentasi arsitektur build, static file exporter, runtime tooling, dan local preview server untuk NexaMOS Blog (Production Pilot 01: Step 1–2).

---

## 1. Arsitektur Build & Export

Sistem publishing NexaMOS Blog beroperasi secara static-first dan native-first (tanpa framework runtime eksternal seperti Next.js, Vite, atau Express):

```text
PublicationPackage
        ↓
PublicationPreflightValidator (Hard safety blocks: Anti-Fixture leak, Slug uniqueness, Body checks)
        ↓
PublicationHtmlRenderer (Semantic HTML, SEO meta, Discover tags, JSON-LD structured data)
        ↓
StaticFileExporter (Atomic write, Clean output guard, Path traversal guard, Asset copy)
        ↓
dist/ (Direktori output fisik)
        ↓
Local Preview Server (Node native HTTP server, port 4173)
```

---

## 2. Perintah CLI (Commands)

| Perintah | Deskripsi | Mode Keamanan |
| :--- | :--- | :--- |
| `npm test` | Menjalankan seluruh test suite repositori (Phase 1–7 + Pilot 01 tests) | Menggunakan Node test runner native |
| `npm run build` | Membangun blog untuk mode **PRODUCTION**. Menolak keras data sintetis. Jika belum ada kandidat produksi nyata, mengekspor 0 artikel terbit secara bersih. | `PRODUCTION_SYNTHETIC_DATA_BLOCKED` aktif |
| `npm run build:fixture` | Membangun blog menggunakan fixture sintetis kanonikal (`blog-masih-relevan-di-era-ai`) untuk review visual lokal. | Bertanda `DEVELOPMENT_ONLY` |
| `npm run preview` | Menjalankan preview server HTTP lokal di `http://127.0.0.1:4173/` | Cache `no-store`, Path Traversal Guard aktif |

---

## 3. Struktur Output (`dist/`)

```text
dist/
├── index.html                          # Halaman Utama Blog Index
├── sitemap.xml                         # XML Sitemap publik resmi
├── assets/                             # Aset statis hasil salinan public/ (jika ada)
└── [slug]/
    └── index.html                      # Halaman Penuh Artikel
```

Contoh setelah `npm run build:fixture`:
```text
dist/
├── index.html
├── sitemap.xml
└── blog-masih-relevan-di-era-ai/
    └── index.html
```

---

## 4. Rute Internal vs Kanonikal Publik

Arsitektur NexaMOS Blog membedakan secara tegas antara routing fisik internal deployment dengan URL kanonikal publik:

| Domain | Rute Internal (Preview / dist) | Canonical URL (Markup HTML & Sitemap) |
| :--- | :--- | :--- |
| **Blog Index** | `/` (`dist/index.html`) | `https://nexamos.cloud/blog` |
| **Artikel** | `/[slug]` (`dist/[slug]/index.html`) | `https://nexamos.cloud/blog/[slug]` |

> [!IMPORTANT]
> Canonical URL di dalam markup HTML (`<link rel="canonical">`, Open Graph `og:url`, Schema.org `mainEntityOfPage`) dan entri `<loc>` di `sitemap.xml` **TIDAK PERNAH** menggunakan `localhost`, filesystem path, atau subdomain staging `.vercel.app`. Seluruhnya selalu merujuk ke kanonikal publik domain resmi `https://nexamos.cloud/blog/[slug]`.

---

## 5. Kebijakan Fixture & Keamanan Data Sintetis

- **Production Mode (`npm run build`)**:
  - Menegakkan pemeriksaan `PRODUCTION_SYNTHETIC_DATA_BLOCKED`.
  - Paket artikel yang memiliki flag `isSyntheticTestData: true` atau `fixtureOnly: true` akan langsung digugurkan oleh `PublicationPreflightValidator`.
  - Jika belum ada artikel produksi ril (karena Step 3: Real LLM Adapter belum berjalan), build tetap menghasilkan `dist/index.html` dan `dist/sitemap.xml` dengan status `0 published articles` tanpa menyuntikkan data palsu.
- **Fixture Mode (`npm run build:fixture`)**:
  - Dijalankan secara eksplisit oleh developer untuk menguji rendering artikel secara fisik dan visual.
  - Output bertanda `DEVELOPMENT_ONLY` dan menampilkan peringatan di konsol.

---

## 6. Keamanan Server Preview Lokal

Server preview lokal (`scripts/preview-blog.ts`) dibangun menggunakan `node:http` murni dengan proteksi keamanan:
1. **Path Traversal Guard**:
   - Memblokir `../`, `%2e%2e`, null-byte injection (`\0`), dan absolute path escape.
   - Mengembalikan status `403 Forbidden` atau `404 Not Found` bila ada request yang mencoba mengakses file di luar folder `dist/` (misalnya file konfigurasi rahasia atau `package.json` di root workspace).
2. **Cache Policy**:
   - Mengirimkan header `Cache-Control: no-store, no-cache, must-revalidate` sehingga setiap perubahan build dapat langsung dimuat ulang di browser tanpa browser cache lag.
3. **MIME Types**:
   - Mendukung `.html`, `.xml`, `.css`, `.js`, `.json`, `.svg`, `.png`, `.jpg`, `.webp`, `.ico`.

---

## 7. Jalur Integrasi Masa Depan (Vercel Deployment)

Pada tahapan pilot mendatang ketika blog siap dideploy ke Vercel:
- Workspace Blog ini akan dideploy sebagai project Vercel mandiri.
- Root `/` pada deployment blog akan melayani Blog Index.
- `/[slug]` akan melayani artikel.
- Workspace Landing Page (Workspace A) akan mengarahkan request `https://nexamos.cloud/blog` dan `https://nexamos.cloud/blog/:path*` melalui edge reverse-proxy / rewrite ke origin deployment blog ini tanpa browser redirect.
