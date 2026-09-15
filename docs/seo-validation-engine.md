# NexaMOS SEO Validation Engine

> **Dokumen Arsitektur & Spesifikasi Operasional — Phase 4A**  
> **Status:** Canonical & Terverifikasi Penuh  
> **Policy Version:** `SEO_VALIDATION_POLICY_V1`  

---

## 1. Prinsip Fundamental & Batasan Epistemik

Engine ini dibangun berdasarkan pemisahan batas kewenangan tiga pilar:

$$\mathbf{SEO\ Validation} \neq \mathbf{Editorial\ Writing} \neq \mathbf{Search\ Performance\ Prediction}$$

1. **SEO Validation**: Menilai *kelayakan distribusi teknis dan semantik* naskah artikel yang telah disetujui secara editorial sebelum diterbitkan ke Google Search.
2. **Editorial Writing**: Otoritas pembuktian, pembentukan argumen, pemilihan gaya bahasa, dan kedalaman intelektual tetap berada di Phase 3A dan Phase 3B. SEO engine **bukan editor tulisan** dan **bukan penentu kebenaran faktual**.
3. **Search Performance Prediction**: SEO Validation Engine menilai **readiness** (kesiapan), **bukan menjanjikan peringkat (*rank prediction*)**. Google Search adalah lingkungan dinamis dengan faktor kompetisi eksternal yang terus berubah; SEO validator menjamin artikel memiliki fondasi distribusi yang kokoh, sehat, dan bebas dari cacat teknis.

### Doktrin Inti:
$$\mathbf{EDITORIAL\ QUALITY > SEO\ MECHANICS}$$
- SEO validator **dilarang keras menurunkan kualitas artikel demi keyword**.
- Menolak praktik manipulatif kuno seperti *keyword stuffing*, penempatan paksa kata kunci *exact-match*, atau penyusunan formula heading yang artifisial.

---

## 2. Arsitektur Tiga Layer Evaluasi

SEO Validation Engine memeriksa naskah melalui 3 layer:

```text
               [EDITORIALLY APPROVED DRAFT]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  1. CONTENT SEO      2. ON-PAGE SEO     3. TECHNICAL READINESS
  - Search Intent     - Title Quality    - Internal Linking
  - Topic Focus       - Meta Description - Indexability
  - Content Quality & - Heading Hierarchy- Canonical Integrity
    Differentiation   - URL Slug         - Structured Data
                      - Image SEO
```

### 2.1 Content SEO Layer
- **Search Intent Alignment**: Mengevaluasi apakah artikel menjawab *problem intent* dan *reader task* dari topik. Tidak menyederhanakan intensi menjadi 4 kuadran statis (Informational/Navigational/Commercial/Transactional).
- **Topic Focus & Drift**: Memverifikasi kejelasan topik primer dan konsistensi naskah hingga kesimpulan tanpa menggunakan rasio *keyword density*.
- **Content Quality & Differentiation**: Membaca metrik editorial Phase 3A & 3B (`editorialWritingScore`, `informationGain`, `commodityRisk`) untuk memastikan artikel memiliki nilai tambah unik dan tidak menjadi komoditas generik (*commodity content*).

### 2.2 On-Page SEO Layer
- **Title Quality**: Mengevaluasi keterbacaan, kejelasan topik, janji pembaca (*reader promise*), panjang karakter (40–65 karakter optimal), risiko duplikasi, dan penolakan keras formula *cheap clickbait*.
- **Meta Description**: Memvalidasi deskripsi sebagai sarana presentasi cuplikan SERP (*search presentation*), bukan faktor peringkat langsung. Menolak *keyword stuffing* dan salinan persis dari judul.
- **Heading Structure**: Menjamin H1 tunggal yang semantik, hierarki bertingkat logis, dan ketiadaan judul subseksi generik klise yang berlebihan.
- **URL Slug**: Menjamin slug ringkas, mudah dibaca, stabil, huruf kecil (*lowercase*), dan melarang penggantian otomatis pada artikel yang sudah berstatus `PUBLISHED`.
- **Image SEO**: Memvalidasi teks alternatif (*alt text*) deskriptif, nama berkas yang bermakna, serta resolusi gambar utama (minimal 1200px untuk kesiapan rich snippet).

### 2.3 Technical Article Readiness Layer
- **Internal Linking**: Mengidentifikasi peluang penautan kontekstual menggunakan repositori artikel nyata tanpa membuat URL fiktif. Mencegah artikel terisolasi (*orphan risk*) dan melarang teks jangkar generik ("klik di sini").
- **Indexability**: Memeriksa direktif `robots` (`index`, `follow`) dan mencegah benturan konfigurasi.
- **Canonical Integrity**: Memvalidasi format URL kanonikal, kepatuhan domain yang sama (*same-site*), verifikasi *self-canonical*, dan mendeteksi perulangan (*canonical loop*).
- **Structured Data (JSON-LD)**: Memvalidasi schema `Article`, `BlogPosting`, `NewsArticle`, `BreadcrumbList`, `Person`, dan `Organization`. Menegakkan aturan mutlak anti-fabrikasi schema.

---

## 3. Kebijakan Penilaian: `SEO_VALIDATION_POLICY_V1`

### 3.1 Pembobotan 10 Dimensi (Skala 0–100)

| Dimensi | Bobot Maksimal | Deskripsi Evaluasi |
| :--- | :---: | :--- |
| **Intent Alignment** | 15 | Pemenuhan tugas pembaca (*reader task*) dan keselarasan masalah. |
| **Topic Clarity** | 15 | Kejelasan subjek utama dan ketiadaan deviasi gagasan (*topic drift*). |
| **Title Quality** | 10 | Judul informatif, relevan, proporsional, dan bebas clickbait. |
| **Metadata Quality** | 10 | Meta description yang jujur dan bebas dari *keyword stuffing*. |
| **Heading Structure** | 10 | Hierarki semantik bertingkat H1 -> H2 -> H3 tanpa heading kosong. |
| **Internal Linking** | 10 | Keterhubungan kluster pengetahuan dengan repositori artikel aktif. |
| **Indexability** | 10 | Direktif robot perayap yang sehat dan ketiadaan konflik indeks. |
| **Canonical Integrity**| 5 | URL kanonikal yang valid, absolut, dan bebas perulangan (*loop*). |
| **Structured Data** | 5 | Skema JSON-LD yang mencerminkan fakta tampak (*visible content*). |
| **Content Differentiation**| 10 | Nilai *information gain* nyata dan ketiadaan risiko artikel komoditas. |
| **TOTAL** | **100** | |

### 3.2 Klasifikasi Kesiapan Distribusi
- **`EXCELLENT` (90–100)**: Naskah memiliki kesiapan optimal untuk dirayapi dan disajikan di SERP.
- **`READY` (80–89)**: Naskah siap didistribusikan ke mesin pencari tanpa cacat teknis material.
- **`READY_WITH_WARNINGS` (70–79)**: Memiliki catatan minor (misal: peluang internal link belum dipasang atau deskripsi agak panjang).
- **`REVISION_REQUIRED` (< 70)**: Memerlukan perbaikan metadata atau penataan heading sebelum terbit.
- **`BLOCKED`**: Artikel diblokir dari rilis pencarian karena pelanggaran teknis kritis, terlepas dari skor numeriknya.

### 3.3 Kesalahan Kritis Pemblokir (`BLOCKED`)
Status `BLOCKED` otomatis dipicu bila ditemukan salah satu dari 5 kondisi fatal berikut:
1. `NOINDEX_ON_PUBLISHED_ARTICLE`: Artikel berstatus `PUBLISHED` namun ditandai `noindex`.
2. `INVALID_CANONICAL`: Format URL kanonikal rusak atau bukan URL absolut yang sah.
3. `CANONICAL_LOOP`: Path URL kanonikal tidak cocok dengan slug artikel atau mengarah pada siklus perulangan.
4. `STRUCTURED_DATA_FABRICATION`: Menyuntikkan entitas/klaim fiktif (misal: *aggregateRating* palsu) ke dalam JSON-LD.
5. `MISSING_PRIMARY_ARTICLE_CONTENT`: Badan naskah artikel kosong (halaman kosong / *soft 404*).

---

## 4. Sistem Rekomendasi Aman (*Safe SEO Recommendations*)

Rekomendasi yang dihasilkan dikategorikan menjadi 5 tipe tindakan aman:
- `TECHNICAL_FIX`: Koreksi robots directives, URL kanonikal, atau karakter slug.
- `METADATA_IMPROVEMENT`: Optimasi ringkasan meta deskripsi atau judul alternatif.
- `CONTENT_CLARIFICATION`: Penegasan fokus topik primer pada pembuka atau penutup.
- `INTERNAL_LINK_OPPORTUNITY`: Saran penautan ke artikel terdaftar di repositori.
- `STRUCTURED_DATA_FIX`: Penyesuaian skema JSON-LD agar selaras dengan isi nyata naskah.

### Aturan Eskalasi: `RETURN_TO_EDITORIAL`
SEO validator **tidak boleh** melakukan perubahan makna fakta atau menulis ulang argumen. Jika rekomendasi membutuhkan perbaikan konseptual atau rekonstruksi tesis, sistem menandai:
```typescript
requiresEditorialReturn: true
```
dan mengembalikan naskah ke tim editorial (Phase 3B).

---

## 5. Batasan Non-Goals

Komponen-komponen berikut **sengaja berada di luar ruang lingkup Phase 4A**:
- Google Discover Scoring (dialokasikan ke Phase 4B: Discover Validator).
- Generative AI Visibility Scoring (dialokasikan ke Phase 4C: AI Visibility Engine).
- Integrasi Google Search Console API langsung.
- Integrasi Keyword Volume / Keyword Difficulty API eksternal.
- SERP Scraping & Rank Tracking langsung.
- CMS Auto-Publishing (WordPress, Ghost, Webflow).
- Koneksi basis data relasional produksi.
