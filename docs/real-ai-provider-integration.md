# NexaMOS Blog — Real AI Provider Integration Documentation

Dokumentasi arsitektur adapter LLM nyata, konfigurasi lingkungan, kebijakan timeout/retry, validasi structured output, dan alur artikel pilot (Production Pilot 01: Step 3).

---

## 1. Arsitektur Adapter LLM

Sistem publishing NexaMOS Blog mengisolasi vendor AI pada infrastructure layer (`infrastructure/ai/`) tanpa mencemari domain core (Phase 1–7):

```text
DOMAIN LAYER:
  AIResearchProvider (engines/research/orchestrator/ai-research-provider.ts)
  AIEditorialProvider (engines/editorial/ai-editorial-provider.ts)
         ▲                               ▲
         │ (implements)                  │ (implements)
INFRASTRUCTURE LAYER:
  RealAIResearchProvider          RealAIEditorialProvider
         │                               │
         └───────────────┬───────────────┘
                         ▼
             StructuredOutputValidator (Runtime schema & Grounding Guard)
                         ▼
                   AIHttpClient (Native fetch, timeout, retry 429/5xx)
                         ▼
             EXTERNAL LLM API (OpenAI / OpenAI-Compatible)
```

Prinsip Utama:
- **Zero Core Domain Refactor**: Kontrak `AIResearchProvider` dan `AIEditorialProvider` dipertahankan 100%.
- **No SDK Lock-In**: Klien menggunakan modul bawaan Node.js (`fetch`, `AbortController`) tanpa package eksternal vendor.
- **Provider-Agnostic Endpoint**: Kompatibel dengan OpenAI (`https://api.openai.com/v1`) maupun endpoint mandiri seperti OpenRouter, DeepSeek, Ollama, dan vLLM.

---

## 2. Environment Variables

Daftar variabel lingkungan terpusat pada file `.env` (merujuk pada `.env.example`):

| Variabel | Tipe | Default | Deskripsi & Keamanan |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | String | `openai` | Pilihan provider (`openai` atau `openai-compatible`). |
| `AI_PROVIDER_API_KEY` | String (Secret) | *(Wajib diisi)* | Kunci rahasia API provider. **Wajib dilindungi, tidak pernah di-commit atau dicetak di log.** |
| `AI_PROVIDER_MODEL` | String | `gpt-4o-mini` | Nama model AI (misal `gpt-4o-mini`, `gpt-4o`, `deepseek-chat`). |
| `AI_PROVIDER_BASE_URL` | URL | `https://api.openai.com/v1` | Base URL endpoint Chat Completions API. |
| `AI_REQUEST_TIMEOUT_MS`| Integer | `60000` | Batas waktu timeout permintaan (dalam milidetik). |
| `AI_MAX_RETRIES` | Integer | `2` | Batas maksimum pengulangan untuk transient error. |

> [!CAUTION]
> File `.env`, `.env.local`, dan `.env.*.local` secara mutlak telah dimasukkan ke dalam `.gitignore` untuk mencegah kebocoran API key.

---

## 3. Kebijakan Timeout & Transient Retry

### Timeout Handling
- Menggunakan native `AbortController` yang terikat pada `AI_REQUEST_TIMEOUT_MS`.
- Jika waktu habis sebelum respon lengkap diterima, klien melempar error `AI_REQUEST_TIMEOUT`.

### Retry Policy
- **HANYA me-retry transient error**:
  - `HTTP 429` (Rate limit)
  - `HTTP 500, 502, 503, 504` (Internal/Gateway error)
  - Network failure (koneksi terputus sementara)
- **DILARANG me-retry**:
  - `HTTP 400` (Bad Request / invalid payload)
  - `HTTP 401` (Unauthorized / API key salah)
  - `HTTP 403` (Forbidden)
  - Respon JSON yang gagal divalidasi skema atau melanggar grounding
- **Backoff**: Bounded exponential backoff sederhana ($1\text{s} \times 2^{\text{attempt}-1}$, maks 5 detik).

---

## 4. Validasi Structured Output & Grounding Guard

Research dan Editorial tidak mengandalkan free-form text. Seluruh interaksi model mewajibkan format JSON terstruktur:

1. **Pembersihan Fencing**: Otomatis membersihkan blok kode markdown (````json ... ````).
2. **Parsing JSON**: Memastikan string respon adalah objek JSON yang sah.
3. **Validasi Skema Domain**:
   - `ResearchPlanProposal`: Wajib memiliki `objective` dan minimal satu `researchQuestions`.
   - `ProposedClaim`: Wajib memiliki `statement`, `claimType`, dan `importance`.
   - `EditorialPlan`: Wajib memiliki `workingTitle`, `thesis`, `angle`, dan `sectionPlan`.
   - `ArticleDraft`: Wajib memiliki `title`, `sections`, `claimUsages`, dan `citationMap`.
4. **Anti-Hallucination & Claim Traceability (Hard Rule)**:
   - Validator memeriksa `claimUsages` dan `citationMap`.
   - Jika model menghasilkan `claimId`, `sourceId`, atau `evidenceId` yang tidak terdaftar dalam `ResearchBrief`, permintaan ditolak keras dengan kode `AI_OUTPUT_INVALID` (`GROUNDING_VIOLATION`).

---

## 5. Mock vs Production (Anti-Silent Mock Fallback)

- **Test Mode**:
  - Seluruh unit & integration test repositori (`tests/`) berjalan 100% offline menggunakan mocked fetch atau in-memory mock providers (`MockAIResearchProvider`, `MockAIEditorialProvider`).
- **Production Mode**:
  - Menggunakan `RealAIResearchProvider` dan `RealAIEditorialProvider`.
  - Jika konfigurasi API belum lengkap di environment produksi, factory melempar error `AI_PROVIDER_NOT_CONFIGURED`.
  - **Sistem DILARANG KERAS diam-diam beralih ke Mock Provider di production.**

---

## 6. Perintah Eksekusi (CLI Commands)

### A. Live Smoke Test (`npm run ai:smoke`)
Menguji apakah credential API yang dikonfigurasi aktif dan mampu merespon payload JSON minimal:
```powershell
npm run ai:smoke
```
- Jika API key belum ada: Mencetak `Status: SKIPPED — PROVIDER NOT CONFIGURED` tanpa error exit.
- Jika API key ada: Mengirim tes ping, mencetak latensi dan validasi skema tanpa mencetak API key.

### B. Dry Run Pipeline Pilot (`npm run pilot -- --dry-run`)
Memverifikasi konfigurasi URL dan kesiapan pipeline tanpa memanggil API AI:
```powershell
npm run pilot -- --dry-run
```

### C. Eksekusi Pilot Nyata (`npm run pilot`)
Menjalankan alur integrasi artikel pilot end-to-end:
```text
Real URLs
   ↓
HttpSourceAcquisitionProvider
   ↓
Parser & Evidence Ingestion
   ↓
Real AI Research Provider
   ↓
ResearchBrief
   ↓
Real AI Editorial Provider
   ↓
ArticleDraft
   ↓
GroundingGuard
   ↓
content/drafts/pilot-article-draft.json (Menunggu review manusia)
```
*(Tidak melakukan publikasi otomatis).*
