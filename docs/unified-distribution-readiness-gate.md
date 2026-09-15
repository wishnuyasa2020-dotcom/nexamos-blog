# NexaMOS Blog — Unified Distribution Readiness Gate (Phase 5D)

## 1. Ringkasan Eksekutif & Tujuan

Phase 5D membangun satu gerbang orkestrasi tunggal (**Unified Distribution Readiness Gate**) yang bertugas mengonsolidasi dan mengevaluasi hasil dari tiga mesin validasi distribusi yang telah stabil:
1. **Phase 5A: SEO Validation Engine**
2. **Phase 5B: Google Discover Readiness Validator**
3. **Phase 5C: AI Visibility Readiness Validator**

Disertai dengan prasyarat mutlak kepatuhan terhadap status persetujuan **Phase 4: Editorial Quality Review**.

```text
               EDITORIAL APPROVAL (Phase 4)
                            ↓
  ┌─────────────────────────┼─────────────────────────┐
  ↓                         ↓                         ↓
SEO VALIDATOR       DISCOVER VALIDATOR      AI VISIBILITY VALIDATOR
 (Phase 5A)             (Phase 5B)                (Phase 5C)
  │                         │                         │
  └─────────────────────────┼─────────────────────────┘
                            ↓
               UNIFIED DISTRIBUTION GATE (Phase 5D)
                            ↓
               PUBLICATION CANDIDATE HANDOFF
                            ↓
               PHASE 6 PUBLISHING WORKFLOW
```

---

## 2. Prinsip & Doktrin Fundamental

### 2.1. Otoritas Komponen
```text
VALIDATORS EVALUATE
UNIFIED GATE DECIDES
PUBLISHING WORKFLOW EXECUTES
```
- **Validators Evaluate**: Masing-masing validator fokus secara independen mengevaluasi dimensi teknis, semantis, dan struktural domainnya.
- **Unified Gate Decides**: Gate distribusi menentukan status kesiapan akhir (`READY_TO_PUBLISH`, `READY_WITH_WARNINGS`, `RETURN_FOR_REVISION`, atau `BLOCKED`), melakukan deduplikasi isu, dan mengarahkan rute perbaikan. Gate **tidak** menulis ulang atau memodifikasi konten artikel.
- **Publishing Workflow Executes**: Phase 6 yang akan mengeksekusi integrasi deployment/penerbitan.

### 2.2. Doktrin Keras (Hard Doctrine)
1. **Readiness ≠ Performance**: Kesiapan teknis dan kualitas distribusi **bukan** jaminan atau prediksi peringkat (Rank Prediction), probabilitas sitasi LLM, estimasi impresi Discover, maupun perkiraan trafik web.
2. **A Validator Warning ≠ Automatic Publishing Failure**: Catatan penyempurnaan non-kritis (seperti minimnya diagram visual atau tidak adanya Core Web Vitals live) berstatus `WARNING` dan menghasilkan status `READY_WITH_WARNINGS`, bukan memblokir publikasi.
3. **Larangan Simple Arithmetic Averaging**: Skor komposit tidak boleh mengizinkan publikasi jika salah satu saluran mengalami kegagalan kritis. Formula `(SEO 95 + Discover 95 + AI 20) / 3 = 70` **dilarang** meloloskan artikel yang tidak layak secara AI atau infrastruktur.
4. **Editorial Pass Mandate**: Status persetujuan Editorial (`editorialStatus === 'PASS'`) adalah syarat mutlak. Jika artikel belum lolos editorial, gate secara mutlak menetapkan status `BLOCKED`.

---

## 3. Kebijakan Kesiapan Minimum (`UNIFIED_DISTRIBUTION_POLICY_V1`)

| Saluran Evaluasi | Diterima (Accepted) | Revisi (Return for Revision) | Pemblokir (Blocked / Ineligible) |
| :--- | :--- | :--- | :--- |
| **Editorial** | `PASS` | `REVISION_REQUIRED`, `HUMAN_REVIEW_REQUIRED` | `REJECT` atau status non-PASS |
| **SEO Validator** | `EXCELLENT`, `READY`, `READY_WITH_WARNINGS` | `REVISION_REQUIRED` | `BLOCKED` |
| **Google Discover** | `STRONG`, `READY`, `READY_WITH_WARNINGS` | `REVISION_REQUIRED` | `INELIGIBLE` |
| **AI Visibility** | `STRONG`, `READY`, `READY_WITH_WARNINGS` | `REVISION_REQUIRED` | `BLOCKED` |

### Logika Keputusan Status Terpadu (`OverallStatus`)
1. **`BLOCKED`**:
   - Terjadi jika `editorialStatus !== 'PASS'`.
   - Terjadi jika salah satu validator berstatus pemblokir (`SEO: BLOCKED`, `Discover: INELIGIBLE`, `AI: BLOCKED`).
   - Terjadi jika ditemukan isu kritis infrastruktur/kebijakan (`noindex`, konflik URL kanonikal, sitasi/grounding kritis gagal, pengecualian AI Search Console, atau pelanggaran kebijakan Discover).
2. **`RETURN_FOR_REVISION`**:
   - Terjadi jika tidak ada hard blocker, namun satu atau lebih validator berstatus `REVISION_REQUIRED` (menuntut perubahan substantif teks/isi).
3. **`READY_WITH_WARNINGS`**:
   - Terjadi jika tidak ada blocker maupun tuntutan revisi, namun salah satu validator berstatus `READY_WITH_WARNINGS` atau memuat isu non-kritis (misal aset visual belum lanskap).
4. **`READY_TO_PUBLISH`**:
   - Seluruh validator berada pada status optimal (`READY` / `STRONG` / `EXCELLENT`), persetujuan editorial terpenuhi, dan tidak terdapat peringatan ataupun blocker.

---

## 4. Deduplikasi Isu & Cross-Validator Routing

Satu akar permasalahan sering kali dilaporkan oleh beberapa validator sekaligus. Gate menyatukan isu-isu tersebut ke dalam kode kanonikal tunggal untuk mencegah redudansi bagi editor:

| Laporan Validator Asal | Canonical Issue Code | Severity | Target Route |
| :--- | :--- | :--- | :--- |
| SEO `NOINDEX_ON_PUBLISHED_ARTICLE` + Discover `CONTENT_NOT_INDEXABLE` + AI `ARTICLE_NOT_INDEXABLE` | `ARTICLE_NOT_INDEXABLE` | `CRITICAL` | `SEO_TECHNICAL` |
| SEO `TITLE_CLICKBAIT_RISK` + Discover `DISCOVER_CLICKBAIT_RISK` | `CLICKBAIT_TITLE_RISK` | `WARNING` | `EDITORIAL` |
| SEO `MISSING_PRIMARY_ARTICLE_CONTENT` + Discover `MISSING_PRIMARY_CONTENT` + AI `PRIMARY_CONTENT_UNAVAILABLE` | `PRIMARY_CONTENT_UNAVAILABLE` | `CRITICAL` | `EDITORIAL` |
| SEO `INVALID_CANONICAL` + AI `CRITICAL_CANONICAL_CONFLICT` | `CRITICAL_CANONICAL_CONFLICT` | `CRITICAL` | `SEO_TECHNICAL` |
| Discover `VISUAL_LOW_RESOLUTION` + AI `MISSING_EXPLANATORY_VISUAL` | `VISUAL_ASSET_DEFICIT` | `WARNING` | `VISUAL_DESIGN` |
| AI `UNSUPPORTED_CITATION` / `MISSING_EVIDENCE_LOCATOR` | `UNSUPPORTED_CITATION` | `WARNING` | `RESEARCH` |
| SEO `ORPHAN_ARTICLE_RISK` + Discover `ISOLATED_TOPIC_RISK` | `ISOLATED_TOPIC_RISK` | `WARNING` | `CONTENT_STRATEGY` |
| AI `PAYWALL_ACCESS_RESTRICTION` / `JS_RENDERING_REVIEW` | `CONTENT_ACCESSIBILITY_ISSUE` | `WARNING` | `SITE_TECHNICAL` |

### Rute Pemilik Domain (Distribution Route Targets)
- `EDITORIAL`: Perbaikan narasi, judul sensasional, kejelasan heading, atau klaim berlebihan.
- `RESEARCH`: Penambahan bukti rujukan, pengisian locator sitasi, dan grounding primer.
- `SEO_TECHNICAL`: Pengaturan robots, tag kanonikal, atau skema metadata JSON-LD.
- `CONTENT_STRATEGY`: Penataan klaster topik, intent pembaca, dan diferensiasi substansi.
- `VISUAL_DESIGN`: Peningkatan rasio aspek hero image, diagram konseptual, dan resolusi.
- `SITE_TECHNICAL`: Penanganan rendering client-side, barrier paywall, dan Core Web Vitals.
- `PUBLISHING`: Persiapan penjadwalan dan rilis artikel.
- `HUMAN_REVIEW`: Eskalasi untuk kasus batas kebijakan atau konten sensitif.

---

## 5. Alur Kandidat Publikasi (`PublicationCandidate`) & Pengakuan Warning

1. **Pembuatan Kandidat Publikasi**:
   - Objek `PublicationCandidate` hanya dapat diterbitkan melalui `createPublicationCandidate()` jika status evaluasi adalah `READY_TO_PUBLISH` atau `READY_WITH_WARNINGS`.
   - Percobaan pembuatan kandidat pada status `BLOCKED` atau `RETURN_FOR_REVISION` akan ditolak secara mutlak (`throw Error`).
2. **Warning Acknowledgment Policy**:
   - Untuk artikel berstatus `READY_WITH_WARNINGS`, tim editorial dapat menyertakan rekaman pengakuan (`WarningAcknowledgment`):
     - `warningAcknowledged: boolean`
     - `warningAcknowledgedBy: string`
     - `warningAcknowledgedAt: string` (ISO 8601)
     - `notes?: string`
   - **Batas Keras**: Warning acknowledgment **tidak dapat** mengubah status `BLOCKED` menjadi lolos.

---

## 6. Audit Trail

Setiap siklus evaluasi mencatat jejak audit terstruktur (`DistributionAuditEvent`):
- `DISTRIBUTION_EVALUATION_STARTED`
- `DISTRIBUTION_EVALUATION_COMPLETED`
- `DISTRIBUTION_BLOCKED`
- `DISTRIBUTION_REVISION_REQUIRED`
- `DISTRIBUTION_READY_WITH_WARNINGS`
- `DISTRIBUTION_READY_TO_PUBLISH`
- `WARNING_ACKNOWLEDGED`
- `PUBLICATION_CANDIDATE_CREATED`
