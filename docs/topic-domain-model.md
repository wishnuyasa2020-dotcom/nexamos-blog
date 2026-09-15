# NexaMOS Blog — Topic & Idea Domain Model (Phase 1A)

**Status:** Canonical Domain Specification  
**Version:** 1.0  
**Date:** 2026-09-14  
**Project:** NexaMOS Blog Editorial Operating System  

---

## 1. Definisi Topic

Di dalam sistem editorial NexaMOS, **Topic bukan sekadar keyword SEO**.

> **Topic** adalah candidate knowledge opportunity yang merepresentasikan problem, question, phenomenon, tension, atau subject yang berpotensi dikembangkan menjadi satu atau lebih editorial assets.

Topic berfungsi sebagai unit dasar penangkapan ide (*intake unit*), perumusan hipotesis (*hypothesis formulation*), dan perencanaan bukti (*evidence planning*) sebelum sumber daya dialokasikan untuk penulisan artikel.

---

## 2. Pemisahan Domain: Topic vs Article

Sistem NexaMOS secara tegas memisahkan domain **Topic** dari **Article**:

```text
TOPIC
  ≠
ARTICLE
```

- **Topic (Ruang Konsep & Peluang):** Berada di lapisan *Ideation & Knowledge Intake*. Menjawab pertanyaan: *"Mengapa masalah ini layak diteliti dan apa nilai kebaruan (information gain) yang ingin kita buktikan?"*
- **Article (Aset Editorial & Artefak Konten):** Berada di lapisan *Content & Publishing*. Merupakan hasil eksekusi fisik dalam bentuk naskah MDX terstruktur yang siap dikonsumsi pembaca dan diindeks oleh Search, Discover, dan AI.

---

## 3. Relasi Kardinalitas: Topic → Article

Hubungan antara Topic dan Article adalah **1 ke Banyak (1..N)**:

```text
1 Topic
  ↓ dapat melahirkan ↓
1..N Articles
```

### Contoh Kasus Nyata

**Topic:**
> *AI Mengubah Ekonomi Klik dan Perilaku Organic Search* (`top-2026-001-blog-ai-relevance`)

Dapat dieksekusi menjadi beberapa artikel dengan sudut pandang berbeda:

1. **Article 1 (Analysis):** *Apakah Aktivitas Blog Masih Relevan di Era AI?* (Fokus: Tinjauan makro bagi decision makers)
2. **Article 2 (Opinion / POV):** *Mengapa Traffic Bukan Lagi KPI Utama Blog di Era Zero-Click* (Fokus: Rekonfigurasi metrik marketing)
3. **Article 3 (Comparative Analysis):** *SEO vs Generative AI Visibility: Apa yang Sebenarnya Berubah?* (Fokus: Analisis teknis distribusi)

Oleh karena itu, schema `article.schema.json` memuat properti `topicId` sebagai *foreign/domain reference*.

---

## 4. Tiga Knowledge Territory NexaMOS

Setiap topik **wajib** diklasifikasikan ke dalam salah satu dari tiga territory pengetahuan kanonikal:

```text
INTELLIGENCE
STRATEGY
TACTICAL
```

| Territory | Pertanyaan Inti | Fokus Utama |
| :--- | :--- | :--- |
| **INTELLIGENCE** | *Apa yang sebenarnya sedang terjadi di pasar?* | Market intelligence, competitive intelligence, analisis sinyal, pendeteksian anomali/pola, riset data, pengukuran empiris, komputasi AI. |
| **STRATEGY** | *Pilihan apa yang harus dibuat untuk menang?* | Competitive strategy, category design, positioning, segmentasi & targeting, proposisi nilai, inovasi nilai, model bisnis, trade-off strategis. |
| **TACTICAL** | *Bagaimana pilihan strategi dieksekusi dan diukur?* | Akuisisi, penerbitan konten, optimasi SEO, distribusi media sosial, CRM, eksekusi penjualan, lifecycle, otomasi alur kerja, konversi, retensi. |

*Catatan:* Jika suatu topik memiliki irisan lintas domain (misal: eksekusi taktis blog yang mempengaruhi strategi positioning), topik tersebut diberi territory primer dan diberi catatan implikasi sekunder pada `evidencePlan.notes` atau `businessRelevance.notes`.

---

## 5. Topic Lifecycle (State Machine)

Alur hidup topik diatur melalui tahapan berurutan (*primary sequence*) beserta status alternatif (*alternate states*):

```text
CAPTURED
  ↓
SCREENING
  ↓
RESEARCH_REQUIRED
  ↓
QUALIFIED
  ↓
PRIORITIZED
  ↓
APPROVED
  ↓
IN_PRODUCTION
  ↓
PUBLISHED
```

### Status Alternatif
- **`ON_HOLD`:** Layak secara editorial, namun ditunda menunggu momentum atau ketersediaan bukti.
- **`REJECTED`:** Ditolak karena risiko komoditas tinggi, ketiadaan diferensiasi, atau di luar domain.
- **`ARCHIVED`:** Tidak lagi aktif, namun disimpan dalam basis data sebagai riwayat wawasan.

### Definisi Tiap Status

| Status | Makna Operasional |
| :--- | :--- |
| `CAPTURED` | Ide/sinyal baru masuk ke sistem (dari CRM, search demand, observasi) dan belum dianalisis. |
| `SCREENING` | Penilaian awal kelayakan, relevansi domain, dan risiko komoditas (*commodity risk screening*). |
| `RESEARCH_REQUIRED` | Ide menjanjikan tetapi bukti pendukung belum memadai; riset tambahan diinstruksikan. |
| `QUALIFIED` | Memenuhi syarat sebagai peluang editorial yang layak dikerjakan. |
| `PRIORITIZED` | Telah dinilai menggunakan dimensi prioritas terhadap antrean topik lainnya. |
| `APPROVED` | Disetujui oleh editor/human review untuk dialokasikan ke jadwal produksi. |
| `IN_PRODUCTION` | Brief telah dibuat dan artikel turunan sedang ditulis di folder kerja `/editorial-ops/production`. |
| `PUBLISHED` | Telah berhasil ditulis, divalidasi, dan terbit sebagai aset di `/content`. |

---

## 6. Information Gain & Anti-Commodity Architecture

Sesuai Doktrin NexaMOS, sistem **menolak memproduksi konten komoditas** (*commodity content* yang hanya merangkum apa yang sudah ada di internet). Setiap topik wajib merumuskan `informationGain`:

### Unsur Originality (`originalityType`)
Topik harus memiliki satu atau lebih elemen pembuktian berikut:
1. `ORIGINAL_RESEARCH`
2. `ORIGINAL_DATA`
3. `ORIGINAL_FRAMEWORK`
4. `EXPERT_INTERPRETATION`
5. `CASE_STUDY`
6. `FIRST_HAND_OBSERVATION`
7. `STRONG_POINT_OF_VIEW`
8. `CROSS_THEORY_SYNTHESIS`
9. `TIMELY_ANALYSIS`
10. `PRACTICAL_DECISION_FRAMEWORK`

### Tingkat Risiko Komoditas (`commodityRisk`)
- `LOW`: Sangat sulit direplikasi oleh AI generatif generik atau kompetitor.
- `MEDIUM`: Membutuhkan penguatan sudut pandang atau data pendukung.
- `HIGH`: Rentan menjadi konten generik; wajib dielevasi sebelum diloloskan ke `QUALIFIED`.
- `UNKNOWN`: Belum dievaluasi.

---

## 7. Evidence Plan & Standar Tingkat Bukti

Sebelum artikel ditulis, ketersediaan sumber data harus dipetakan dalam `evidencePlan`:

| Level | Kode | Kriteria Standar |
| :--- | :---: | :--- |
| **Unsupported** | `E0` | Tidak ada bukti pendukung (Ditolak untuk publikasi berbobot). |
| **Common Knowledge** | `E1` | Pengetahuan umum, terminologi dasar, atau definisi konvensional. |
| **Secondary Evidence** | `E2` | Laporan industri sekunder, artikel berita kredibel, kutipan buku. |
| **Primary / Authoritative** | `E3` | Dokumentasi resmi platform (e.g. Google Search Central), paper akademik, rilis regulator, dataset primer independen. |
| **NexaMOS Original** | `E4` | Data primer internal NexaMOS, survei kepemilikan, eksperimen langsung, atau framework teruji. |

Artikel unggulan (*flagship*) ditargetkan memiliki kombinasi minimal **E3 + E4**.

---

## 8. Priority Model (Scoring Dimensi)

Untuk menghindari penilaian subjektif sepihak (*opaque single score*), prioritas dievaluasi pada 5 dimensi (skala 0–100):

1. **`strategicValue` (0–100):** Keselarasan dengan arah doktrin dan pembentukan kategori NexaMOS.
2. **`audienceValue` (0–100):** Nilai utilitas, resonansi emosional, atau penyelesaian beban kerja audiens (*Job to be Done*).
3. **`timeliness` (0–100):** Urgensi momentum pasar, perubahan regulasi, atau tren saat ini.
4. **`evidenceReadiness` (0–100):** Kesiapan data, kemudahan verifikasi, dan kelengkapan bukti.
5. **`differentiationPotential` (0–100):** Seberapa kuat topik dapat membedakan NexaMOS dari kompetitor.
6. **`overall` (0–100, optional):** Skor komposit yang akan dihitung setelah formula pembobotan disahkan.

---

## 9. Contoh Lengkap Topic Canonical JSON

Berikut contoh nyata file [data/topics/example-blog-ai-relevance.json](file:///c:/Users/wishn/Documents/nexamos/data/topics/example-blog-ai-relevance.json) yang telah divalidasi terhadap [agent/schemas/topic.schema.json](file:///c:/Users/wishn/Documents/nexamos/agent/schemas/topic.schema.json):

```json
{
  "id": "top-2026-001-blog-ai-relevance",
  "title": "Apakah Aktivitas Blog Masih Relevan di Era AI?",
  "slug": "apakah-aktivitas-blog-masih-relevan-di-era-ai",
  "territory": "TACTICAL",
  "status": "QUALIFIED",
  "audience": {
    "segment": "B2B Marketers, CMOs, & Enterprise Content Strategists",
    "jobToBeDone": "Mengevaluasi alokasi investasi owned media di tengah pergeseran ekonomi klik organik akibat AI Search dan zero-click results.",
    "knowledgeLevel": "Advanced / Strategic Decision Makers"
  },
  "problem": "Maraknya pemanfaatan AI generatif dan ringkasan AI Search memicu spekulasi bahwa aktivitas blog telah mati, menyebabkan ketidakpastian dalam strategi investasi owned media dan content marketing.",
  "intent": {
    "primary": "Evaluasi relevansi blog dan strategi owned media di era generative AI",
    "secondary": [
      "Dampak Google AI Overview terhadap traffic organik dan CTR",
      "Perbedaan commodity content vs non-commodity knowledge",
      "Peran distribusi multi-surface (Search, Discover, AI Visibility, Direct)"
    ]
  },
  "thesis": "Aktivitas blog sebagai medium tidak mati; yang kehilangan daya adalah model blog berbasis produksi massal artikel informasional generik. Keunggulan kompetitif bergeser dari perebutan klik ke kepemilikan original knowledge, authority, dan hubungan langsung (first-party audience).",
  "whyNow": "Data industri 2025-2026 (Pew Research, Ahrefs, Similarweb, Google Central 2026) mengonfirmasi pergeseran perilaku pencarian dan ekonomi klik secara masif.",
  "informationGain": {
    "expectedContribution": "Sintesis mendalam yang mengawinkan data empiris zero-click dengan panduan resmi Google Search Central 2026, membedakan komoditisasi informasi dari produksi aset pengetahuan non-komoditas.",
    "originalityType": [
      "EXPERT_INTERPRETATION",
      "CROSS_THEORY_SYNTHESIS",
      "STRONG_POINT_OF_VIEW"
    ],
    "commodityRisk": "LOW"
  },
  "evidencePlan": {
    "requiredEvidenceLevel": "E3",
    "plannedSources": [
      "Google Search Central (2026): Optimizing your website for generative AI features on Google Search",
      "Pew Research Center (Juli 2025): Google users browsing activity & AI Summary CTR impact",
      "Ahrefs (Februari 2026): Study on 300,000 keywords correlating AI Overviews with position #1 CTR reduction (~58%)",
      "Similarweb (Mei 2026): 95% ChatGPT users overlap with Google Search",
      "Content Marketing Institute (2026): B2B Content Trends Report (32% owned media investment growth)"
    ],
    "originalEvidenceRequired": false,
    "notes": "Topik ini diklasifikasikan utama sebagai TACTICAL (eksekusi saluran penerbitan konten), namun memiliki catatan implikasi sekunder yang kuat terhadap STRATEGY (alokasi positioning brand di owned media vs rented audience)."
  },
  "businessRelevance": {
    "objective": "Thought Leadership & Category Authority",
    "funnelRole": "Top-to-Middle of Funnel (Edukasi problem kognitif menuju adopsi platform owned knowledge NexaMOS)",
    "notes": "Membuka diskursus bahwa AI harus dipakai sebagai production leverage, bukan content farm otomatis."
  },
  "recommendedArticleType": "ANALYSIS",
  "distributionTargets": [
    "GOOGLE_SEARCH",
    "GOOGLE_DISCOVER",
    "GOOGLE_AI",
    "EMAIL",
    "SOCIAL"
  ],
  "priority": {
    "strategicValue": 95,
    "audienceValue": 90,
    "timeliness": 92,
    "evidenceReadiness": 95,
    "differentiationPotential": 88,
    "overall": 92
  },
  "createdAt": "2026-09-14T00:00:00Z",
  "updatedAt": "2026-09-14T00:00:00Z"
}
```

---

## 10. Hal yang Belum Diimplementasikan (Pending Implementations)

Pada Phase 1A, batasan arsitektur dijaga ketat agar tidak membangun fitur prematur:

1. **Belum ada otomatisasi penghitungan `overall` Priority Score:** Bobot matematis komposit akan ditentukan setelah evaluasi bobot editorial teruji.
2. **Belum ada integrasi LLM / AI Classifier:** Contract interface [engines/ideation/topic-classifier.ts](file:///c:/Users/wishn/Documents/nexamos/engines/ideation/topic-classifier.ts) mengembalikan stub `NOT_IMPLEMENTED` secara *type-safe*.
3. **Belum ada penarikan sinyal otomatis (Automated Intake Scraper):** Contract [engines/ideation/topic-generator.ts](file:///c:/Users/wishn/Documents/nexamos/engines/ideation/topic-generator.ts) menyediakan struktur *TopicSignalSource*, namun belum terhubung ke API eksternal (Search Console, social listening, dll.).
4. **Belum ada Database Persisting Engine:** Penyimpanan saat ini berbasis flat JSON di `/data/topics/`.
5. **Belum ada Article Generation Logic:** Naskah artikel tetap ditulis secara manual atau terpandu oleh workflow editor di tahapan berikutnya.
