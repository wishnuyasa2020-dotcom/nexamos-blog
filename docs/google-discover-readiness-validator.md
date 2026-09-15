# NexaMOS Google Discover Readiness Validator

> **Dokumen Arsitektur & Spesifikasi Operasional — Phase 4B**  
> **Status:** Canonical & Terverifikasi Penuh  
> **Policy Version:** `DISCOVER_READINESS_POLICY_V1`  

---

## 1. Prinsip Fundamental & Batasan Epistemik

Validation Engine ini dibangun di atas doktrin batasan keras:

$$\mathbf{DISCOVER\ READINESS} \neq \mathbf{DISCOVER\ RANK\ PREDICTION}$$
$$\mathbf{DISCOVER\ ELIGIBILITY} \neq \mathbf{GUARANTEE\ OF\ APPEARANCE}$$

1. **Discover Readiness**: Menilai apakah naskah artikel, metadata, aset visual, dan konteks topik memiliki karakteristik substantif, teknis, visual, dan kebijakan yang memenuhi syarat untuk feed minat Google Discover.
2. **Discover Rank Prediction**: DILARANG KERAS membuat model prediksi peringkat, probabilitas palsu (misalnya *"87% kemungkinan masuk Discover"*), atau *Discover Rank Score*. Discover adalah sistem feed berbasis minat pengguna (*interest feed*), bukan SERP berbasis kueri penelusuran.
3. **Discover Eligibility**: Kelayakan dasar (misalnya terindeks, memiliki konten primer, mematuhi kebijakan konten) adalah syarat mutlak, namun **bukan jaminan penayangan**.

### Sorotan Google Discover 2026 Core Update:
- **Topical Expertise**: Discover memprioritaskan situs yang memiliki rekam jejak keahlian spesifik per topik (*topic-by-topic authority*), bukan situs agregator topik acak.
- **In-depth Content**: Discover memprioritaskan artikel berbobot, mendalam, dan bernilai orisinal tinggi dibanding artikel tipis (*shallow/commodity*).
- **Local Relevance**: Relevansi lokal (Indonesia) adalah sinyal peluang (*opportunity signal*), **BUKAN kewajiban mutlak** (`LOCAL != WAJIB`). Dilarang memaksakan sudut pandang lokal pada topik murni global.
- **Visual-first Feed**: Kartu Discover membutuhkan gambar lanskap beresolusi tinggi (lebar minimal 1200px, > 300.000 total piksel) dengan `max-image-preview:large` aktif.
- **Bebas Persyaratan Artifisial**: Google Discover **TIDAK memerlukan tag khusus Discover** dan **TIDAK memerlukan schema/structured data khusus Discover**.

---

## 2. Arsitektur Evaluasi 10 Dimensi

Google Discover Readiness Validator mengevaluasi artikel melintasi 10 dimensi terukur:

```text
               [EDITORIALLY APPROVED DRAFT]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 1. ELIGIBILITY      2. EDITORIAL CORE   3. FEED EXPERIENCE
 - Indexability      - Originality       - Title Integrity
 - Primary Content   - Depth             - Visual Assets
 - Policy Compliance - Timeliness        - Page Experience
                     - Interest Fit      - Local Relevance
                     - Topic Expertise
```

### 2.1 Matriks Bobot Dimensi (Total 100)

| Dimensi | Bobot | Fokus Penilaian |
| :--- | :---: | :--- |
| **ORIGINALITY** | 15 | Original research, novel framework, empirical evidence, first-hand observation, commodity risk guard. |
| **DEPTH** | 15 | Problem coverage, evidence depth, analysis, context, implications, limitations. (*Depth bukan word count*). |
| **TIMELINESS** | 10 | Freshness, volatility, whyNow. Konten lama tetap valid jika berguna (`OLD != AUTOMATIC FAIL`). |
| **TOPICAL_EXPERTISE** | 15 | Otoritas teritorial (`INTELLIGENCE`, `STRATEGY`, `TACTICAL`), kluster topik, isolasi topik (*isolated topic risk*). |
| **INTEREST_FIT** | 10 | Keselarasan dengan masalah audiens dan urgensi waktu tanpa mengarang status trending. |
| **TITLE_INTEGRITY** | 10 | Strong provocative hook diperbolehkan; formula clickbait murahan, curiosity gap hampa, dan manipulasi emosi ditolak. |
| **VISUAL_READINESS** | 15 | Lebar minimal 1200px, total piksel > 300.000, rasio lanskap (16:9), bukan logo generik, kepadatan teks rendah, `max-image-preview:large`. |
| **PAGE_EXPERIENCE** | 5 | Keramahan seluler, bebas interstitial invasif, HTTPS. Ketiadaan data empiris CWV menghasilkan `UNKNOWN`, bukan kelulusan palsu. |
| **LOCAL_RELEVANCE** | 2 | Sinyal peluang relevansi Indonesia tanpa memaksakan sudut pandang jika artikel murni global. |
| **POLICY_SAFETY** | 3 | Perlindungan mutlak dari konten terlarang dan transparansi kepengarangan/penerbit. |

---

## 3. Klasifikasi Kesiapan Discover

Hasil agregasi skor menghasilkan 5 tingkat klasifikasi:

1. **`STRONG` (90 – 100)**: Seluruh dimensi substantif, visual, judul, dan otoritas kluster berada pada tingkat optimal.
2. **`READY` (80 – 89)**: Artikel memenuhi standar tinggi Discover dengan sedikit catatan minor.
3. **`READY_WITH_WARNINGS` (70 – 79)**: Artikel layak namun memiliki area yang perlu ditingkatkan (misalnya visual belum lanskap atau keterikatan kluster masih berkembang).
4. **`REVISION_REQUIRED` (< 70)**: Artikel membutuhkan perbaikan substantif atau teknis sebelum siap bersaing di feed minat.
5. **`INELIGIBLE`**: Terdapat *critical blocking issue* (misalnya `CONTENT_NOT_INDEXABLE`, `MISSING_PRIMARY_CONTENT`, `DISCOVER_POLICY_INELIGIBLE`, atau `CRITICAL_TITLE_DECEPTION`). Skor numerik tidak berlaku jika status kelayakan dasar tidak terpenuhi.

---

## 4. Integritas Judul: Provocative Hook vs Clickbait

NexaMOS menegakkan doktrin editorial yang tegas:

$$\mathbf{STRONG\ PROVOCATIVE\ HOOK \neq CHEAP\ CLICKBAIT}$$

- **Judul yang Diterima (Strong Hook)**:  
  *"AI Tidak Membunuh Blog. Ia Membunuh Blog Generik."*  
  Meskipun tajam dan provokatif, judul ini memikat secara intelektual dan premisnya dibuktikan secara mendalam di dalam naskah.
- **Judul yang Ditolak (Cheap Clickbait)**:  
  *"Bikin Syok! Rahasia Gila Nomor 3 Ini yang Mereka Sembunyikan dari Kamu!!!"*  
  Menggunakan manipulasi rasa ingin tahu hampa (*curiosity gap*), sensasionalisme berlebihan, dan tanda seru beruntun.

---

## 5. Perutean Rekomendasi Lintas-Mesin (Cross-Engine Boundaries)

Validator Discover tidak memperbaiki naskah secara mandiri, melainkan mengarahkan tindakan perbaikan ke domain otoritas yang tepat:

| Jenis Masalah | Tindakan | Tujuan Lintas-Mesin |
| :--- | :--- | :--- |
| Judul clickbait / tidak sesuai isi | Koreksi judul dan keselarasan tesis | `EDITORIAL` |
| Orisinalitas rendah / konten dangkal | Tambah riset unik, framework, atau bukti | `EDITORIAL` |
| Aset visual absen / resolusi rendah | Buat atau ganti gambar lanskap 1200px | `VISUAL_DESIGN` |
| Topik terisolasi tanpa kluster | Bangun artikel pendukung dalam territory yang sama | `CONTENT_STRATEGY` |
| Keterindeksan (`noindex`) | Perbaiki direktif robots pada layer SEO | `SEO_TECHNICAL` |
| Pengalaman halaman belum terukur | Verifikasi performa seluler dan Core Web Vitals | `SEO_TECHNICAL` |

---

## 6. Model Data & Ekstensi Masa Depan

Kontrak `DiscoverPerformanceMetrics` disiapkan untuk menampung data integrasi Search Console Google Discover di masa mendatang:

```typescript
export interface DiscoverPerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  page: string;
  country: string;
  date: string;
  appearanceType?: 'STANDARD' | 'CHROME_NEW_TAB' | 'GOOGLE_APP' | 'SEARCH_GEN_AI';
}
```

*Catatan: Pada Phase 4B, kontrak ini murni berupa interface TypeScript tanpa live API client, sesuai batasan non-goals.*
