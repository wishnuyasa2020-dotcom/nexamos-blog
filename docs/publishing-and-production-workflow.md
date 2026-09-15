# NexaMOS Blog — Publishing & Production Workflow (Phase 6)

## 1. Ringkasan Eksekutif & Tujuan

Phase 6 bertanggung jawab mengambil `PublicationCandidate` yang telah disetujui oleh **Phase 5D (Unified Distribution Readiness Gate)** dan mengubahnya secara deterministik menjadi paket publikasi terverifikasi (**PublicationPackage**), tervalidasi pra-terbang (**Preflight**), terdokumentasi versi (**Manifest & Content Hash**), dan siap saji di rute publik resmi:

```text
https://nexamos.cloud/             (Landing Page Utama — Tetap Vanilla Static, Bebas Regresi)
https://nexamos.cloud/blog         (Indeks Blog Otoritas)
https://nexamos.cloud/blog/[slug]  (Artikel Terbit)
```

---

## 2. Prinsip & Doktrin Fundamental

```text
VALIDATORS EVALUATE
UNIFIED GATE DECIDES
PUBLISHING WORKFLOW EXECUTES
```

1. **Pemisahan Status (Status Isolation)**:
   ```text
   Editorial Status (Phase 4)
   ≠
   Distribution Status (Phase 5D)
   ≠
   Publication Status (Phase 6)
   ```
   Ketiganya tidak boleh dicampuradukkan. Artikel lolos editorial dan distribusi baru menjadi kandidat; status publikasi dikelola oleh state machine tersendiri.

2. **Static-First & Low-JS Rendering**:
   Seluruh teks konten primer, heading semantis, kutipan, dan metadata hadir langsung di dalam dokumen HTML yang di-render di sisi server/generator. Pembaca dan mesin perayap (Googlebot, AI crawlers) tidak membutuhkan eksekusi JavaScript di peramban untuk membaca konten artikel secara utuh.

3. **Integritas Data Produksi (Anti-Fixture Leak)**:
   Data sintetis atau fixture pengujian (`isSyntheticTestData === true` atau `fixtureOnly === true`) dilarang keras memasuki alur produksi. Pelanggaran ini merupakan pemblokir absolut (`PRODUCTION_SYNTHETIC_DATA_BLOCKED`).

4. **Human Production Approval**:
   Setiap rilis ke mode `PRODUCTION` membutuhkan persetujuan manusia eksplisit (`approvedForProduction = true` dan identitas `approvedBy`). Mode default sistem pengujian otomatis adalah `PREVIEW`.

---

## 3. Siklus Hidup Publikasi (Publication Lifecycle)

```text
PUBLICATION_CANDIDATE (dari Phase 5D)
            ↓
        PACKAGING (PublicationPackageBuilder)
            ↓
        PREFLIGHT (PublicationPreflightValidator)
            ├── FAIL ──→ PREFLIGHT_FAILED ──→ ARCHIVED
            └── PASS / PASS_WITH_WARNINGS
                    ↓
            READY_FOR_RELEASE
                    │
            ┌───────┴────────┐
            ↓                ↓
        SCHEDULED    RELEASE_REQUESTED
            │                ↓
            └──────→ PUBLISH VIA PROVIDER (Preview / Production Approval)
                             ├── FAIL ──→ PUBLISH_FAILED
                             └── SUCCESS
                                     ↓
                                 PUBLISHED
                               (Manifest & Version Recorded)
                                     │
                             ┌───────┴───────┐
                             ↓               ↓
                        UNPUBLISHED       ARCHIVED
```

---

## 4. Arsitektur Dual-Workspace & Batas Tanggung Jawab Routing

### 4.1. Pemisahan Workspace (Workspace Boundary)

1. **Workspace A — Landing Page (Repository Terpisah)**:
   - Melayani `https://nexamos.cloud/` (root landing vanilla HTML/CSS/JS).
   - Mengelola `vercel.json` milik Landing Page.
   - Bertanggung jawab memasang HTTP rewrite dari `nexamos.cloud/blog/*` ke `BLOG_DEPLOYMENT_ORIGIN`.
   - Spesifikasi integrasi didefinisikan secara resmi di [`docs/landing-blog-integration-contract.md`](file:///c:/Users/wishn/Documents/nexamos/docs/landing-blog-integration-contract.md).

2. **Workspace B — NexaMOS Blog (Workspace Saat Ini)**:
   - Berisi engine penelitian, editorial, validator, gerbang distribusi, dan alur publikasi.
   - Melayani rute internal deployment Blog:
     - `/` $\rightarrow$ **Blog Index**
     - `/[slug]` $\rightarrow$ **Published Article**
   - Menghasilkan metadata kanonikal publik:
     - `https://nexamos.cloud/blog/[slug]`
   - **TIDAK** memiliki atau memodifikasi berkas landing page utama, dan **TIDAK** menjalankan proxy ke dirinya sendiri.

```text
PUBLIC DOMAIN (nexamos.cloud)
│
├── /                ──→ WORKSPACE A (Landing Page Vanilla — Tetap Utuh)
│
└── /blog/*          ──→ WORKSPACE A REWRITE (Proxy HTTP 200 tanpa URL redirect)
                             ↓
                         WORKSPACE B (NexaMOS Blog Deployment Origin)
                             ├── /        (Blog Index)
                             └── /[slug]  (Published Article)
```

### 4.2. Perbedaan Rute Internal vs Canonical Path Publik
- **`internalRoute`**: Jalur URL saat aplikasi blog dideploy secara mandiri (misal: `/arsitektur-informasi`).
- **`publicCanonicalPath`**: Jalur resmi di mata publik dan mesin pencari (misal: `/blog/arsitektur-informasi`).
- **`canonicalUrl`**: URL lengkap yang disematkan pada `<link rel="canonical">` dan Structured Data JSON-LD (`https://nexamos.cloud/blog/arsitektur-informasi`).

---

## 5. Pemeriksaan Preflight (Preflight Validator)

Sebelum naskah dapat diterbitkan, `PublicationPreflightValidator` menjalankan verifikasi terhadap:
1. **Integritas Fixture**: Memastikan tidak ada penanda data sintetis.
2. **Persetujuan Upstream**: Memastikan status editorial adalah `PASS` dan status gerbang distribusi bukan `BLOCKED`.
3. **Validitas & Keunikan Slug**: Format alphanumeric-hyphen dan bebas kolisi terhadap artikel terbit lainnya.
4. **Kelengkapan Konten**: Keberadaan tubuh artikel (`sections.length > 0`), judul, dek, dan atribusi penulis transparan.
5. **Konfigurasi Indexability**: Memastikan `robots.index !== false` pada paket produksi.
6. **Hero Image Discover**: Memverifikasi ketersediaan alt text dan rasio aspek visual.

---

## 6. Pelacakan Versi & Manifest Publikasi

Setiap artikel yang berhasil dipublikasikan menghasilkan `PublicationManifest`:
- `publicationId`: ID unik publikasi.
- `contentHash`: Hash SHA-256 stabil dari payload artikel publik (judul, deskripsi, seksi, sitasi).
- `packageVersion`: Versi paket rilis.
- `distributionPolicyVersion`: Versi kebijakan evaluasi distribusi (`UNIFIED_DISTRIBUTION_POLICY_V1`).
- Riwayat versi dicatat secara inkremental dalam `ArticlePublicationVersion` untuk mendukung audit, perbandingan analitik Phase 7, dan mekanisme rollback.
