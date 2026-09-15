# NexaMOS Topic Management & Lifecycle Orchestration

> **Phase 1C Technical Reference & Architecture Document**  
> **Status:** Canonical Phase 1C Implementation  
> **Audience:** NexaMOS Engineering, Editorial Automation, & IDE Agents  
> **Source of Truth:** `NexaMOS_Blog_Master_Reference_AI_Era_v1.0.md` & `NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md`

---

## 1. Architecture Overview

NexaMOS Phase 1C mengimplementasikan application dan domain orchestration layer yang mengelola siklus hidup Topic secara deterministik, auditable, dan decoupled.

Sistem memisahkan empat lapisan independen:

```text
┌─────────────────────────────────────────────────────────────┐
│                        DOMAIN MODEL                         │
│  Topic Entity, TopicStatus, Territory, EditorialRole,       │
│  TopicArticleRelation, TopicEvent, TopicSnapshot, Result    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       DOMAIN SERVICES                       │
│  topic-qualifier.ts, opportunity-scorer.ts,                │
│  topic-transition.ts                                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     REPOSITORY CONTRACTS                    │
│  TopicRepository, TopicEventRepository,                     │
│  TopicArticleRelationRepository, TopicQuery                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     APPLICATION SERVICE                     │
│  TopicManagementService (Orchestrator)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    IN-MEMORY REPOSITORY                     │
│  InMemoryTopicRepository, InMemoryTopicEventRepository,    │
│  InMemoryTopicArticleRelationRepository (Test & PoA only)   │
└─────────────────────────────────────────────────────────────┘
```

Prinsip arsitektur yang ditegakkan:
- **Zero Coupling ke Database:** Tidak ada keterikatan pada SQL/ORM/Prisma/Postgres. Semua operasi berinteraksi melalui repository interface.
- **Single Responsibility:** Repository hanya menangani abstraksi persistensi (CRUD, query, keunikan ID/slug); Domain Service menangani aturan evaluasi murni; Application Service mengorkestrasi alur lintas entitas.
- **Type-Safe Results:** Tidak mengandalkan exception (`throw`) untuk business rejections normal. Semua interaksi mengembalikan `Result<T, DomainError>`.

---

## 2. Repository Abstraction & Query Model

### 2.1 Repository Contracts

Lapisan persistensi diabstraksikan menjadi tiga interface kontrak:

1. **`TopicRepository` (`engines/ideation/repository/topic-repository.ts`)**
   - `create(topic: Topic): Promise<Result<Topic, DomainError>>`
   - `getById(id: string): Promise<Topic | null>`
   - `getBySlug(slug: string): Promise<Topic | null>`
   - `list(query?: TopicQueryParams): Promise<TopicQueryResult>`
   - `update(topic: Topic): Promise<Result<Topic, DomainError>>`
   - `existsById(id: string): Promise<boolean>`
   - `existsBySlug(slug: string): Promise<boolean>`

2. **`TopicEventRepository` (`engines/ideation/repository/topic-event-repository.ts`)**
   - `append(event: TopicEvent): Promise<TopicEvent>`
   - `listByTopicId(topicId: string): Promise<TopicEvent[]>`

3. **`TopicArticleRelationRepository` (`engines/ideation/repository/topic-article-relation-repository.ts`)**
   - `add(relation: TopicArticleRelation): Promise<TopicArticleRelation>`
   - `listByTopicId(topicId: string): Promise<TopicArticleRelation[]>`
   - `listByArticleId(articleId: string): Promise<TopicArticleRelation[]>`
   - `exists(topicId: string, articleId: string): Promise<boolean>`

### 2.2 Query Model (`TopicQueryParams`)

Mendukung penyaringan komprehensif tanpa search engine eksternal:
- **Filters:** `status`, `territory`, `editorialRole`, `recommendedArticleType`, `priorityClass`, `distributionTarget`, `commodityRisk`, `createdFrom`, `createdTo`, `updatedFrom`, `updatedTo`.
- **Sorting:** `field` (`createdAt` | `updatedAt` | `priorityOverall` | `title`), `direction` (`ASC` | `DESC`).
- **Pagination:** `limit` (default 50), `offset` (default 0).

### 2.3 In-Memory Repository Guarantees

Implementasi in-memory (`InMemoryTopicRepository`, `InMemoryTopicEventRepository`, `InMemoryTopicArticleRelationRepository`) menerapkan:
- **Immutabilitas / Safe Cloning:** Semua data yang masuk dan keluar dikloning menggunakan `structuredClone()` untuk mencegah mutasi diam-diam di luar repository.
- **Uniqueness Guard:** Menolak duplikasi `id` (`DUPLICATE_TOPIC_ID`) dan duplikasi `slug` (`DUPLICATE_TOPIC_SLUG`).
- **Pencarian Cepat:** Menggunakan `Map<string, Topic>` dan indeks balik `slugToId: Map<string, string>`.

---

## 3. Lifecycle Orchestration

Siklus hidup Topic diatur secara deterministik melalui Finite State Machine (FSM) yang divalidasi oleh `topic-transition.ts`:

```text
       ┌───────────┐
       │ CAPTURED  │
       └─────┬─────┘
             │ screenTopic()
             ▼
       ┌───────────┐
       │ SCREENING │
       └─────┬─────┘
             │ qualifyTopic()
             ├──────────────────────┬──────────────────────┬──────────────────────┐
             ▼                      ▼                      ▼                      ▼
       ┌───────────┐         ┌──────────────┐         ┌───────────┐         ┌──────────┐
       │ QUALIFIED │         │RESEARCH_REQ. │         │  ON_HOLD  │         │ REJECTED │
       └─────┬─────┘         └──────────────┘         └─────┬─────┘         └──────────┘
             │ scoreTopic()                                 │ resumeTopic()
             │ prioritizeTopic()                            ▼
             ▼                                        ┌───────────┐
       ┌───────────┐                                  │ SCREENING │
       │PRIORITIZED│                                  └───────────┘
       └─────┬─────┘
             │ approveTopic()
             ▼
       ┌───────────┐
       │ APPROVED  │
       └─────┬─────┘
             │ startProduction()
             ▼
       ┌─────────────┐
       │IN_PRODUCTION│
       └─────┬───────┘
             │ linkArticle() + markPublished()
             ▼
       ┌───────────┐
       │ PUBLISHED │
       └─────┬─────┘
             │ archiveTopic()
             ▼
       ┌───────────┐
       │ ARCHIVED  │
       └───────────┘
```

---

## 4. Topic Qualification Orchestration

Metode: `service.qualifyTopic(id, options)`

1. Mengambil entitas Topic dari repository.
2. Memanggil domain qualifier deterministik: `qualifyTopic(topic)` (`engines/ideation/topic-qualifier.ts`).
3. Evaluasi 6 gerbang:
   - `TERRITORY_FIT`: Wajib INTELLIGENCE, STRATEGY, atau TACTICAL.
   - `AUDIENCE_RELEVANCE`: Masalah dan segmen terdefinisi konkret.
   - `KNOWLEDGE_VALUE`: Memiliki original thesis dan kontribusi non-generik.
   - `EVIDENCE_FEASIBILITY`: Bukti empiris memadai (E0-E4).
   - `NON_COMMODITY_POTENTIAL`: Diferensiasi dari ringkasan AI generik (dengan *Supporting Content Exception* jika role SUPPORTING/REFERENCE).
   - `BUSINESS_RELEVANCE`: Penyelarasan dengan objektif pertumbuhan atau positioning NexaMOS.
4. Menghasilkan keputusan: `QUALIFIED`, `RESEARCH_REQUIRED`, `ON_HOLD`, atau `REJECTED`.
5. Memperbarui status topik dan menyimpan evaluasi gerbang ke `topic.qualification`.
6. Merekam audit event (`TOPIC_QUALIFIED`, `TOPIC_RESEARCH_REQUIRED`, dll).

---

## 5. Opportunity Scoring & Prioritization

Metode:
- `service.scoreTopic(id, options)`
- `service.prioritizeTopic(id, actor)`

### 5.1 Guardrails
- Topik **wajib** berstatus `QUALIFIED` sebelum dinilai (kecuali dijalankan dengan flag `allowSimulation: true`).
- Topik yang belum berstatus `QUALIFIED` akan ditolak dengan error code `TOPIC_NOT_QUALIFIED`.

### 5.2 Scoring Engine
Menggunakan formula kanonikal `TOPIC_PRIORITY_V1` (`engines/ideation/opportunity-scorer.ts`):

$$\text{Overall Score} = 0.25(\text{Strategic}) + 0.25(\text{Audience}) + 0.25(\text{Timeliness}) + 0.15(\text{Evidence}) + 0.10(\text{Differentiation})$$

Skor disimpan pada `topic.priority` dengan dimensi individual dan skor keseluruhan (0-100).

### 5.3 Prioritization Transition
Setelah skor dihitung, `prioritizeTopic()` mengorkestrasi transisi:
$$\text{QUALIFIED} \longrightarrow \text{PRIORITIZED}$$
dan mencatat event `TOPIC_PRIORITIZED`.

---

## 6. Editorial Approval

Metode: `service.approveTopic(id, approvedBy, approvalNote)`

### 6.1 Guardrails
- Topik **hanya** dapat disetujui jika saat ini berstatus `PRIORITIZED`.
- Topik pada status lain (`CAPTURED`, `SCREENING`, `QUALIFIED`, dll.) akan ditolak dengan error `TOPIC_NOT_PRIORITIZED`.

### 6.2 Approval Payload
- `approvedAt`: ISO 8601 timestamp saat persetujuan dicatat.
- `approvedBy`: Identitas atau nama editor/aktor.
- `approvalNote`: Catatan redaksi opsional mengenai alasan persetujuan.

Transisi:
$$\text{PRIORITIZED} \longrightarrow \text{APPROVED}$$
Audit Event: `TOPIC_APPROVED`.

---

## 7. Production Start

Metode: `service.startProduction(id, actor)`

### 7.1 Guardrails
- Topik **harus** berstatus `APPROVED`. Jika belum, ditolak dengan `TOPIC_NOT_APPROVED`.
- **Completeness Check**: Menolak transisi dengan `VALIDATION_FAILED` jika salah satu dari 6 atribut kunci belum lengkap:
  1. `title`
  2. `territory`
  3. `audience.segment`
  4. `problem`
  5. `informationGain.expectedContribution`
  6. `recommendedArticleType`

Transisi:
$$\text{APPROVED} \longrightarrow \text{IN\_PRODUCTION}$$
Audit Event: `TOPIC_PRODUCTION_STARTED`.

---

## 8. Topic → Article Relations & Publication

### 8.1 1 Topic → N Articles Architecture

Dalam doktrin NexaMOS, satu Topic adalah peluang pengetahuan yang dapat menghasilkan banyak artikel atau format turunan.

Model relasi: `TopicArticleRelation` (`engines/ideation/domain/topic-article-relation.ts`):
- `topicId`: ID unik topik.
- `articleId`: ID artikel naskah/draft.
- `relationType`:
  - `PRIMARY`: Artikel pilar utama yang menjawab tesis topik.
  - `SUPPORTING`: Artikel pendukung yang mengulas sub-aspek topik.
  - `FOLLOW_UP`: Artikel lanjutan pasca perkembangan pasar baru.
  - `UPDATE`: Revisi atau pembaruan atas artikel terdahulu.
  - `DERIVATIVE`: Format turunan (studi kasus, playbook, lembar kerja).
- `createdAt`: Timestamp relasi.

Relasi dikelola secara independen melalui `TopicArticleRelationRepository` dan disinkronkan ke daftar `topic.articleIds`. Operasi bersifat idempoten dan aman terhadap duplikasi.

### 8.2 Publication Guardrails

Metode: `service.markPublished(topicId, articleId, publishedAt, actor)`

- Topik **wajib** berada pada status `IN_PRODUCTION`.
- **Article Verification Guardrail:** Sistem memvalidasi apakah `articleId` telah dihubungkan ke `topicId` melalui repository relasi. Jika tidak ada relasi, ditolak dengan `ARTICLE_RELATION_REQUIRED`.
- Menetapkan status:
  $$\text{IN\_PRODUCTION} \longrightarrow \text{PUBLISHED}$$
- Mencatat `publishedAt` dan menghasilkan audit event `TOPIC_PUBLISHED`.

---

## 9. Audit Trail & Event Store

Setiap mutasi siklus hidup menghasilkan entitas `TopicEvent` yang disimpan di `TopicEventRepository`:

```ts
interface TopicEvent {
  id: string;
  topicId: string;
  type: TopicEventType;
  timestamp: string;
  actor: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
}
```

### 14 Canonical Event Types:
1. `TOPIC_CAPTURED`
2. `TOPIC_UPDATED`
3. `TOPIC_SCREENING_STARTED`
4. `TOPIC_QUALIFIED`
5. `TOPIC_RESEARCH_REQUIRED`
6. `TOPIC_PRIORITIZED`
7. `TOPIC_APPROVED`
8. `TOPIC_ON_HOLD`
9. `TOPIC_RESUMED`
10. `TOPIC_REJECTED`
11. `TOPIC_ARCHIVED`
12. `TOPIC_PRODUCTION_STARTED`
13. `TOPIC_ARTICLE_LINKED`
14. `TOPIC_PUBLISHED`

### Jaminan Rekonstruksi Sejarah
Metode `service.getTopicHistory(topicId)` mengembalikan daftar event terurut kronologis secara ketat, memungkinkan rekonstruksi penuh proses editorial dari ide awal hingga terbit.

---

## 10. Manual Override Policy

Editorial governance NexaMOS mendukung campur tangan manusia (human-in-the-loop) tanpa merusak integritas data historis:

Ketika editor melakukan override atas keputusan kualifikasi (misal: sistem merekomendasikan `RESEARCH_REQUIRED` namun editor memutuskan `ON_HOLD` atau `QUALIFIED`):
1. Keputusan kualifikasi baru diterapkan pada `topic.status`.
2. Event audit `TOPIC_QUALIFIED` / `TOPIC_ON_HOLD` mencatat metadata eksplisit:
   ```json
   {
     "override": {
       "override": true,
       "originalDecision": "RESEARCH_REQUIRED",
       "newDecision": "ON_HOLD",
       "reason": "Menunggu konfirmasi data survei eksternal kuartal depan",
       "actor": "Managing-Editor",
       "timestamp": "2026-09-14T12:00:00Z"
     }
   }
   ```
3. Keputusan asli sistem tidak dihapus; tersimpan permanen di riwayat audit.

---

## 11. Read Model Projection: TopicSnapshot

Untuk memfasilitasi kebutuhan query baca tanpa mengimplementasikan CQRS kompleks, layanan menyediakan:

```ts
const snapshot = await service.getTopicSnapshot(topicId);
```

Mengembalikan proyeksi teragregasi:
- `topic`: Entitas topik terkini.
- `qualification`: Hasil kualifikasi beserta 6 evaluasi gerbang.
- `priority`: Dimensi bobot dan skor prioritas.
- `articleRelations`: Daftar seluruh relasi artikel yang terhubung.
- `lastEvent`: Event mutasi terakhir yang tercatat.

---

## 12. Type-Safe Result Pattern & Error Handling

Seluruh operasi application service mengembalikan tipe `Result<T, DomainError>`:

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Machine-Readable Error Codes:
- `TOPIC_NOT_FOUND`: Topik tidak ditemukan berdasarkan ID atau slug.
- `DUPLICATE_TOPIC_ID`: ID topik telah digunakan oleh entitas lain.
- `DUPLICATE_TOPIC_SLUG`: Slug topik telah terdaftar.
- `INVALID_TOPIC_TRANSITION`: Permintaan perubahan status melanggar aturan FSM.
- `TOPIC_NOT_QUALIFIED`: Operasi menuntut status QUALIFIED namun status belum tercapai.
- `TOPIC_NOT_PRIORITIZED`: Operasi approval menuntut status PRIORITIZED.
- `TOPIC_NOT_APPROVED`: Produksi menuntut status APPROVED.
- `ARTICLE_RELATION_REQUIRED`: Publikasi menuntut adanya relasi artikel terverifikasi.
- `VALIDATION_FAILED`: Parameter atau kelengkapan data gagal divalidasi.

---

## 13. Phase 1C Explicit Non-Goals

Secara tegas, ruang lingkup Phase 1C **TIDAK** mencakup dan melarang:
- ❌ Database production (PostgreSQL, MySQL, SQLite, MongoDB).
- ❌ ORM / Data mappers (Prisma, Drizzle, TypeORM, Mongoose).
- ❌ Supabase atau backend-as-a-service.
- ❌ UI dashboard / Web interface produksi.
- ❌ Sistem otentikasi pengguna / session management / RBAC.
- ❌ Integrasi LLM / OpenAI / Gemini API / Claude API.
- ❌ Web crawler / Scraping tools.
- ❌ Google Search Console API.
- ❌ Article content generator otomatis.
- ❌ Validator SEO, Discover, atau AI visibility.
