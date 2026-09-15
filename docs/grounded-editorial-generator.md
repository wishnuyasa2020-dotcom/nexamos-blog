# Dokumentasi Teknis: Grounded Editorial Generator (Phase 3A)

> **Status:** Canonical Phase 3A Implementation  
> **Audience:** NexaMOS Engineering, Research Automation, & Editorial Agents  
> **Source of Truth:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md` & `NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md`

---

## 1. Boundary Fundamental: Research Engine vs Editorial Generator

NexaMOS Blog memisahkan tanggung jawab otoritas kebenaran dan ekspresi editorial secara tegas:

```text
RESEARCH ENGINE (Phase 2)
= Menentukan APA yang didukung oleh bukti empiris (Grounding Package).
  Memproduksi: ResearchBrief (Supported Claims, Verified Evidence, Source Index, Limitations).

EDITORIAL GENERATOR (Phase 3A)
= Menentukan BAGAIMANA pengetahuan dikomunikasikan secara berbobot, terstruktur, dan persuasif.
  Memproduksi: ArticleDraft (Sections, Claim Usages, Citation Map, Grounding Status).

EDITORIAL VALIDATOR (Downstream)
= Menentukan apakah naskah draft memenuhi ambang kelayakan terbit.
```

### Prinsip Keras Otoritas:
- **ResearchBrief adalah Satu-satunya Pijakan Faktual**: Generator dilarang mengarang fakta dari memori LLM, general web search mentah, atau asumsi sepihak.
- **No Claim without Grounding**: Setiap klaim faktual dalam draf wajib merujuk ke `claimId` yang sah di `ResearchBrief`. Klaim faktual baru yang tidak terverifikasi harus dikembalikan ke Research Engine (`RETURN_TO_RESEARCH`), bukan diselundupkan ke artikel.
- **Bukan Auto-Publish**: Phase 3A berhenti pada status `ArticleDraft` (tervalidasi `READY_FOR_EDITORIAL_REVIEW`), tidak mempublikasikan langsung ke CMS.

---

## 2. Taksonomi Bukti Kanonikal Tunggal (E0–E4)

Sistem NexaMOS **hanya mengakui satu taksonomi bukti kanonikal**:

| Level | Definisi | Cakupan Bukti |
| :--- | :--- | :--- |
| **`E0`** | Unsupported | Pernyataan tanpa bukti referensi terverifikasi. |
| **`E1`** | Common Knowledge | Definisi dasar industri, kamus, fakta umum yang tidak dipersengketakan. |
| **`E2`** | Secondary Evidence | Artikel industri, buku, laporan sintesis sekunder, atau data agregat industri. |
| **`E3`** | Primary / Authoritative | Dokumentasi platform resmi, paper akademik, dataset primer. |
| **`E4`** | NexaMOS Original Evidence | Data benchmark internal, eksperimen, observasi langsung proprietary NexaMOS. |

> [!IMPORTANT]
> **Larangan Taksonomi Ganda**: Istilah seperti `L2_STATISTICAL` yang sempat muncul dalam wacana awal dikonfirmasi sebagai *pseudo-taxonomy typo* untuk tingkat kanonikal `E2`. Sistem menolak taksonomi ganda. Jika ada konsep klasifikasi kebutuhan riset topik di masa mendatang, konsep tersebut wajib didefinisikan terpisah sebagai `ResearchRequirementLevel ≠ EvidenceLevel`.

---

## 3. Pipeline Generasi Artikel

```text
EditorialGenerationRequest (Topic + ResearchBrief + ArticleType + Role + Territory)
      ↓
Validasi Kesiapan ResearchBrief (readiness === 'READY_FOR_EDITORIAL')
      ↓
AI Editorial Planner (Merumuskan EditorialPlan terstruktur)
      ↓
Validasi Deterministik EditorialPlan (Thesis Rule & Struktur Seksi)
      ↓
AI Article Generator (Menulis teks draf per-seksi)
      ↓
Pelacakan Claim Usage & Penyusunan Citation Map
      ↓
Eksekusi Grounding Guard:
  ├─ Citation & Entity Integrity Guard
  ├─ Numerical Claim Guard
  ├─ Quote Guard
  ├─ Research Limitations Preservation Guard
  ├─ Counter-Evidence & Disputed Claims Guard
  └─ Information Gain / Commodity Risk Check
      ↓
Penetapan Status Draft (READY_FOR_EDITORIAL_REVIEW | GROUNDING_REVIEW_REQUIRED | REJECTED)
      ↓
EditorialGenerationResult
```

---

## 4. Struktur Seksi & Doktrin Tesis

### 4.1 Doktrin Tesis (Thesis Rule)
Artikel **wajib** memiliki tesis yang spesifik, berani, dan dapat diperdebatkan, kecuali untuk tipe:
- `GLOSSARY` (fokus pada kejelasan definisi)
- `REFERENCE` (fokus pada kelengkapan dan retrievability)

Untuk 9 tipe artikel lainnya (`ANALYSIS`, `ORIGINAL_RESEARCH`, `FRAMEWORK`, `CASE_STUDY`, `OPINION`, `COMPARATIVE_ANALYSIS`, `HOW_TO`, `TREND_ANALYSIS`, `EXPLAINER`), ketiadaan tesis akan langsung membatalkan rencana artikel (`THESIS_REQUIRED`).

### 4.2 Seksi Modular (`ArticleSectionPurpose`)
1. `HOOK`: Pintu masuk pemantik rasa ingin tahu dan signifikansi masalah.
2. `CONTEXT`: Latar belakang pasar atau dinamika industri.
3. `ARGUMENT`: Penjelasan tesis dan logika pendukung.
4. `EVIDENCE`: Pembuktian empiris berbasis sitasi data.
5. `FRAMEWORK`: Model mental atau arsitektur konseptual NexaMOS.
6. `ANALYSIS`: Pembedahan dinamika atau implikasi data.
7. `COUNTERPOINT`: Batasan, pandangan tandingan, atau sanggahan.
8. `IMPLICATION`: Dampak strategis bagi para pengambil keputusan.
9. `PRACTICAL_APPLICATION`: Panduan eksekusi langkah nyata.
10. `CONCLUSION`: Sintesis akhir penutup naskah.

---

## 5. Perilaku Berdasarkan 11 Article Types & 4 Editorial Roles

### 11 Canonical Article Types:
- **`EXPLAINER`**: Mengutamakan kejelasan konsep dan analogi intuitif.
- **`ANALYSIS`**: Mengutamakan kekuatan tesis, bukti empiris, dan interpretasi strategis.
- **`ORIGINAL_RESEARCH`**: Mengutamakan metodologi, transparansi data, dan pengungkapan limitasi.
- **`FRAMEWORK`**: Mengutamakan orisinalitas model, logika terstruktur, dan penerapan praktis.
- **`CASE_STUDY`**: Mengutamakan alur: Konteks ➔ Keputusan ➔ Eksekusi ➔ Hasil ➔ Pembelajaran.
- **`OPINION`**: Mengutamakan *point of view* yang kuat dan argumentasi yang kokoh.
- **`COMPARATIVE_ANALYSIS`**: Mengutamakan dimensi perbandingan objektif dan sintesis komparatif.
- **`HOW_TO`**: Mengutamakan urutan instruksi aksi yang sistematis dan teruji.
- **`TREND_ANALYSIS`**: Mengutamakan bukti mutakhir, pola pergeseran, dan implikasi ke depan.
- **`GLOSSARY`**: Mengutamakan definisi ringkas, presisi, dan diferensiasi konseptual.
- **`REFERENCE`**: Mengutamakan kelengkapan taksonomi dan kemudahan rujukan cepat.

### 4 Canonical Editorial Roles:
- **`FLAGSHIP`**: Kedalaman maksimal, information gain tertinggi, wajib menyertakan kerangka orisinal NexaMOS (`E3 + E4`).
- **`AUTHORITY`**: Tesis yang kokoh, interpretasi pakar, dan dukungan bukti terverifikasi (`E2/E3`).
- **`SUPPORTING`**: Kejelasan topik spesifik yang mendukung artikel induk (*cluster hub*).
- **`REFERENCE`**: Kelengkapan teknis dan akurasi struktural.

---

## 6. Guardrails Grounding & Anti-Halusinasi

### 6.1 Citation & Entity Integrity Guard
Setiap `claimId`, `sourceId`, dan `evidenceId` yang tercantum dalam `claimUsages` dan `citationMap` divalidasi silang secara ketat terhadap repositori `ResearchBrief`. Rujukan fiktif memicu kegagalan kritis (`CRITICAL`).

### 6.2 Numerical Claim Guard
Mendeteksi persentase (e.g. `85%`, `99.7%`), nilai kuantitas, atau angka statistik. Jika angka faktual muncul dalam narasi artikel tanpa ditopang bukti riset di `ResearchBrief`, sistem menolak atau menandainya sebagai `UNSUPPORTED_NUMERICAL_CLAIM`.

### 6.3 Quote Guard
Kutipan langsung di dalam tanda petik ganda (`"..."`) wajib memiliki rujukan bukti terverifikasi (`ResearchEvidence.quote`). Kutipan yang dikarang oleh model ditandai sebagai `UNSUPPORTED_QUOTE`.

### 6.4 Preservation of Limitations & Counter-Evidence
- Keterbatasan material (`limitations`) pada riset analitis tidak boleh disembunyikan. Draf wajib memiliki seksi atau paragraf yang mengakui batas metodologis.
- Klaim bersengketa (`disputedClaims`) dilarang disajikan sebagai fakta mutlak sepihak; draf wajib memuat perimbangan (*counterpoint*).

### 6.5 Information Gain & Commodity Draft Risk
Artikel yang hanya mengulang ringkasan pihak ketiga tanpa memuat sintesis orisinal, model logika, atau interpretasi khas NexaMOS ditandai dengan peringatan `COMMODITY_DRAFT_RISK`.

---

## 8. Kebijakan Isolasi Data Sintetis Uji Coba vs Data Produksi Nyata

> [!CAUTION]
> **Pencegahan Kebocoran Data Uji ke Produksi**:
> Seluruh contoh riset dan angka statistik yang digunakan dalam skenario verifikasi Phase 2D & Phase 3A (misalnya klaim *"retensi 85% dari studi 10.000 domain Search Benchmark Institute"*):
> 1. Merupakan **Synthetic Test Fixtures** yang dibuat khusus untuk menguji ketahanan pipeline, integritas sitasi, dan guardrails anti-halusinasi secara deterministik tanpa dependensi internet.
> 2. **DILARANG KERAS** dibocorkan, disalin, atau dipromosikan ke artikel live/production sebagai fakta nyata.
> 3. Artikel yang diterbitkan ke publik **hanya boleh** bersumber dari riset primer nyata (*original NexaMOS research* atau studi otoritatif riil pihak ketiga) yang telah diverifikasi oleh tim editorial dan melewati *Grounding Package* kanonikal.

---

## 9. Non-Goals Phase 3A

Komponen berikut secara sengaja berada di luar cakupan Phase 3A:
- Penilaian SEO & keyword density.
- Skor Google Discover & AI retrieval visibility.
- Pembuatan aset visual atau gambar.
- CMS deployment, penerbitan langsung, atau penyimpanan database produksi.
- Antarmuka pengguna (UI).
