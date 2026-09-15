# Production Pilot 01 — Gemini Provider Activation

Dokumentasi aktivasi provider **Gemini** (Google AI API) sebagai provider default untuk **NexaMOS Blog Production Pilot 01**.

---

## 1. Arsitektur Integrasi

Sistem mengintegrasikan Gemini melalui antarmuka **OpenAI-compatible Chat Completions endpoint** native yang disediakan oleh Google Generative AI API:

```text
AI_PROVIDER=gemini
AI_PROVIDER_MODEL=gemini-3.8-flash
AI_PROVIDER_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

Endpoint HTTP yang ditargetkan secara deterministik oleh `AIHttpClient`:
```text
POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
Headers:
  Authorization: Bearer <AI_PROVIDER_API_KEY>
  Content-Type: application/json
Body:
  {
    "model": "gemini-3.8-flash",
    "messages": [...],
    "response_format": { "type": "json_object" }
  }
```

### Keuntungan Desain
1. **Zero Vendor SDK Lock-in**: Tidak membutuhkan package `@google/genai` atau library eksternal. Sepenuhnya menggunakan Node.js `fetch` dan `AbortController` native.
2. **Domain Model Tidak Berubah**: `AIResearchProvider` dan `AIEditorialProvider` mempertahankan antarmuka kanonikal Phase 1–7.
3. **Validasi Skema Tetap Ketat**: Output JSON Gemini tetap diverifikasi oleh `StructuredOutputValidator` dan `GroundingGuard`. Halusinasi `claimId` atau `citationId` di luar `ResearchBrief` ditolak dengan `AI_OUTPUT_INVALID`.

---

## 2. Pengelolaan Kredensial & File Lingkungan Lokal

File rahasia pengguna disimpan di:
```text
.env.local
```

File `.gitignore` menjamin file rahasia tidak pernah terkomit ke repositori:
```gitignore
.env
.env.local
.env.*.local
!.env.example
```

Contoh konfigurasi di `.env.local`:
```env
AI_PROVIDER=gemini
AI_PROVIDER_API_KEY=AIzaSy... (API Key Gemini Anda)
AI_PROVIDER_MODEL=gemini-3.8-flash
AI_PROVIDER_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
```

### Mekanisme Pemuatan Lingkungan (Dual-Layer Loading)
1. **Node Native Flag**: Scripts `package.json` (`ai:smoke` dan `pilot`) menggunakan:
   ```bash
   node --env-file-if-exists=.env --env-file-if-exists=.env.local ...
   ```
2. **In-Process Fallback Loader**: `ensureEnvLoaded()` pada `infrastructure/ai/ai-provider-config.ts` memuat `.env` dan `.env.local` secara native jika proses dijalankan di luar npm script.

---

## 3. Perintah Verifikasi & Smoke Test

### Live Smoke Test
Jalankan uji konektivitas live minimal (prompt ping $\rightarrow$ pong JSON):
```bash
npm run ai:smoke
```

- **Ketika API Key Belum Dikonfigurasi**:
  ```text
  Provider:       Gemini
  Model:          gemini-3.8-flash
  Base URL:       https://generativelanguage.googleapis.com/v1beta/openai
  Authentication: not configured (API key missing or placeholder)

  Status:         SMOKE TEST: WAITING_FOR_LOCAL_CREDENTIAL
  Catatan:        AI_PROVIDER_API_KEY belum disetel di .env atau .env.local.
  ```
  *(Keluar dengan exit code 0 tanpa memblokir CI/CD).*

- **Ketika API Key Valid Terpasang di `.env.local`**:
  ```text
  Provider:       Gemini
  Model:          gemini-3.8-flash
  Base URL:       https://generativelanguage.googleapis.com/v1beta/openai
  Authentication: configured
  Endpoint:       reachable (650ms)
  Structured output: valid
  Status:         PASS
  ```

### Pilot Runner Dry-Run
Memvalidasi skema topik, URL sumber primer, dan kesiapan adapter tanpa melakukan pemanggilan API berbayar:
```bash
npm run pilot -- --dry-run
```

---

## 4. Hard Safety & Aturan Anti-Fallback

1. **Anti-Silent Mock**: Di lingkungan produksi, jika `AI_PROVIDER_API_KEY` tidak tersedia atau bernilai placeholder, `AIProviderFactory` melempar error keras `AI_PROVIDER_NOT_CONFIGURED` dan **menolak keras fallback diam-diam ke Mock Provider atau OpenAI**.
2. **Anti-Hallucination**: Klaim yang dihasilkan selalu diinisialisasi dengan status `UNVERIFIED` di level research provider, dan referensi sitasi fiktif langsung digagalkan sebelum masuk ke draf editorial.
3. **Free Tier Safety**: Repositori tidak mengaktifkan billing Google Cloud atau membuat resource berbayar.
