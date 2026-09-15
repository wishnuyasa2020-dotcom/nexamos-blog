# NexaMOS Source Discovery & Research Acquisition Pipeline

> **Dokumen Arsitektur & Spesifikasi Teknis Phase 2C**  
> **Status:** Implementasi Kanonikal Phase 2C  
> **Sasaran:** Tim Engineering NexaMOS, Otomasi Riset, & Agent Editorial  
> **Sumber Kebenaran:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md`, `research-engine-and-evidence-grounding.md`, & `source-ingestion-and-evidence-extraction.md`

---

## 1. Pemisahan Kognitif & Alur Data Deterministik

Arsitektur riset NexaMOS secara tegas memisahkan empat tahapan independen tanpa pencampuran tanggung jawab:

```text
DISCOVERY  ≠  ACQUISITION  ≠  INGESTION  ≠  GROUNDING
```

| Lapisan | Masukan | Keluaran | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Discovery** | `ResearchQuestion` + `ResearchGap` | `DiscoveryQuery` ➔ `SourceCandidate[]` | Menemukan kandidat sumber potensial dari provider pencarian eksternal tanpa mengambil muatan penuh. |
| **Candidate Evaluation** | `SourceCandidate` | `CandidateEvaluationResult` (`ACCEPT` / `REJECT` / `REVIEW_REQUIRED`) | Menyaring kandidat berdasarkan otoritas, relevansi, kebaruan, dan risiko duplikasi awal. |
| **Acquisition** | `SourceCandidate` (ACCEPTED) | `RawSourceInput` | Mengambil materi mentah melalui protokol aman (HTTP/Mock) dengan guardrail SSRF ketat. |
| **Ingestion (Phase 2B)** | `RawSourceInput` | `NormalizedSourceDocument` + `ResearchEvidence[]` | Parsing format (HTML, MD, CSV, dll), normalisasi teks/tabel, dan ekstraksi kandidat bukti ber-provenance. |
| **Grounding (Phase 2A)** | `ResearchEvidence` + `ResearchClaim` | `ClaimGroundingResult` + `ResearchSynthesis` | Membuktikan kebenaran atau penolakan klaim dan mengevaluasi kecukupan bukti editorial. |

### Diagram Alur Data Menyeluruh

```text
RESEARCH QUESTION (Phase 2A)
       ↓
DISCOVERY QUERY BUILDER (Deterministic Templates, Counter-Evidence Support)
       ↓
RESEARCH DISCOVERY PROVIDER (Search Engine Adapters: Google, Bing, Academic, Mock)
       ↓
SOURCE CANDIDATES (Rank, Title, URL, Snippet, Publisher, Date)
       ↓
CANDIDATE EVALUATOR (Authority + Relevance + Volatility-Aware Freshness + Pre-Dedup)
       ↓
SOURCE ACQUISITION PROVIDER (HTTP GET / Mock with SSRF Security Guardrails)
       ↓
RAW SOURCE INPUT (Payload Mentah + MIME Mapping)
       ↓
PHASE 2B INGESTION SERVICE (Parsing, Sanitasi, Deduplikasi SHA-256, Ekstraksi Bukti)
       ↓
PERSISTED EVIDENCE & PROVENANCE (ResearchEvidenceRepository)
       ↓
PHASE 2A GROUNDING & SUFFICIENCY (Evaluasi Kecukupan E0–E4 & Sintesis Editorial)
```

---

## 2. Lapisan Discovery & Query Builder

### Intent Query Kanonikal
1. `FIND_PRIMARY_SOURCE`: Menargetkan dokumentasi resmi, lembaran regulasi pemerintah, atau paper primer.
2. `FIND_EMPIRICAL_EVIDENCE`: Menargetkan studi empiris dan data kuantitatif terukur.
3. `FIND_CURRENT_DATA`: Menargetkan laporan tolok ukur (*benchmark*) tahun berjalan.
4. `FIND_COUNTER_EVIDENCE`: Menargetkan sanggahan, kelemahan, kritik, atau pandangan berlawanan (*anti-bias*).
5. `FIND_DEFINITION`: Menargetkan definisi formal terminologi industri.
6. `FIND_LOCAL_CONTEXT`: Menargetkan data spesifik industri atau regulasi Indonesia.
7. `GENERAL_RESEARCH`: Menargetkan ikhtisar menyeluruh dan tantangan domain.

### Mekanisme Anti Bias Konfirmasi (Counter-Evidence Engine)
Apabila suatu klaim atau topik riset hanya didukung oleh bukti searah tanpa pandangan tandingan, sistem secara deterministik memunculkan `ResearchGap` berupa `MISSING_COUNTER_EVIDENCE`. Query builder kemudian menyusun query pembuktian tandingan dengan kata kunci kritis (`criticism`, `debunked`, `limitation`, `drawback`) untuk memastikan artikel NexaMOS tidak menjadi mesin pembenaran sepihak (*confirmation-bias machine*).

---

## 3. Evaluasi Kandidat Sumber

Sebelum dilakukan pengunduhan data berat, setiap kandidat sumber dievaluasi melalui matriks multi-dimensi:

### 1. Evaluasi Otoritas (`AuthorityEvaluator`)
Mengacu pada hierarki kanonikal `SOURCE_HIERARCHY_RANK`:
- **Peringkat 1 (Skor 95):** Dokumentasi resmi platform (`OFFICIAL_DOCUMENTATION`), regulasi pemerintah (`GOVERNMENT`, `REGULATOR`), eksperimen internal primer (`INTERNAL_DATA`, `INTERNAL_EXPERIMENT`).
- **Peringkat 2 (Skor 90):** Riset primer institusional (`PRIMARY_RESEARCH`), paper akademik peer-reviewed (`ACADEMIC_PAPER`), dataset publik terverifikasi (`DATASET`).
- **Peringkat 3 (Skor 80):** Laporan riset industri independen (`INDUSTRY_RESEARCH`).
- **Peringkat 4 (Skor 70):** Buku terbitan resmi (`BOOK`), analisis pakar terpercaya (`EXPERT_ANALYSIS`), publikasi resmi perusahaan (`COMPANY_PUBLICATION`).
- **Peringkat 5 (Skor 60):** Berita investigasi (`NEWS`), wawancara mendalam (`INTERVIEW`).
- **Peringkat 6 (Skor 40):** Diskusi komunitas industri (`COMMUNITY_DISCUSSION`).

Penyesuaian struktural: Domain TLD institusional (`.gov`, `.go.id`, `.edu`, `.ac.id`) serta kelengkapan metadata penerbit dan penulis memberikan bobot otoritas tambahan.

### 2. Evaluasi Kebaruan Berbasis Volatilitas (`FreshnessEvaluator`)
Sistem menolak masa kedaluwarsa universal tunggal. Penilaian usia dokumen mempertimbangkan volatilitas domain:
- **Volatilitas TINGGI (`HIGH`):** Dokumentasi fitur AI, pembaruan algoritma mesin pencari.
  - `<= 1 tahun`: `CURRENT`
  - `1–2 tahun`: `AGING`
  - `> 2 tahun`: `STALE` (memicu `REVIEW_REQUIRED` atau penolakan)
- **Volatilitas MENENGAH (`MEDIUM`):** Tren pemasaran digital umum, arsitektur web.
  - `<= 2 tahun`: `CURRENT`
  - `2–4 tahun`: `AGING`
  - `> 4 tahun`: `STALE`
- **Volatilitas RENDAH (`LOW`):** Teori dasar pemasaran, kerangka akademik klasik.
  - `<= 5 tahun`: `CURRENT`
  - `5–10 tahun`: `AGING`
  - `> 10 tahun`: `STALE`

---

## 4. Lapisan Akuisisi & Guardrail Keamanan SSRF

Pengambilan konten mentah dilakukan secara terisolasi oleh provider akuisisi.

### Proteksi SSRF (`SourceSecurityValidator`)
Sebelum permintaan jaringan dijalankan, URL target divalidasi dan ditolak secara mutlak jika:
- Menuju hostname lokal: `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`.
- Menuju metadata cloud internal: `169.254.169.254`, `metadata.google.internal`.
- Berada pada subnet IPv4 privat: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- Menggunakan protokol selain HTTP/HTTPS: `file://`, `ftp://`, `data:`, `javascript:`.

### Batas Operasional HTTP
- **Metode:** Eksklusif `GET`.
- **Timeout:** Standar 5.000 ms dengan pembatalan instan via `AbortController`.
- **Batas Ukuran Respons:** Maksimal 2 MB untuk mencegah serangan memory exhaustion.
- **Pemetaan MIME:**
  - `text/plain` ➔ `PLAIN_TEXT`
  - `text/markdown` ➔ `MARKDOWN`
  - `text/html` ➔ `HTML`
  - `application/json` ➔ `JSON`
  - `application/ld+json` ➔ `JSON_LD`
  - `text/csv` ➔ `CSV`
  - `application/pdf` (biner langsung) ➔ Ditolak dengan kode `PDF_BINARY_UNSUPPORTED` (teks PDF harus melalui ekstraksi teks sebelum di-ingest sebagai `PDF_TEXT`).

---

## 5. Batas Anggaran Riset & Kondisi Penghenti (*Stop Conditions*)

Untuk mencegah loop penelusuran tak terkendali (*infinite research loop*), `ResearchAcquisitionService` dipagari oleh `BudgetTracker`:

```ts
export interface ResearchBudgetPolicy {
  maxQueries: number;           // Batas jumlah query yang dieksekusi (default: 5)
  maxCandidatesPerQuery: number; // Batas kandidat yang diproses per query (default: 10)
  maxAcceptedSources: number;   // Batas sumber yang diterima (default: 10)
  maxAcquisitions: number;       // Batas unduhan konten mentah (default: 10)
}
```

### Kondisi Henti Otomatis:
1. **Evidence Sufficiency Tercapai:** Ketika evaluasi Phase 2A menyatakan bukti proyek telah mencapai status `SUFFICIENT`.
2. **Anggaran Habis (*Budget Exhausted*):** Ketika salah satu batas kuota (`maxQueries`, `maxAcceptedSources`, `maxAcquisitions`) tercapai.
3. **Penghentian Manual (*Human Stop*):** Permintaan intervensi editor untuk meninjau status `REVIEW_REQUIRED`.

---

## 6. Keragaman Sumber (*Source Diversity*)

`SourceDiversityChecker` mengaudit kandidat yang diakuisisi untuk mendeteksi:
- **Dominasi Penerbit Tunggal:** Memberikan peringatan apabila satu penerbit menguasai > 60% total sumber.
- **Ketiadaan Variasi Tipe:** Memberikan peringatan apabila seluruh sumber berasal dari satu tipe yang seragam.
- **Ketiadaan Sumber Primer:** Memberikan peringatan apabila tidak ada sumber primer atau dokumentasi resmi dalam kumpulan sumber.

---

## 7. Rantai Provenance Lengkap

Setiap unit data yang dihasilkan dalam pipeline dapat dilacak mundur secara presisi:

```text
ResearchEvidence.id
  ↳ Provenance: rawContentHash (SHA-256), locator (section/paragraph/table/page)
    ↳ ResearchSource.id
      ↳ SourceCandidate.id (URL, Provider, Discovery Timestamp)
        ↳ DiscoveryQuery.id (Intent, Query String)
          ↳ ResearchQuestion.id (Pertanyaan Riset Asal)
            ↳ Topic.id (Topik Editorial NexaMOS)
```

---

## 8. Batasan Arsitektur & Non-Goals (Phase 2C)

Untuk menjamin kepatuhan terhadap doktrin dasar NexaMOS:
- **Bukan Web Scraper / Crawler Tak Terbatas:** Tidak melakukan crawling rekursif atau penjelajahan situs bebas.
- **Bukan Headless Browser:** Tidak menggunakan Playwright, Puppeteer, atau eksekusi JavaScript sisi klien.
- **Bukan Mesin LLM Otomatis:** Pembuatan query dan evaluasi kandidat berjalan deterministik berbasis aturan dan template kanonikal.
- **Bukan Generator Konten:** Fase ini hanya bertanggung jawab mengumpulkan dan memvalidasi amunisi riset faktual.
