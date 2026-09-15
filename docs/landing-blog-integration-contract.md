# Kontrak Integrasi Eksternal: Landing Page (Workspace A) & Blog (Workspace B)

Dokumen ini merupakan **kontrak integrasi resmi** yang diserahkan kepada tim pengelola **Workspace A (Landing Page)** untuk mengonfigurasi proksi rute publik blog di domain `https://nexamos.cloud/blog`.

---

## 1. Batas Tanggung Jawab & Arsitektur Sistem

```text
┌──────────────────────────────────────────────┐
│        WORKSPACE A — LANDING PAGE            │
│  - Repository terpisah                       │
│  - Melayani https://nexamos.cloud/ (Root)    │
│  - Mengelola vercel.json milik Landing       │
│  - Bertanggung jawab atas rewrite publik     │
└──────────────────────┬───────────────────────┘
                       │
       HTTP Rewrite (Proxy, Bukan Redirect)
       /blog          ──→  BLOG_DEPLOYMENT_ORIGIN/
       /blog/:path*   ──→  BLOG_DEPLOYMENT_ORIGIN/:path*
                       │
┌──────────────────────▼───────────────────────┐
│        WORKSPACE B — BLOG APPLICATION        │
│  - Repository saat ini                       │
│  - Engine penelitian, editorial, validator   │
│  - Melayani rute internal:                   │
│      /        ──→ Blog Index                 │
│      /[slug]  ──→ Published Article          │
│  - Menghasilkan canonical public metadata:   │
│      https://nexamos.cloud/blog/[slug]       │
└──────────────────────────────────────────────┘
```

**Aturan Batas**:
- Tim Workspace B (Blog) **tidak** memiliki akses dan **tidak** akan memodifikasi berkas konfigurasi atau source code Workspace A.
- Tim Workspace A (Landing) bertanggung jawab mengonfigurasi Vercel Rewrite pada domain `nexamos.cloud`.

---

## 2. Kebutuhan Konfigurasi di Workspace A (Landing)

### 2.1. Variabel Lingkungan / Origin Deployment Blog
Workspace A harus mengetahui origin deployment produksi dari aplikasi Blog:
```text
BLOG_DEPLOYMENT_ORIGIN
```
*Contoh nilai*: `https://nexamos-blog-production.vercel.app` (diberikan saat deployment mandiri Blog telah aktif).

### 2.2. Aturan Rewrite / Proxy Vercel
Tambahkan aturan rewrite berikut pada `vercel.json` di **Workspace A**:

```json
{
  "rewrites": [
    {
      "source": "/blog",
      "destination": "https://BLOG_DEPLOYMENT_ORIGIN/"
    },
    {
      "source": "/blog/:path*",
      "destination": "https://BLOG_DEPLOYMENT_ORIGIN/:path*"
    }
  ],
  "headers": [
    {
      "source": "/blog/:path*",
      "headers": [
        {
          "key": "X-Forwarded-Host",
          "value": "nexamos.cloud"
        },
        {
          "key": "X-Robots-Tag",
          "value": "index, follow, max-image-preview:large, max-snippet:-1"
        }
      ]
    }
  ]
}
```

---

## 3. Ketentuan Perilaku Publik yang Diwajibkan

1. **Rewrite, Bukan Redirect (HTTP 200)**:
   - Akses pengguna ke `https://nexamos.cloud/blog` dan `https://nexamos.cloud/blog/[slug]` **harus** tetap menampilkan URL `nexamos.cloud` di bilah peramban (address bar).
   - Dilarang keras melakukan HTTP 301/302 redirect ke domain origin internal Blog (`*.vercel.app`).
2. **Preservasi Root Landing Page (`/`)**:
   - Aturan rewrite di atas hanya menyasar `/blog` dan `/blog/:path*`.
   - Rute landing utama `https://nexamos.cloud/` tetap dilayani oleh static assets landing page asli tanpa terganggu.
3. **URL Kanonikal Publik**:
   - Seluruh artikel blog yang di-render oleh Workspace B sudah memuat tag kanonikal berformat:
     ```html
     <link rel="canonical" href="https://nexamos.cloud/blog/[slug]" />
     ```
   - Dengan demikian, sinyal SEO, Google Discover, dan AI Retrieval sepenuhnya terkonsolidasi pada domain utama `nexamos.cloud`.
4. **Sitemap**:
   - Sitemap blog tersedia secara internal di `BLOG_DEPLOYMENT_ORIGIN/sitemap.xml` dan dapat dipetakan di Workspace A sebagai `/blog/sitemap.xml` jika diperlukan:
     ```json
     {
       "source": "/blog/sitemap.xml",
       "destination": "https://BLOG_DEPLOYMENT_ORIGIN/sitemap.xml"
     }
     ```
