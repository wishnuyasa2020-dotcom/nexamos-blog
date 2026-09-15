# Dokumentasi Teknis: Editorial Quality & Style Engine (Phase 3B)

> **Status:** Canonical Phase 3B Implementation  
> **Audience:** NexaMOS Editorial Automation, Reviewers, & Language Agents  
> **Source of Truth:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md` & `NexaMOS_Editorial_Style_Guide_v1.0.md`

---

## 1. Prinsip Fundamental: Grounding Correctness ≠ Editorial Quality

NexaMOS Blog menegaskan pemisahan konsep yang tegas:

```text
GROUNDING CORRECTNESS (Phase 3A)
= Menilai apakah setiap pernyataan faktual didukung bukti riset nyata yang terlacak.

EDITORIAL QUALITY & STYLE (Phase 3B)
= Menilai apakah komunikasi gagasan tersebut jernih, persuasif, koheren, padat informasi,
  selaras dengan tesis, dan bebas dari basa-basi klise AI.
```

### Aturan Emas Doktrin:
```text
GROUNDING > STYLE
```
- Revisi gaya penulisan **DILARANG MERUSAK ATAU MENGESKALASI FAKTA**:
  1. Angka persentase dan statistik tidak boleh diubah atau dibulatkan secara bebas.
  2. Kutipan langsung tidak boleh diubah kata-katanya.
  3. Makna atau kekuatan klaim tidak boleh dinaikkan (*no CLAIM_STRENGTH_ESCALATION*).
  4. Batasan metodologi riset (*limitations*) dan bukti tandingan (*counter-evidence*) tidak boleh dihilangkan demi memuluskan narasi.
- Jika peningkatan gaya membutuhkan kompromi substantif terhadap bukti, sistem wajib mengembalikan status draf ke:
  `RETURN_FOR_GROUNDING_REVIEW`.

---

## 2. Arsitektur Pipeline Editorial Terpadu

```text
Topic + ResearchBrief
         ↓
Phase 3A: Grounded Editorial Generator
         ↓
ArticleDraft (Status: READY_FOR_EDITORIAL_REVIEW)
         ↓
Phase 3B: Editorial Quality & Style Engine
  ├─ 1. Multi-Dimensional Quality Evaluation (10 Dimensi Doktrin)
  ├─ 2. EditorialReview & EDITORIAL_WRITING_SCORE
  ├─ 3. Surgical Revision Planner (Targetkan hanya seksi bermasalah)
  ├─ 4. AI Surgical Section Revision
  ├─ 5. Semantic Preservation Check (Cegah klaim absolut liar)
  └─ 6. Grounding Recheck (Jalankan ulang GroundingGuard Phase 3A)
         ↓
ArticleDraft (Status: EDITORIALLY_APPROVED_DRAFT)
         ↓
Downstream: Editorial Validator (Skor Publikasi Komprehensif)
```

---

## 3. 10 Dimensi Kualitas Penulisan & Ambang Skor

Setiap dimensi dievaluasi pada rentang `0–100`:

1. **`CLARITY`**: Kejernihan kalimat, ketiadaan kalimat berbelit (*run-on*), dan kejelasan subjek rujukan.
2. **`COHERENCE`**: Kelancaran urutan logis dari *Tesis ➔ Argumen ➔ Bukti ➔ Interpretasi ➔ Implikasi ➔ Kesimpulan*.
3. **`DEPTH`**: Kedalaman analisis dan keberanian mengungkap keterbatasan data.
4. **`THESIS_ALIGNMENT`**: Disiplin keterikatan tiap seksi terhadap tesis (`SUPPORTS`, `EXPLAINS`, `QUALIFIES`, `CHALLENGES`, `APPLIES`, `CONCLUDES`). Ketiadaan relasi ditandai `THESIS_DRIFT`.
5. **`INFORMATION_DENSITY`**: Rasio gagasan baru terhadap panjang teks. Seksi bertele-tele ditandai `LOW_INFORMATION_DENSITY`.
6. **`READER_USEFULNESS`**: Keberadaan implikasi nyata dan kerangka aksi praktis bagi pembaca.
7. **`STRUCTURE`**: Kualitas hook pemantik rasa ingin tahu dan heading semantik yang informatif.
8. **`ORIGINALITY`**: Ketiadaan pola repetitif model bahasa dan kehadiran kerangka orisinal NexaMOS.
9. **`TONE_CONSISTENCY`**: Keselarasan nada bicara terhadap *EditorialToneProfile* adaptif tipe artikel.
10. **`GROUNDING_PRESERVATION`**: Integritas sitasi dan preservasi tautan bukti selama proses penyuntingan.

### Kebijakan Ambang Batas (`EDITORIAL_WRITING_POLICY_V1`):
```text
90–100 = PASS (EXCELLENT)
80–89  = PASS
70–79  = REVISION_REQUIRED
<70    = MAJOR_REVISION / REJECT
```
*Catatan: Skor ini merupakan EDITORIAL_WRITING_SCORE dan bukan final publication score yang melibatkan metrik SEO/Discover.*

---

## 4. Revisi Bedah (Surgical Revision) & Proteksi Regresi

Sistem menghindari penulisan ulang seluruh naskah (*no full rewrite*) karena berisiko tinggi memunculkan halusinasi baru:
1. **Target Spesifik**: `RevisionPlanner` hanya menargetkan seksi yang memiliki catatan masalah (`sectionsToRevise`).
2. **Seksi Utuh Terlindungi**: Seksi yang tidak memiliki masalah dipertahankan 100% tanpa sentuhan.
3. **Pencegahan Regresi Grounding (`REVISION_GROUNDING_REGRESSION`)**:
   Jika hasil revisi seksi mengubah angka faktual (misal `85%` menjadi `95%`) atau menyuntikkan kutipan baru tanpa bukti, revisi ditolak seketika dan draf awal dipertahankan.
4. **Pencegahan Eskalasi Semantik (`CLAIM_STRENGTH_ESCALATION`)**:
   Jika hasil revisi mengubah nada temuan moderat menjadi kepastian mutlak yang berlebihan (e.g. *"membuktikan secara mutlak bahwa tanpa blog bisnis pasti hancur"*), revisi ditolak.

---

## 5. Deteksi Pola Gaya AI (`AI_STYLE_RISK`)

Sistem mendeteksi klise retorika yang lazim muncul pada draf generik:
- Pembukaan klise: *"Dalam era digital yang berkembang pesat ini..."*
- Frasa penanda meta berlebihan: *"Penting untuk dicatat bahwa..."*
- Kepastian verbal hampa: *"Tidak dapat dipungkiri bahwa..."*
- Penutup motivasional generik: *"Semoga artikel ini bermanfaat..."*

> [!NOTE]
> Label yang disematkan adalah **`AI_STYLE_RISK`** (evaluasi kualitas gaya penulisan), bukan vonis kepengarangan manusia vs mesin (*authorship verdict*). Teks manusia yang klise tetap akan ditandai jika menggunakan pola-pola tersebut.

---

## 6. Isolasi Data Sintetis (`SYNTHETIC_TEST_DATA`)

Seluruh fixture pengujian otomatis (seperti studi 10.000 domain dan retensi 85% dari Search Benchmark Institute):
- Diberi label kanonikal: `verificationStatus: 'SYNTHETIC_TEST_DATA'`.
- Diisolasi murni dalam modul pengujian unit/integrasi.
- Dilarang keras dipromosikan ke artikel live produksi sebagai fakta empiris nyata.

---

## 7. Non-Goals Phase 3B

Komponen berikut berada di luar cakupan Phase 3B:
- Optimasi keyword atau meta tag SEO.
- Penilaian Google Discover atau AI Visibility (Perplexity/ChatGPT retrieval).
- Generator gambar atau infografis.
- Publikasi langsung ke CMS atau penyimpanan database produksi.
