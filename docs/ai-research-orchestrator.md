# Dokumentasi Teknis: AI Research Orchestrator (Phase 2D)

## 1. Filosofi & Batasan Otoritas

NexaMOS Blog mengadopsi arsitektur pemisahan kognitif dan otoritas yang tegas:

```text
AI = REASONING / PLANNING LAYER (Advisory)
DETERMINISTIC ENGINES = AUTHORITY / VALIDATION LAYER (Control Plane)
```

Prinsip fundamental:
- **AI proposes**: AI merumuskan rencana riset, menyarankan query pencarian, mengidentifikasi kesenjangan bukti, mengusulkan klaim awal, dan membantu perumusan sudut pandang editorial (*editorial angle*).
- **Deterministic engines validate**: Mesin kanonikal memvalidasi apakah level bukti memenuhi syarat kebijakan topik, apakah query aman (bebas SSRF), apakah anggaran/kuota masih tersedia, dan apakah klaim benar-benar ter-grounding pada bukti nyata.
- **Repositories preserve evidence**: Seluruh sumber (`ResearchSource`), bukti (`ResearchEvidence`), dan klaim (`ResearchClaim`) disimpan di repositori dengan jejak provenance dan hash SHA-256 yang persisten.
- **Human retains final authority**: Manusia memegang kendali akhir jika ditemukan kontradiksi tajam yang belum terselesaikan, keterbatasan data, atau kebutuhan intervensi editorial.

### 1.1 Taksonomi Bukti Kanonikal Tunggal (E0–E4) vs Larangan Taksonomi Ganda
NexaMOS **hanya mengakui satu taksonomi bukti kanonikal** (`EvidenceLevel`):
- **E0 — Unsupported**: Tidak ada bukti pendukung.
- **E1 — Common Knowledge**: Pengetahuan umum atau definisi dasar industri.
- **E2 — Secondary Evidence**: Artikel industri, buku, rangkuman eksternal, atau laporan sekunder/data statistik industri.
- **E3 — Primary / Authoritative Evidence**: Dokumentasi resmi platform, paper akademik, riset otoritatif, dataset primer.
- **E4 — NexaMOS Original Evidence**: Data primer, benchmark internal, observasi langsung, eksperimen, atau framework orisinal NexaMOS.

> [!IMPORTANT]
> **Larangan Taksonomi Ganda**: Sistem dan seluruh agent dilarang menciptakan atau mengadopsi taksonomi sekunder (seperti `L1_ANECDOTAL`, `L2_STATISTICAL`, atau level berbasis tier LLM). Istilah informal seperti `L2_STATISTICAL` yang sempat muncul dalam draft wacana/laporan adalah rujukan salah sebut (*pseudo-taxonomy*) untuk **`E2` (Secondary Evidence)** dan **tidak diakui** oleh sistem kontrol NexaMOS.

---

## 2. Alur Kerja Orkestrasi (End-to-End Pipeline)

```text
Research Topic
      ↓
AI Research Planner (Advisory)
      ↓ (Deterministic Validation: evidence level, budget, questions)
Research Plan
      ↓
[Loop Iterasi Otonom]
  ├─ Phase 2C Discovery (Query Builder → Search Provider)
  ├─ Candidate Evaluator (Authority, Relevance, Freshness, Dedup)
  ├─ Source Acquisition & SSRF Guardrails
  ├─ Phase 2B Ingestion & Evidence Extraction
  ├─ AI Claim Proposal (Status Default: UNVERIFIED)
  ├─ Phase 2A Grounding Engine (Evaluasi relasi klaim ↔ bukti)
  ├─ Phase 2A Evidence Sufficiency Policy
  ├─ AI Gap Analysis (Canonical Gap Types Validation)
  └─ Next Action Selection & Hard Stop Check
      ↓
AI Synthesis Assistance
      ↓
ResearchBriefBuilder (Verifikasi Integritas Sitasi Repositori)
      ↓
ResearchBrief (READY_FOR_EDITORIAL | HUMAN_REVIEW_REQUIRED | NOT_READY)
```

---

## 3. Komponen Inti (`engines/research/orchestrator/`)

### 3.1 `ResearchPlanner`
- Mengajukan proposal rencana riset dari AI provider.
- Memvalidasi proposal terhadap kebijakan kanonikal topik:
  - Menolak jika daftar pertanyaan riset kosong (`RESEARCH_PLAN_REJECTED`).
  - Menolak jika level bukti yang diusulkan lebih rendah dari kebijakan topik (`EVIDENCE_LEVEL_RANK`).
  - Menolak jika batas iterasi tidak valid.

### 3.2 `ResearchGapAnalyzer`
- Mengombinasikan penalaran AI dengan guardrail deterministik:
  - **Validasi Tipe Gap Kanonikal**: AI hanya boleh menggunakan tipe gap kanonikal (`MISSING_PRIMARY_SOURCE`, `MISSING_CURRENT_DATA`, `MISSING_COUNTER_EVIDENCE`, `UNRESOLVED_CONTRADICTION`, dsb.). Usulan tipe arbitrer ditolak (`AI_OUTPUT_INVALID`).
  - **Confirmation Bias Guardrail**: Untuk klaim kausal (`CAUSAL`), komparatif (`COMPARATIVE`), atau peramalan (`FORECAST`), orchestrator memaksakan aksi `SEARCH_COUNTER_EVIDENCE` sebelum STOP.
  - **Freshness Guardrail**: Untuk topik ber-volatilitas tinggi (`HIGH`), data yang menua (*stale*) memaksakan aksi `SEARCH_CURRENT_DATA`.
  - **Primary Source Preference**: Menyarankan `SEARCH_PRIMARY_SOURCE` bila klaim kritis hanya didukung oleh sumber sekunder.

### 3.3 `ResearchBriefBuilder` & Integritas Sitasi
- Menyusun dokumen handoff kanonikal: `ResearchBrief`.
- **Integritas Sitasi Repositori**: Memverifikasi bahwa setiap `claimId`, `sourceId`, dan `evidenceId` benar-benar terdaftar di repositori. Rujukan fiktif/halusinasi langsung memicu error `CITATION_REFERENCE_INVALID`.
- **Kesiapan Deterministik**: Status `READY_FOR_EDITORIAL` hanya dapat aktif jika Phase 2A Evidence Sufficiency Policy secara deterministik menyatakan `SUFFICIENT`. AI tidak dapat memaksakan status ini.

### 3.4 `ResearchOrchestrator`
- Control plane utama yang mengoordinasikan siklus riset dan menegakkan **Hard Stop Rules**:
  1. `EvidenceSufficiency = SUFFICIENT` dan aksi `SYNTHESIZE` tercapai.
  2. `ResearchBudget exhausted` (kuota query atau akuisisi habis).
  3. `maxResearchIterations reached` (batas putaran riset tercapai).
  4. `humanStop = true` (intervensi penghentian manual).
  5. `requiresHumanReview = true` (kontradiksi tajam atau bukti lemah memicu `REQUEST_HUMAN_REVIEW`).

---

## 4. Batasan Boundary: Research Engine vs Editorial Generator

| Dimensi | Research Engine (Phase 2) | Editorial Generator (Phase 3) |
| :--- | :--- | :--- |
| **Domain** | Investigasi, pengumpulan bukti, verifikasi kebenaran | Penulisan artikel, narasi, struktur konten, tone-of-voice |
| **Input** | Topic, EvidencePlan, ResearchQuestions | **ResearchBrief** (Handoff Resmi) |
| **Akses Search Mentah** | Memiliki akses ke discovery & acquisition providers | **DILARANG** mengakses search mentah langsung tanpa grounding |
| **Otoritas Klaim** | Menguji dan memvalidasi grounding klaim | Menerjemahkan klaim `SUPPORTED` menjadi narasi artikel |
| **Output** | `ResearchBrief` terverifikasi | Draft Artikel Terstruktur |

Doktrin ketat: Phase 3 tidak diperbolehkan menulis artikel otoritas langsung dari hasil pencarian web mentah. Phase 3 wajib menerima `ResearchBrief` sebagai *grounding package* utama.

---

## 5. Audit Trail & Jejak Metadata

Setiap aktivitas orkestrasi dicatat ke dalam `ResearchEventRepository` dengan event kanonikal:
- `RESEARCH_PLAN_CREATED`
- `RESEARCH_ITERATION_STARTED`
- `AI_RESEARCH_PROPOSAL_CREATED`
- `RESEARCH_NEXT_ACTION_SELECTED`
- `RESEARCH_GAP_ANALYZED`
- `RESEARCH_STOPPED`
- `RESEARCH_BRIEF_CREATED`
- `HUMAN_REVIEW_REQUESTED`

Metadata teknis yang disimpan mencakup `orchestratorVersion`, `researchPolicyVersion`, nama provider AI, model, dan versi prompt, tanpa menyimpan *hidden chain-of-thought*.
