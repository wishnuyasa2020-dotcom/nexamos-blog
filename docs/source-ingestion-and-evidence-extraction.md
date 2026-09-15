# NexaMOS Source Ingestion & Evidence Extraction Pipeline

> **Phase 2B Technical Architecture & Specification Document**  
> **Status:** Canonical Phase 2B Implementation  
> **Audience:** NexaMOS Engineering, Research Automation, & Editorial Agents  
> **Source of Truth:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md`, `NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md`, & `research-engine-and-evidence-grounding.md`

---

## 1. Prinsip Fundamental & Alur Data Deterministik

Dalam arsitektur editorial NexaMOS, material riset mentah (*raw source payload*) diproses melalui pipeline deterministik bertahap tanpa melibatkan komputasi probabilistik (LLM/embeddings):

```text
RAW SOURCE INPUT
       ↓
  CONTENT PARSER (Format-specific: Text, MD, HTML, JSON, JSON-LD, CSV, PDF-Text)
       ↓
NORMALIZED SOURCE DOCUMENT (Sections, Tables, Locators, Content Hash)
       ↓
SOURCE DEDUPLICATOR (SHA-256 Content Hash + Metadata Signatures)
       ↓
RESEARCH SOURCE REPOSITORY (Persisted ResearchSource Entity)
       ↓
EVIDENCE EXTRACTOR (Statistics, Quotes, Definitions, Table Rows, Provenance)
       ↓
RESEARCH EVIDENCE REPOSITORY (Persisted Evidence Candidate Units)
       ↓
INGESTION RESULT & AUDIT TRAIL (Deterministic Result Model + Audit Events)
```

### Pemisahan Entitas Kognitif Ingestion

| Entitas | Definisi | Karakteristik Utama |
| :--- | :--- | :--- |
| **Raw Source Input** | Payload mentah dalam format asli teks materialisasi bersama metadata dasar pengiriman. | Belum divalidasi strukturnya, bisa mengandung format bervariasi (HTML, CSV, Markdown, dll). |
| **Normalized Document** | Dokumen berstruktur kanonikal (`NormalizedSection[]`, `NormalizedTable[]`, `locator`, metadata bersih). | Bersih dari tag styling/skrip, memiliki urutan terstruktur, dan content hash deterministik. |
| **Evidence Candidate** | Potongan teks, baris tabel, atau kutipan kandidat unit pembuktian yang diekstrak secara otomatis. | **Extraction ≠ Verification**. Kandidat bukti baru siap diperiksa dan dihubungkan ke Claim. |
| **Verified Evidence** | Evidence yang telah diverifikasi tingkat keabsahannya dan di-grounding ke Research Claim pada Phase 2A. | Memiliki relasi definitif `SUPPORTS`, `CONTRADICTS`, atau `CONTEXT` terhadap klaim riset. |

---

## 2. Format Sumber & Parsers Kanonikal

Pipeline Ingestion mendukung 7 adapter parser kanonikal melalui `ParserRegistry`:

| Format Kanonikal | Parser Class | Cakupan & Kemampuan Khusus |
| :--- | :--- | :--- |
| `PLAIN_TEXT` / `INTERNAL_NOTE` | `PlainTextParser` | Pemecahan paragraf bersih, pencatatan catatan internal tim riset, hash SHA-256. |
| `MARKDOWN` | `MarkdownParser` | Hierarki heading `# - ######`, blockquote kutipan eksplisit, tabel markdown ber-header. |
| `HTML` | `HtmlParser` | Sanitasi ketat (strip `<script>`, `<style>`), ekstraksi tag semantik (`<article>`, `<p>`, `<blockquote>`, `<table>`). |
| `JSON` | `JsonParser` | Parsing payload JSON generik dan konversi array record objek ke tabel ber-header. |
| `JSON_LD` | `JsonLdParser` | Ekstraksi entitas Schema.org (`NewsArticle`, `Article`, `BlogPosting`), headline, author, publisher, tanggal publikasi. |
| `CSV` / `TABULAR_DATA` | `CsvParser` | Deteksi otomatis delimiter (koma, titik koma, tab), penanganan field berkutip (`"..."`), ekstraksi tabel terstruktur. |
| `PDF_TEXT` | `PdfTextParser` | Penguraian teks hasil ekstraksi dokumen PDF dengan deteksi page marker (`--- Page X ---`, `[Page X]`, `\f`) dan penomoran halaman presisi pada `locator`. |

---

## 3. Strategi Deduplikasi Sumber

Deduplikasi dilakukan secara deterministik melalui `SourceDeduplicator`:

### 1. EXACT_DUPLICATE (Content Hash Match)
- Menggunakan SHA-256 content hash dari teks sumber yang dimaterialisasikan (`computeContentHash`).
- Jika hash telah ada dalam registry atau repositori, status ditetapkan sebagai `EXACT_DUPLICATE`.
- Secara default, sistem berlaku **idempoten**: mengembalikan sumber yang sudah ada tanpa menduplikasi record dan tanpa mengekstrak ulang bukti.
- Jika opsi `rejectDuplicates: true` disematkan, service mengembalikan error `DUPLICATE_SOURCE`.

### 2. LIKELY_DUPLICATE (Metadata Signature Match)
- Menggabungkan judul ternormalisasi (alphanumeric lowercase), URL referensi, dan tanggal publikasi:
  ```text
  signature = `${normalizedTitle}|${normalizedUrl}|${normalizedDate}`
  ```
- Jika metadata cocok namun konten memiliki variasi minor, sistem menandai sebagai `LIKELY_DUPLICATE` dan mencatat peringatan dalam audit trail.

---

## 4. Ekstraksi Kandidat Bukti & Provenance Tracking

`EvidenceExtractor` membedah `NormalizedSourceDocument` menjadi unit-unit bukti spesifik berdasarkan pola deterministik:

1. **STATISTIC:**  
   Pola angka terukur (e.g. `58%`, `39.8%`, `300,000 keywords`, `25% drop`, `41% of daily users`).
2. **QUOTE:**  
   Pola kutipan eksplisit yang diapit tanda kutip (`"..."`, `“...”`) atau format markdown blockquote (`> ...`).
3. **DEFINITION:**  
   Pola definisi terminologi formal (e.g. `adalah`, `merupakan`, `didefinisikan sebagai`, `is defined as`).
4. **TABLE_ROW:**  
   Setiap baris dari dataset tabel dimaterialisasikan menjadi satu unit bukti mandiri dengan format `Header: Nilai | Header: Nilai`, dilengkapi locator index tabel dan baris.
5. **TEXT:**  
   Paragraf naratif umum yang memberikan konteks temuan.

### Provenance Tracking Contract
Setiap `EvidenceCandidate` dan `ResearchEvidence` mempertahankan metadata pelacakan lengkap:
```json
{
  "provenance": {
    "sourceId": "src-similarweb-2024",
    "sectionId": "sec-2",
    "tableId": "tbl-1",
    "locator": {
      "table": "Search Engine Traffic Distribution",
      "paragraph": "Row 1",
      "page": null
    },
    "rawContentHash": "9b12e34f...64chars"
  }
}
```
Kontrak ini menjamin bahwa setiap klaim pada artikel final dapat diverifikasi mundur sampai ke baris tabel atau paragraf dokumen mentah pembuatnya.

---

## 5. Integrasi Audit Trail & Domain Events

Proses ingestion memicu event audit kanonikal pada `ResearchEventRepository`:

- `SOURCE_INGESTION_STARTED`: Dimulainya proses parsing payload mentah.
- `SOURCE_PARSED`: Keberhasilan parsing dengan metrik jumlah section & tabel yang terbentuk.
- `SOURCE_DUPLICATE_DETECTED`: Pencatatan deteksi duplikasi konten atau metadata.
- `SOURCE_INGESTED`: Keberhasilan penyimpanan entitas `ResearchSource` ke repository.
- `EVIDENCE_EXTRACTION_STARTED`: Dimulainya pemecahan dokumen menjadi kandidat bukti.
- `EVIDENCE_EXTRACTED`: Pencatatan jumlah kandidat bukti yang berhasil disimpan ke `ResearchEvidenceRepository`.

---

## 6. Non-Goals & Boundaries

Fase 2B secara tegas membatasi cakupan untuk menjaga kepatuhan doktrin arsitektur:
- **No Web Crawler / Scrapers:** Tidak ada scraping otomatis atau browser headless (Puppeteer/Playwright).
- **No External Network Calls:** Tidak ada ketergantungan ke API pihak ketiga (Google, OpenAI, Anthropic, dll).
- **No LLM Summarization:** Ekstraksi unit bukti dilakukan berbasis parser aturan deterministik, bukan inferensi AI.
- **No Article Generation:** Ingestion hanya bertugas menyiapkan amunisi bukti, bukan menyusun draf artikel.
