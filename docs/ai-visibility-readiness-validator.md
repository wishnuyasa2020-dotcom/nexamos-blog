# NexaMOS AI Visibility Readiness Validator

> **Dokumen Arsitektur & Spesifikasi Operasional — Phase 5C**  
> **Status:** Canonical & Terverifikasi Penuh  
> **Policy Version:** `AI_VISIBILITY_READINESS_POLICY_V1`  
> **Roadmap Context:**  
> - Phase 3 — AI Editorial Generator  
> - Phase 4 — Editorial Validator  
> - Phase 5A — SEO Validator  
> - Phase 5B — Google Discover Validator  
> - Phase 5C — AI Visibility Readiness Validator  

---

## 1. Prinsip Fundamental & Batasan Epistemik

Validation Engine ini dirancang untuk mengevaluasi apakah artikel editorial memiliki karakteristik teknis, konseptual, dan semantik yang prima untuk sistem penemuan AI generatif (*Generative AI Discovery*), dengan batasan epistemik mutlak:

$$\mathbf{AI\ VISIBILITY\ READINESS \neq AI\ CITATION\ GUARANTEE}$$
$$\mathbf{AI\ VISIBILITY\ VALIDATOR \neq SEARCH\ RANKING\ PREDICTOR}$$

1. **AI Visibility Readiness**: Menilai *kesiapan* (readiness) naskah artikel untuk proses perayapan, pemahaman semantik, grounding, dan visibilitas sitasi oleh mesin AI.
2. **Bukan Ramalan Ranking / Garansi Sitasi**: Validator **DILARANG KERAS** menggunakan istilah `AI RANKING SCORE`, `GEO RANK`, atau `LLM CITATION PROBABILITY`. Tidak ada sistem yang dapat menjamin model bahasa (LLM) atau mesin pencari AI akan benar-benar mengutip naskah tertentu.
3. **Fondasi SEO Tetap Relevan (*SEO Foundations Remain Relevant*)**:
   Bagi Google, sistem pencarian generatif (Google AI Overviews, AI Mode, dan fitur AI di Discover) beroperasi di atas fondasi indeks Google Search standar. Halaman harus:
   - Dapat dirayapi (*crawlable*).
   - Memenuhi syarat pengindeksan (*indexed & eligible for Search*).
   - Memiliki kelayakan cuplikan (*snippet eligibility* aktif, tanpa `nosnippet` atau `max-snippet:0`).
   - Menyajikan konten yang benar-benar bermanfaat (*useful*).
   - Mengutamakan pengetahuan non-komoditas (*non-commodity content*).
   - Memiliki kejelasan teknis dan pengalaman halaman yang stabil.
4. **Disiplin AEO / GEO**:
   Google secara resmi **tidak memperlakukan AEO (Answer Engine Optimization) atau GEO (Generative Engine Optimization) sebagai disiplin teknis terpisah yang menggantikan SEO**. Fondasi SEO yang kokoh, dipadukan dengan keaslian isi dan kejelasan struktur, adalah landasan utama visibilitas AI.

---

## 2. Formula Kesiapan AI Visibility

$$\mathbf{SEO\ FOUNDATIONS + NON\text{-}COMMODITY\ KNOWLEDGE + CLEAR\ ENTITIES + TRACEABLE\ CLAIMS + ACCESSIBLE\ CONTENT = AI\ VISIBILITY\ READINESS}$$

- **`SEO Foundations`**: Keterindeksan, canonical yang valid, dan bebas dari pembatasan perayapan.
- **`Non-Commodity Knowledge`**: Informasi yang menyajikan sintesis unik, riset primer, atau framework konseptual mandiri NexaMOS, bukan rangkuman pasif dari halaman web lain.
- **`Clear Entities`**: Penamaan entitas resmi, konsisten, dan bebas dari akronim tanpa definisi.
- **`Traceable Claims`**: Pernyataan analitis dan faktual yang terukur (*bounded*), tidak melebih-lebihkan kepastian, serta didukung rujukan yang dapat diverifikasi.
- **`Accessible Content`**: Teks utama disajikan langsung dalam markup awal tanpa terkunci interaksi atau paywall agresif.

---

## 3. Matriks 10 Dimensi Penilaian (`AI_VISIBILITY_READINESS_POLICY_V1`)

Total skor dihitung secara terbobot dalam rentang 0 hingga 100:

| No | Dimensi | Bobot | Validator | Fokus Pengujian Utama |
| :-: | :--- | :---: | :--- | :--- |
| 1 | **`GOOGLE_AI_ELIGIBILITY`** | 10 | [`GoogleAIEligibilityValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/google-ai-eligibility-validator.ts) | Keterindeksan (`robots.index`), crawlability, snippet eligibility, kontrol inklusi Search Console (`GenerativeAIInclusionStatus`), integritas canonical, dan ketersediaan konten primer. |
| 2 | **`RETRIEVAL_READINESS`** | 12 | [`RetrievalReadinessValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/retrieval-readiness-validator.ts) | Fokus topik per seksi, heading semantis deskriptif, dan alur pikir koheren manusiawi (`HUMAN COHERENCE → MACHINE RETRIEVABILITY`). Menolak pemecahan artifisial (*micro-chunking*). |
| 3 | **`ANSWERABILITY`** | 12 | [`AnswerabilityValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/answerability-validator.ts) | Menilai apakah artikel menyajikan jawaban terarah atas masalah/pertanyaan audiens, penjelasan terdefinisi, dan kesimpulan/implikasi praktis. Menolak format FAQ spam. |
| 4 | **`ENTITY_CLARITY`** | 10 | [`EntityClarityValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/entity-clarity-validator.ts) | Konsistensi penamaan entitas resmi ("Google AI Overviews", "CRM", "NexaMOS"), akronim terdefinisi, pencegahan ambiguitas istilah. |
| 5 | **`CLAIM_CLARITY`** | 10 | [`ClaimClarityValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/claim-clarity-validator.ts) | Batasan lingkup klaim (*bounded claims*), pencegahan pernyataan absolut berlebihan (*overclaimed statements*), dan presisi semantik. |
| 6 | **`CITATION_READINESS`** | 12 | [`CitationReadinessValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/citation-readiness-validator.ts) | Keterlacakan bukti pada seksi data/fakta terhadap referensi, URL publik, atau locator sumber primer. (*Citation readiness ≠ AI will cite this page*). |
| 7 | **`SOURCE_TRANSPARENCY`** | 8 | [`SourceTransparencyValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/source-transparency-validator.ts) | Transparansi identitas penulis (*author*), institusi penerbit (*publisher*), tanggal publikasi, dan riwayat pembaruan. |
| 8 | **`INFORMATION_GAIN`** | 16 | [`InformationGainValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/information-gain-validator.ts) | Bobot pengetahuan non-komoditas, framework konseptual mandiri NexaMOS, riset primer, dan sintesis lintas teori. |
| 9 | **`CONTENT_ACCESSIBILITY`** | 7 | [`ContentAccessibilityValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/content-accessibility-validator.ts) | Teks utama dapat diakses langsung tanpa paywall atau syarat klik interaksi; peninjauan risiko rendering sisi klien (`JS_RENDERING_REVIEW`). Framework-neutral. |
| 10 | **`MULTIMODAL_READINESS`** | 3 | [`MultimodalReadinessValidator`](file:///c:/Users/wishn/Documents/nexamos/engines/ai-visibility/multimodal-readiness-validator.ts) | Evaluasi diagram arsitektur penjelas, deskripsi alt kontekstual, dan metadata video (jika ada, tanpa mewajibkan video pada semua artikel). |

---

## 4. Search Generative AI Control (Search Console Inclusion)

Kontrak `GenerativeAIInclusionStatus`:
- `'INCLUDED'`: Halaman memenuhi syarat inklusi fitur AI Google.
- `'EXCLUDED'`: Pengelola situs mengecualikan direktori dari AI Overviews / AI Mode via kontrol Search Console.
- `'UNKNOWN'`: Pengaturan belum dideklarasikan (default netral).

> [!CRITICAL]
> Jika status inklusi disetel ke `'EXCLUDED'`, validator secara deterministik mengeluarkan status kelayakan Google AI: **`BLOCKED_BY_SITE_CONTROL`** dan mengklasifikasikan artikel sebagai **`BLOCKED`**. Validator hanya membaca metadata dan tidak mengubah pengaturan situs.

---

## 5. Anti-GEO-Hacks Guardrails

NexaMOS menegakkan larangan keras terhadap trik manipulatif format AI (GEO/AEO hacks):
1. **Dilarang Menuntut Special AI Schema**: Google tidak memiliki skema khusus AI (`AIOverview schema` atau `GEO schema`).
2. **Dilarang Menghukum Ketiadaan `llms.txt`**: Google secara resmi mengabaikan `llms.txt` untuk visibilitas penelusuran. Ketiadaan berkas ini tidak mengurangi skor.
3. **Dilarang Artificial Micro-Chunking**: Menulis semata-mata untuk potongan mesin (*write for chunks*) merusak keterbacaan manusia.
4. **Dilarang Prompt Variation Spam**: Membuat puluhan halaman per variasi prompt atau *exact long-tail prompt matching* dilarang keras.
5. **Dilarang Sitasi Palsu / Fake Mentions**: Mengarang kutipan atau konsensus pakar fiktif ditolak mutlak.

Setiap anjuran atau pola yang mengindikasikan praktik di atas ditandai dengan kode pelanggaran:
```text
AI_OPTIMIZATION_ABUSE_RISK
```

---

## 6. Profil Kesiapan Provider-Neutral

Untuk lingkungan retrieval non-Google (misal: ChatGPT Search, Perplexity, Claude tools), validator menyajikan profil `ProviderNeutralAIReadiness` tanpa mengasumsikan faktor peringkat tertutup:
```typescript
export interface ProviderNeutralAIReadiness {
  retrievability: 'HIGH' | 'MEDIUM' | 'LOW';
  answerability: 'STRONG' | 'ADEQUATE' | 'WEAK';
  entityClarity: 'HIGH' | 'MEDIUM' | 'LOW';
  claimTraceability: 'FULL' | 'PARTIAL' | 'UNSUPPORTED';
  sourceTransparency: 'TRANSPARENT' | 'NEEDS_IMPROVEMENT' | 'OPAQUE';
  informationGain: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

---

## 7. Klasifikasi & Hard Blocking Issues

- **`STRONG` (90 – 100)**: Seluruh dimensi substantif, keterlacakan, dan kelayakan teknis berada pada level prima.
- **`READY` (80 – 89)**: Memenuhi standar tinggi kesiapan AI dengan rekomendasi minor.
- **`READY_WITH_WARNINGS` (70 – 79)**: Layak dasar tetapi memiliki area peringatan (misal klaim perlu pembatasan lebih ketat).
- **`REVISION_REQUIRED` (< 70)**: Naskah memerlukan penguatan jawaban atau peningkatan orisinalitas.
- **`BLOCKED`**: Artikel terganjal oleh masalah kritis mutlak:
  - `GENERATIVE_AI_SITE_EXCLUDED`
  - `ARTICLE_NOT_INDEXABLE`
  - `PRIMARY_CONTENT_UNAVAILABLE`
  - `CRITICAL_CANONICAL_CONFLICT`
  - `CRITICAL_GROUNDING_FAILURE`

---

## 8. Kontrak Masa Depan Search Console Metrics

Pada Phase 5C, kontrak data untuk Search Console Generative AI telah disiapkan dalam bentuk interface TypeScript tanpa live API client (integrasi live API dijadwalkan pada Phase 7 — Analytics + Feedback Loop):
- `GenerativeAISearchPerformanceMetrics` (AI Overviews & AI Mode).
- `GenerativeAIDiscoverPerformanceMetrics` (Discover Generative AI features).
