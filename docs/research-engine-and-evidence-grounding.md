# NexaMOS Research Engine & Evidence Grounding

> **Phase 2A Technical Architecture & Specification Document**  
> **Status:** Canonical Phase 2A Implementation  
> **Audience:** NexaMOS Engineering, Research Automation, & Editorial Agents  
> **Source of Truth:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md` & `NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md`

---

## 1. Prinsip Fundamental: Pemisahan Entitas Kognitif

Dalam doktrin NexaMOS, riset editorial bukanlah kumpulan bookmark atau sekadar ringkasan artikel. Sistem memisahkan lima konsep secara kaku:

```text
SOURCE  ≠  EVIDENCE  ≠  CLAIM  ≠  FINDING  ≠  INTERPRETATION
```

| Konsep | Definisi | Contoh Konkret |
| :--- | :--- | :--- |
| **SOURCE** | Dokumen, laporan, paper, dataset, wawancara, atau materi primer/sekunder. | *Pew Research Center (Juli 2025) Study on 900 US Adults* |
| **EVIDENCE** | Unit informasi faktual, statistik, atau kutipan spesifik dari sumber yang dapat diacu (*locatable*). | *Traditional search result diklik pada 8% kunjungan saat ada AI Summary vs 15% tanpa AI Summary.* |
| **CLAIM** | Pernyataan faktual, kausal, komparatif, atau analitis yang hendak diuji kebenarannya. | *Keberadaan AI Overviews menurunkan rasio klik organik pada query informational.* |
| **FINDING** | Hasil/kesimpulan analitis yang diperoleh setelah evidence dianalisis dan dirumuskan. | *Ringkasan AI secara empiris mengikis ekonomi klik tradisional, mengubah nilai web dari impresi klik ke otoritas entitas.* |
| **INTERPRETATION** | Makna strategis, pelajaran, atau implikasi kebijakan bagi bisnis yang ditarik dari temuan. | *NexaMOS tidak boleh mengejar volume artikel klikbait; fokus bergeser ke owned knowledge dan hubungan langsung.* |

Prinsip Keras:
> **NO CLAIM WITHOUT TRACEABLE EVIDENCE.**  
> Seluruh klaim faktual pada artikel authority atau flagship wajib memiliki tautan bukti yang dapat dilacak balik ke sumber referensinya.

---

## 2. Canonical Evidence Levels (E0 — E4)

Level bukti menunjukkan **hierarki dan jenis kekuatan sumber**, bukan otomatis skor kebenaran mutlak:

- **E0 — Unsupported:** Pernyataan tanpa bukti referensi terverifikasi.
- **E1 — Common Knowledge:** Definisi dasar industri, kamus, fakta umum yang tidak dipersengketakan.
- **E2 — Secondary Evidence:** Buku industri, artikel analitis pihak ketiga, laporan sintesis sekunder, atau data agregat industri.
- **E3 — Primary / Authoritative Evidence:** Dokumentasi resmi platform (e.g. Google Search Central), paper akademik peer-reviewed, data telemetri primer (e.g. Similarweb, Pew Research).
- **E4 — NexaMOS Original Evidence:** Data benchmark internal, observasi implementasi klien, atau eksperimen langsung proprietary NexaMOS.

> **Catatan Doktrin (Larangan Taksonomi Ganda):**  
> Sistem NexaMOS secara ketat hanya mengadopsi taksonomi kanonikal **E0–E4**. Tidak ada tingkatan bukti terpisah berbasis label seperti `L1_ANECDOTAL` atau `L2_STATISTICAL`. Segala bentuk kebutuhan data statistik/empiris sekunder tercakup dalam tingkatan kanonikal **E2**.

---

## 3. Source Quality Assessment

Setiap sumber dievaluasi berdasarkan 6 dimensi independen (rentang nilai `0–100`):

1. **Authority (Otoritas):** Reputasi dan legitimasi penerbit/penulis dalam domain yang relevan.
2. **Relevance (Relevansi):** Seberapa spesifik sumber membahas domain permasalahan yang diteliti.
3. **Recency (Kebaruan):** Kesegaran data terhadap kondisi pasar dan teknologi terkini.
4. **Methodological Transparency (Transparansi Metodologi):** Kejelasan ukuran sampel, metode survei, dan keterbukaan bias.
5. **Independence (Independensi):** Bebas dari konflik kepentingan komersial langsung (e.g. vendor bias).
6. **Verifiability (Keterverifikasian):** Kemudahan data untuk diperiksa silang dari referensi eksternal.

Dilengkapi dengan `qualitySummary`: ringkasan faktual satu paragraf mengenai keabsahan sumber.

---

## 4. Claim Grounding Evaluator

Modul deterministik tanpa AI: `engines/research/claim-grounding-evaluator.ts`.

Mengevaluasi relasi klaim terhadap seluruh bukti yang terhubung (`SUPPORTS`, `CONTRADICTS`, `QUALIFIES`, `CONTEXTUALIZES`) dan menghasilkan status:

- **SUPPORTED:** Didukung oleh bukti kredibel (minimal E2-E3) tanpa kontradiksi kuat yang belum terselesaikan.
- **PARTIALLY_SUPPORTED:** Memiliki bukti pendukung tingkat dasar (E1), bukti berkekuatan lemah, atau memiliki kualifikasi pembatas.
- **CONTRADICTED:** Disangkal secara telak oleh bukti kuat.
- **DISPUTED:** Terdapat bukti kuat di kedua arah (bukti pendukung kuat vs bukti penyangkal kuat).
- **INSUFFICIENT_EVIDENCE:** Belum ada bukti yang memadai yang dihubungkan ke klaim.

---

## 5. Contradiction Handling & Persengketaan Data

Jika dua sumber terpercaya memberikan data yang bertentangan:
1. Sistem **TIDAK** memilih salah satu pihak secara sewenang-wenang.
2. Klaim diberi status `DISPUTED`.
3. Evaluasi kecukupan bukti ditandai `REVIEW_REQUIRED`.
4. Sistem mencatat `ResearchGap` bertipe `UNRESOLVED_CONTRADICTION`.
5. Dewan redaksi dan penulis diwajibkan menyajikan konteks perbedaan metodologis di naskah akhir, bukan menyembunyikan kontradiksi.

---

## 6. Evidence Sufficiency Policy

Modul: `engines/research/evidence-sufficiency.ts`.

Menentukan apakah sebuah `ResearchProject` telah siap secara empiris:
- **Level Check:** Apakah sumber referensi mencapai target `requiredEvidenceLevel` yang dipersyaratkan oleh Topic (misal E3)?
- **Critical Claims Grounding:** Apakah semua klaim penting bertaraf `CRITICAL` berstatus `SUPPORTED`?
- **Recency Risk:** Apakah ada sumber berisiko usang (`recencyRisk: HIGH`)?

Keluaran:
- `SUFFICIENT`: Memenuhi seluruh standar; siap masuk sintesis.
- `INSUFFICIENT`: Bukti kurang atau level tertinggi di bawah target (`missingEvidence[]` terinci).
- `REVIEW_REQUIRED`: Terdapat kontradiksi atau sengketa bukti pada klaim kritis.

---

## 7. Research Gaps

Model `ResearchGap` mengklasifikasikan kekurangan data yang harus dipenuhi:
- `MISSING_PRIMARY_SOURCE`
- `MISSING_CURRENT_DATA`
- `MISSING_COUNTER_EVIDENCE`
- `MISSING_LOCAL_CONTEXT`
- `MISSING_METHOD_DETAIL`
- `UNRESOLVED_CONTRADICTION`
- `INSUFFICIENT_SAMPLE`
- `OTHER`

---

## 8. Research Lifecycle (Finite State Machine)

```text
       ┌───────────┐
       │  PLANNED  │
       └─────┬─────┘
             │ startCollection()
             ▼
       ┌───────────┐
       │COLLECTING │◄──────┐
       └─────┬─────┘       │
             │ synthesize()│
             ▼             │
       ┌───────────┐       │
       │EVALUATING ├───────┤ (jika data kurang)
       └─────┬─────┘       │
             │             │
             ▼             │
       ┌─────────────┐     │
       │SYNTHESIZING ├─────┘
       └─────┬───────┘
             │ (jika SUFFICIENT)
             ▼
       ┌───────────┐
       │   READY   │
       └─────┬─────┘
             │ completeResearch()
             ▼
       ┌───────────┐
       │ COMPLETED │
       └─────┬─────┘
             │ archive()
             ▼
       ┌───────────┐
       │ ARCHIVED  │
       └───────────┘
```

Status alternatif: `BLOCKED` (dapat diaktifkan kembali ke `COLLECTING` atau `EVALUATING`).

---

## 9. Integrasi dengan Topic Lifecycle

Prinsip Kepemilikan Lifecycle:
> **Research Engine TIDAK memutasi status Topic secara sepihak.**

Ketika riset selesai dan berstatus `READY_FOR_EDITORIAL`:
1. Layanan riset mengekspos rekomendasi: `recommendedTopicAction = 'READY_FOR_REQUALIFICATION'` atau `'RESCREEN'`.
2. `TopicManagementService` tetap menjadi pemilik tunggal yang berhak menggerakkan status Topic dari `RESEARCH_REQUIRED` kembali ke `QUALIFIED` melalui verifikasi dewan editorial.

---

## 10. Proprietary Evidence (E4) & `publicationAllowed`

Pada level **E4 (NexaMOS Original Evidence)**:
- Bukti dapat bersumber dari telemetri klien internal, eksperimen internal, atau database kepemilikan.
- Lapangan `publicationAllowed: boolean` menandai apakah kutipan/data tersebut diizinkan untuk dipublikasikan langsung ke publik atau hanya boleh digunakan sebagai pemahaman latar belakang (*background synthesis only*).

---

## 11. Research Audit Trail

Setiap mutasi pada proyek riset dicatat dalam event store append-only dengan 12 event kanonikal:
1. `RESEARCH_PROJECT_CREATED`
2. `RESEARCH_STARTED`
3. `SOURCE_ADDED`
4. `EVIDENCE_CAPTURED`
5. `CLAIM_CREATED`
6. `CLAIM_EVALUATED`
7. `EVIDENCE_LINKED`
8. `FINDING_CREATED`
9. `SYNTHESIS_CREATED`
10. `RESEARCH_READY`
11. `RESEARCH_COMPLETED`
12. `RESEARCH_BLOCKED`

---

## 12. Non-Goals Phase 2A

Fase 2A **secara ketat TIDAK mencakup**:
- ❌ Integrasi API eksternal (OpenAI, Perplexity, Gemini, Claude).
- ❌ Web scraping otomatis / browser automation (Playwright/Puppeteer).
- ❌ Database production (Postgres, Prisma, Supabase).
- ❌ Generator teks artikel otomatis.
- ❌ UI dashboard analitik.
- ❌ SEO / Discover / AI visibility validators.
