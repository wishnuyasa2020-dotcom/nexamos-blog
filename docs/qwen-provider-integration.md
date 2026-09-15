# NexaMOS Blog — Qwen Provider Integration Guide

Dokumentasi aktivasi dan standar integrasi provider **Qwen (Alibaba Cloud Model Studio / DashScope)** untuk **Production Pilot 01**.

---

## 1. Spesifikasi Keputusan Kanonikal

| Properti | Nilai Kanonikal |
| :--- | :--- |
| **Provider** | `qwen` (Alibaba Cloud Model Studio) |
| **Model** | `qwen3.8-flash` |
| **Region** | Singapore (`ap-southeast-1`) |
| **Service Scope** | International |
| **Tujuan** | AI Research Provider + AI Editorial Provider |
| **Gaya API** | OpenAI-compatible Chat Completions (`/chat/completions`) |
| **Autentikasi** | HTTP Header `Authorization: Bearer <API_KEY>` |

---

## 2. Format Base URL & Workspace ID

Qwen Model Studio internasional menggunakan endpoint yang terikat pada region dan workspace:

```text
https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
```

* `{WorkspaceId}` adalah ID workspace Alibaba Cloud Model Studio milik pengguna (contoh: `ws-f425k3beg4eor2m8`).
* Endpoint Chat Completions yang dipanggil oleh HTTP client:
  ```text
  https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions
  ```

---

## 3. Qwen Region Safety Guard

API key Alibaba Cloud Model Studio bersifat **region-bound**. Untuk menjaga konsistensi data dan performa, Pilot 01 mewajibkan region **Singapore (`ap-southeast-1`)**.

Sistem menerapkan validasi ketat pada konfigurasi:
* `AI_PROVIDER_BASE_URL` **wajib** memuat substring `.ap-southeast-1.maas.aliyuncs.com`.
* Jika base URL tidak konsisten atau mengarah ke region lain (misalnya `cn-beijing`), sistem **menolak keras eksekusi** dengan error:
  ```text
  [AI_PROVIDER_REGION_MISMATCH] Qwen provider Pilot 01 wajib menggunakan endpoint Singapore (.ap-southeast-1.maas.aliyuncs.com).
  ```
* **Anti-Fallback Guard**: Tidak ada fallback diam-diam ke region lain, ke Gemini, maupun ke Mock. Sistem akan gagal secara eksplisit.

---

## 4. Konfigurasi Environment Variables

Konfigurasi disimpan secara aman di file `.env.local` (diabaikan oleh Git via `.gitignore`):

```bash
# Real AI Provider Config (Production Pilot 01 - Qwen Activation)
AI_PROVIDER=qwen
AI_PROVIDER_MODEL=qwen3.8-flash
AI_PROVIDER_BASE_URL=https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
AI_PROVIDER_API_KEY=sk-ws-xxxxxx...
AI_REQUEST_TIMEOUT_MS=90000
AI_MAX_RETRIES=2
```

> [!CAUTION]
> Dilarang keras menuliskan API key nyata ke file `.env.example`, repositori Git, commit message, maupun dokumentasi publik.

---

## 5. Structured Output & Otoritas Skema Lokal

Qwen mendukung mode JSON objek standar OpenAI:

```json
{
  "response_format": {
    "type": "json_object"
  }
}
```

### Alur Validasi Ketat:
```text
Qwen API (JSON Mode)
        ↓
Respon Mentah (JSON String)
        ↓
StructuredOutputValidator.parseJson
        ↓
NexaMOS Domain Schema Validation (ResearchPlan / ArticleDraft)
        ↓
Grounding Boundary Validation (GroundingGuard)
        ↓
Domain Entity
```

* Prompt selalu secara eksplisit menginstruksikan format JSON.
* Output JSON wajib lolos validasi skema internal NexaMOS. Jika valid secara sintaksis tetapi melanggar tipe/skema:
  ```text
  [AI_OUTPUT_INVALID] Respon terstruktur tidak memenuhi validasi skema.
  ```

---

## 6. Batasan Integritas Grounding (Anti-Halusinasi)

* **Research Boundary**: `RealAIResearchProvider` tidak boleh menciptakan sumber fiktif, bukti palsu, atau mengubah level bukti. Klaim baru dari AI berstatus `UNVERIFIED` sampai divalidasi engine riset deterministik.
* **Editorial Boundary**: `RealAIEditorialProvider` merumuskan narasi dan prosa, tetapi **dilarang keras** menciptakan statistik baru, kutipan baru, `claimId` asing, `sourceId` asing, atau `evidenceId` asing. Seluruh klaim wajib tertaut ke ID resmi dari `ResearchBrief`.
* Jika ditemukan ID yang tidak terdaftar, `GroundingGuard` langsung menolak draf dengan status `BLOCKED` / `GROUNDING_VIOLATION`.

---

## 7. Kebijakan Retry & Penanganan Error

* **Bounded Retry**: Maksimal 2 kali retry (`AI_MAX_RETRIES=2`).
* **Kondisi Retry**: Hanya untuk status HTTP `429` (Rate Limited), HTTP `5xx` (Internal Server Error / Service Unavailable), dan transient network timeout.
* **Non-Retryable**: Status `401` / `403` (Authentication Failed) langsung gagal tanpa retry.
* **Provider Retry-After**: Sistem membaca header `Retry-After` atau field `RetryInfo` provider secara otomatis untuk jeda backoff.

### Normalisasi Kode Error:
* `AI_AUTHENTICATION_FAILED`: Kredensial tidak valid atau ditolak.
* `AI_RATE_LIMITED`: Batas RPM/TPM tercapai.
* `AI_REQUEST_TIMEOUT`: Melebihi batas waktu (default 90.000 ms).
* `AI_PROVIDER_UNAVAILABLE`: Gangguan internal provider (HTTP 5xx).
* `AI_OUTPUT_INVALID`: Respon JSON rusak atau tidak sesuai skema.
* `AI_RESPONSE_EMPTY`: Respon provider kosong.
* `AI_REQUEST_FAILED`: Permintaan HTTP gagal.
* `AI_PROVIDER_REGION_MISMATCH`: Endpoint tidak sesuai region Singapore.
* `AI_FREE_QUOTA_EXHAUSTED`: Kuota gratis habis atau model belum diaktifkan/dibeli di Alibaba Cloud console (`AccessDenied.Unpurchased` / `AllocationQuota.FreeTierOnly`).

---

## 8. Batasan Kuota Bebas (Free Quota Boundary)

Aplikasi NexaMOS **tidak memiliki hak dan tidak akan pernah**:
* Mengubah konfigurasi penagihan (*billing*) pengguna di Alibaba Cloud.
* Melakukan pembelian kuota otomatis.
* Menonaktifkan opsi *Free Quota Only*.

Jika kuota habis atau model belum dibeli di console Alibaba Cloud, API mengembalikan kode `AccessDenied.Unpurchased`, yang secara deterministik dinormalisasi ke `AI_FREE_QUOTA_EXHAUSTED`. Pengguna mengelola aktivasi kuota secara mandiri di Alibaba Cloud Model Studio Console.

---

## 9. Prosedur Smoke Test

Uji konektivitas dan kepatuhan kontrak dijalankan melalui perintah:

```bash
npm run ai:smoke
```

Hasil verifikasi yang diharapkan saat sukses:
```text
====================================================
NexaMOS AI Provider Smoke Test
====================================================
Provider:       Qwen
Model:          qwen3.8-flash
Region:         Singapore
Authentication: configured
Endpoint:       reachable (<waktu>ms)
Chat Completions: PASS
JSON response:  PASS
Local schema validation: PASS
====================================================
Status:         PASS
====================================================
```
