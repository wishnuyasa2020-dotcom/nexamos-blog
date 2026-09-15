# NexaMOS Blog — Analytics + Feedback Loop (Phase 7)

## 1. Ringkasan Eksekutif & Tujuan

Phase 7 adalah fase penutup roadmap kanonikal NexaMOS Blog. Tujuan utamanya **BUKAN** sekadar membangun dashboard metrik atau grafik visual, melainkan:

> **Menutup loop NexaMOS Blog dari publikasi $\rightarrow$ respons pasar $\rightarrow$ sinyal terstandarisasi $\rightarrow$ analisis multi-metrik $\rightarrow$ pembelajaran terlingkup (learning) $\rightarrow$ rekomendasi aksi terarah $\rightarrow$ keputusan Topic / Research / Editorial selanjutnya.**

---

## 2. Doktrin & Prinsip Fundamental

```text
SIGNAL ≠ INSIGHT
METRIC ≠ STRATEGY
CORRELATION ≠ CAUSATION
```

1. **Signal Bukan Strategi**: Data performa mentah dari mesin pencari atau analitik pengguna adalah bukti empiris eksekusi di pasar, bukan arahan strategi mutlak.
2. **Anti-Autonomous-Optimization**: Dilarang keras membiarkan analitik memicu bot menulis ulang artikel (`auto-rewrite`) atau mempublikasikan ulang ke produksi (`auto-republish`) secara otonom tanpa tata kelola manusia.
3. **Anti-Kausalitas Sembrono (`UNSUPPORTED_CAUSAL_ATTRIBUTION`)**: Kenaikan metrik (misal CTR) setelah pengubahan elemen (misal judul) adalah **korelasi/pengamatan temporal**, bukan bukti kausalitas langsung kecuali diuji melalui metodologi kontrol yang valid.
4. **Pembelajaran Terlingkup (`Anti-Universal Rule`)**: Pembelajaran operasional (`ContentLearning`) harus selalu terikat konteks teritori, tipe artikel, atau audiens. Tidak boleh digeneralisasi menjadi aturan universal untuk seluruh situs.
5. **Semantik Nilai Nol vs Ketiadaan Data**: Membedakan secara tegas `ZERO` (tercatat 0), `NO_DATA` (belum ada pengukuran), `BELOW_THRESHOLD` (ambang batas Google Discover belum terpenuhi), dan `NOT_CONNECTED`.

---

## 3. Arsitektur 5-Layer Analytics

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. RAW DATA                                                 │
│ Search Console, GA4, Discover, AI Search, Internal Events   │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. NORMALIZED METRIC                                        │
│ Nilai terstandarisasi, semantik zero, sample sufficiency     │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PERFORMANCE SIGNAL                                       │
│ SEARCH_IMPRESSIONS_RISING, HIGH_IMPRESSIONS_LOW_CTR, dll.   │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PERFORMANCE DIAGNOSIS                                    │
│ Sintesis multi-metrik dengan confidence, evidence & anomaly │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CONTENT LEARNING & FEEDBACK ACTION                       │
│ Pembelajaran terlingkup & usulan tindakan ke domain kanonikal│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Alur Feedback Loop ke Fase-Fase Sebelumnya

### 4.1. Umpan Balik ke Phase 1 (Topic Ideation)
- Ketika artikel meraih keterlacakan sitasi yang kuat (`AI_VISIBILITY_GAIN`), sistem menghasilkan `FollowUpTopicProposal`.
- **Aturan Tegas**: Usulan topik baru disalurkan ke `TopicManagementService.createTopic()` dengan status awal **`CAPTURED`**. Sinyal analitik **TIDAK BOLEH** membypass siklus hidup topik langsung ke `APPROVED`. Topik baru tetap wajib melalui screening dan kualifikasi kanonikal Phase 1.

### 4.2. Umpan Balik ke Phase 2 (Research Engine)
- Ketika terdeteksi peluruhan visibilitas organik bertahap (`CONTENT_DECAY` / `CONTENT_REFRESH_OPPORTUNITY`), sistem menghasilkan `ResearchRefreshRequest`.
- Research Engine memvalidasi apakah klaim data primer telah usang dan melakukan pengadaan bukti baru.

### 4.3. Umpan Balik ke Phase 3, 4, 5, dan 6 (Editorial & Publishing)
- Ketika terdeteksi `HIGH_IMPRESSIONS_LOW_CTR`, sistem merekomendasikan peninjauan formulasi judul / meta (`TEST_TITLE`).
- Setiap perubahan naskah atau metadata **wajib** melalui:
  ```text
  Draft Revisi → Editorial Validator (Phase 4) → Distribution Gate (Phase 5D) → Publication Version Update (Phase 6)
  ```
- URL Kanonikal (`canonicalUrl`) tetap dipertahankan.

---

## 5. Batasan Metrik Generative AI Search

Pada fase saat ini, metrik kanonikal Google Generative AI Search yang dapat diukur secara resmi adalah:

```text
IMPRESSIONS
```

Sistem NexaMOS Blog **DILARANG KERAS** mengarang metrik:
- `clicks`
- `CTR`
- `citationCount`
- `AI rank`
- `answer position`

karena provider resmi belum menyediakan metrik tersebut secara terstandarisasi.

---

## 6. Privasi & Keamanan Data

- **Anti-PII**: Sistem memvalidasi payload pengukuran mentah dan menolak keberadaan data identitas personal (`email`, `phone`, `name`, `raw IP`, `personal message`).
- **Isolasi Data Sintetis**: Data pengujian fixture (`isSyntheticTestData` atau `fixtureOnly`) dilindungi oleh guardrail agar tidak pernah masuk ke analitik mode produksi.
