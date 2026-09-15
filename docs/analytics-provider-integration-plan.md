# NexaMOS Blog — Analytics Provider Integration Plan

## 1. Pendahuluan

Dokumen ini menguraikan peta jalan dan rencana teknis integrasi konektor live eksternal untuk **NexaMOS Blog Analytics Engine (Phase 7)**.

Implementasi inti domain Phase 7 telah dirancang secara **provider-agnostic** dengan batas antarmuka `AnalyticsProvider` dan isolasi di `/infrastructure/analytics/`. Ketiadaan kredensial Google API aktif saat ini tidak menghalangi kelengkapan fitur inti maupun verifikasi sistem.

---

## 2. Rencana Integrasi Live Per Provider

### 2.1. Google Search Console API
- **API Target**: Google Search Console API v1 (`searchanalytics.query`)
- **Protokol**: REST / OAuth2 Service Account
- **Metrik**: `impressions`, `clicks`, `ctr`, `position`
- **Dimensi**: `page`, `query`, `country`, `device`, `date`, `searchAppearance`
- **Strategi Sinkronisasi**: Cron harian (rolling 28 hari) untuk memperhitungkan latensi data GSC (~2–3 hari keterlambatan resmi).
- **Penanganan Error**: Status konektor `AUTH_ERROR` jika token kedaluwarsa; fallback ke cache metrik tanpa memblokir sistem editorial.

### 2.2. Google Discover Data
- **API Target**: Search Console API v1 dengan filter `searchType: 'discover'`
- **Karakteristik**: Ketersediaan data bergantung pada ambang batas impresi minimum akun/halaman.
- **Penanganan Ambang Batas**: Jika artikel belum mencapai batas minimum, sistem mencatat status `BELOW_THRESHOLD` (`DATA_NOT_AVAILABLE`), **bukan** mengartikannya sebagai kegagalan artikel (`ZERO_PERFORMANCE`).

### 2.3. Google Generative AI Search / AI Overviews
- **Mekanisme**:
  - Impor laporan berkala (CSV / JSON) melalui `GenerativeAIReportImportProvider`.
  - Filter `searchAppearance` pada Google Search Console API saat Google meluncurkan dimension filter resmi untuk AI Overviews secara luas.
- **Batasan Metrik**: Hanya menelan `impressions`. Metrik sintetis seperti AI CTR atau rank posisi buatan tidak akan diinjeksi.

### 2.4. Google Analytics 4 (GA4) Data API
- **API Target**: Google Analytics Data API v1beta (`runReport`)
- **Protokol**: Google Cloud Service Account (OAuth2)
- **Metrik**: `sessions`, `engagedSessions`, `engagementRate`, `userEngagementDuration`, `screenPageViews`, `eventCount`, `keyEvents`
- **Dimensi**: `pagePath`, `date`, `deviceCategory`, `sessionSource`, `country`
- **Privasi**: Tidak meminta atau menyimpan dimensi User ID atau Client IP mentah.

---

## 3. Matriks Kesiapan Provider

| Provider | Status Saat Ini | Metode Live Mendatang | Kebutuhan Kredensial |
| :--- | :--- | :--- | :--- |
| **Google Search Console** | `MockSearchConsoleProvider` | GSC API v1 (`searchanalytics.query`) | GCP Service Account / OAuth2 Client |
| **Google Discover** | `MockDiscoverProvider` | GSC API (`searchType='discover'`) | GCP Service Account |
| **Generative AI Search** | `GenerativeAIReportImportProvider` & `MockGenerativeAISearchProvider` | CSV/JSON Ingestion & GSC Filter | None (File Import) / GSC API |
| **Google Analytics 4** | `MockGA4Provider` | GA4 Data API v1beta | GCP Service Account (Viewer Property) |
| **Internal Blog Events** | `MockInternalEventProvider` | First-party Beacon Endpoint (`/api/telemetry`) | NexaMOS Server Session (Zero PII) |

---

## 4. Keamanan & Isolasi Lingkungan

- Seluruh pustaka pihak ketiga (`googleapis`, JWT signing, HTTP fetch) akan ditempatkan secara eksklusif di dalam direktori `/infrastructure/analytics/`.
- Domain engine di `/engines/analytics/` **tidak akan pernah** mengimpor pustaka Google SDK langsung. Hal ini menjamin portabilitas arsitektur dan kemudahan pengujian unit tanpa koneksi internet.
