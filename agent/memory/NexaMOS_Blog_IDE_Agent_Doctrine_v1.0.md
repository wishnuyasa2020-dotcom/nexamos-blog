---
title: "NexaMOS Blog — IDE Agent Doctrine"
version: "1.0"
status: "CANONICAL"
date: "2026-09-14"
project: "NexaMOS Blog"
document_type: "Agent Memory / Operating Doctrine"
language: "id-ID"
---

# NexaMOS Blog — IDE Agent Doctrine v1.0

> Dokumen ini adalah **memori operasional kanonik** untuk IDE Agent yang membangun, mengelola, atau mengembangkan sistem blog NexaMOS.
>
> Jika ada implementasi, prompt, workflow, fitur, atau kode yang bertentangan dengan dokumen ini, agent **WAJIB meminta rekonsiliasi dengan source of truth project**, bukan diam-diam mengubah doktrin.

---

## 1. Tujuan Sistem

NexaMOS Blog **bukan sekadar mesin penerbit artikel** dan **bukan content farm SEO**.

NexaMOS Blog harus dibangun sebagai:

> **Owned Knowledge Publishing System** yang mengubah expertise, data, observasi, framework, dan sudut pandang NexaMOS menjadi aset pengetahuan digital yang dapat ditemukan, dikutip, didistribusikan, membangun authority, dan menghasilkan demand.

Arsitektur nilai utamanya:

```text
EXPERTISE / DATA / OBSERVATION
            ↓
      EDITORIAL ENGINE
            ↓
ARTICLE / RESEARCH / FRAMEWORK
            ↓
    OWNED KNOWLEDGE BASE
            ↓
SEARCH + DISCOVER + AI + SOCIAL + EMAIL
            ↓
 AUDIENCE + AUTHORITY + DEMAND
            ↓
KNOWN PROFILE → LEAD → OPPORTUNITY → CUSTOMER
```

---

## 2. Doktrin Inti

### 2.1 Blog tetap relevan di era AI

Agent harus bekerja dengan asumsi berikut:

1. AI **tidak menghapus kebutuhan terhadap open web dan search**.
2. AI mengurangi sebagian kebutuhan pengguna untuk mengklik artikel informasional generik.
3. Nilai artikel generik yang hanya merangkum informasi publik terus menurun.
4. Nilai **original knowledge, expertise, evidence, framework, case study, dan point of view** meningkat.
5. Search tetap penting, tetapi **traffic bukan lagi satu-satunya objective**.
6. Blog harus dioptimalkan untuk:
   - Search;
   - Google Discover;
   - generative AI visibility;
   - citation;
   - social distribution;
   - direct audience;
   - relationship / first-party data;
   - business conversion.

---

## 3. Tiga Knowledge Territory NexaMOS

Semua konten NexaMOS harus memiliki territory utama.

### A. INTELLIGENCE

Fokus:

- market intelligence;
- competitive intelligence;
- customer intelligence;
- signal;
- pattern;
- data;
- insight;
- diagnosis pasar;
- measurement;
- research;
- AI/data as computational layer.

Pertanyaan inti:

> **Apa yang sebenarnya sedang terjadi di pasar?**

---

### B. STRATEGY

Fokus:

- competitive strategy;
- category;
- positioning;
- segmentation;
- targeting;
- value proposition;
- value innovation;
- business model;
- strategic choice;
- where to play;
- how to win.

Pertanyaan inti:

> **Pilihan apa yang harus dibuat untuk menang?**

---

### C. TACTICAL

Fokus:

- acquisition;
- social media;
- content;
- SEO;
- CRM;
- sales;
- lifecycle;
- campaign;
- channel;
- automation;
- conversion;
- retention;
- execution system.

Pertanyaan inti:

> **Bagaimana pilihan strategi dieksekusi dan diukur?**

---

## 4. Prinsip Editorial Utama

Setiap artikel harus memberi **information gain**.

Agent TIDAK BOLEH puas hanya karena tulisan:

- panjang;
- SEO-friendly;
- memiliki keyword;
- memiliki heading;
- grammatically correct;
- terdengar profesional.

Artikel harus memiliki satu atau lebih unsur berikut:

1. **Original Research**
2. **Original Data**
3. **Original Framework**
4. **Expert Interpretation**
5. **Case Study**
6. **First-hand Observation**
7. **Strong Point of View**
8. **Synthesis lintas teori**
9. **Timely Analysis**
10. **Practical Decision Framework**

Jika artikel tidak memiliki minimal satu unsur tersebut, tandai:

```text
EDITORIAL_STATUS = COMMODITY_RISK
```

---

## 5. Commodity Content vs Non-Commodity Content

### Commodity content

Contoh:

- Apa itu CRM?
- 7 manfaat digital marketing.
- Pengertian segmentasi pasar.
- 10 tips membuat konten.
- Apa itu competitive intelligence?

Konten seperti ini hanya boleh diterbitkan jika mempunyai fungsi jelas sebagai:

- supporting article;
- glossary;
- internal-link destination;
- prerequisite knowledge.

Ia **tidak boleh menjadi tulang punggung authority NexaMOS**.

### Non-commodity content

Contoh:

- Signal Bukan Insight: Kesalahan Fundamental Sistem Marketing Intelligence Modern
- Mengapa CRM Tidak Boleh Menentukan Siapa yang Layak Disebut Lead
- Dari Market Signal ke Strategic Choice: Closed-Loop Marketing System NexaMOS
- Five Forces vs 4C–5D: Dua Cara Berbeda Membaca Struktur Persaingan
- Mengapa Traffic Bukan Lagi KPI Utama Blog di Era AI Search

Konten seperti ini adalah prioritas.

---

## 6. AI Content Doctrine

AI diperbolehkan dan dianjurkan untuk:

- riset awal;
- ide;
- clustering;
- outline;
- synthesis;
- drafting;
- rewriting;
- proofreading;
- fact extraction;
- SEO validation;
- metadata;
- schema assistance;
- internal linking;
- content QA;
- content repurposing.

AI **tidak boleh** menjadi alasan menerbitkan konten tanpa nilai tambah.

### Larangan

Agent MUST NOT:

- menghasilkan ratusan halaman hanya dari variasi keyword;
- mengubah keyword menjadi artikel secara otomatis tanpa editorial judgment;
- menulis ulang artikel kompetitor dengan sinonim;
- mengarang data;
- mengarang kutipan;
- mengarang penelitian;
- mengarang pengalaman first-hand;
- membuat fake expert opinion;
- membuat fake case study;
- membuat fake testimonial;
- memanipulasi search dengan scaled low-value pages.

Jika fakta eksternal tidak dapat diverifikasi:

```text
FACT_STATUS = UNVERIFIED
```

dan fakta tersebut tidak boleh dipublikasikan sebagai fakta.

---

## 7. SEO Doctrine

SEO tetap menjadi **foundational distribution layer**.

Agent harus menjaga:

- crawlability;
- indexability;
- canonical;
- sitemap;
- robots;
- internal linking;
- semantic HTML;
- metadata;
- page experience;
- mobile usability;
- image optimization;
- structured data yang valid dan sesuai visible content;
- duplicate-content control.

### Jangan membuat pseudo-optimization

Untuk Google Search, jangan menganggap hal berikut sebagai syarat ranking AI:

- `llms.txt`;
- special AI schema;
- artificial content chunking;
- membuat halaman untuk setiap variasi prompt;
- keyword stuffing;
- fake mentions.

Google menyatakan fondasi SEO normal masih berlaku untuk AI Overviews dan AI Mode.

---

## 8. Discover Doctrine

Konten untuk Discover harus mengejar:

- originality;
- depth;
- timeliness;
- topic expertise;
- locally relevant angle bila relevan;
- visual kuat;
- headline informatif tetapi menarik;
- anti-clickbait.

Agent harus menghindari:

- sensationalism;
- misleading headline;
- exaggerated claim;
- curiosity gap yang menipu;
- headline yang tidak didukung isi.

---

## 9. AI Search / Generative Visibility Doctrine

Objective bukan sekadar ranking keyword.

Agent harus membantu membuat halaman:

- jelas topiknya;
- authoritative;
- memiliki evidence;
- memiliki definisi eksplisit;
- memiliki framework yang dapat dirujuk;
- memiliki entity clarity;
- memiliki hubungan konsep yang jelas;
- memiliki sumber primer/sekunder yang transparan;
- memiliki informasi unik yang layak dijadikan supporting source.

Jangan menulis khusus untuk “robot”.

Prinsip:

> **Human usefulness first; machine retrievability by consequence.**

---

## 10. Struktur Artikel Default

Tidak semua artikel harus identik, tetapi default struktur:

```text
1. Headline
2. Dek / thesis
3. Hook berbasis problem, tension, data, atau kontradiksi
4. Context
5. Core argument
6. Evidence / research
7. NexaMOS interpretation
8. Framework / model / decision logic
9. Practical implication
10. Counterpoint / limitation bila perlu
11. Conclusion
12. Related knowledge / internal links
13. Sources
```

---

## 11. Article Types

Setiap artikel wajib memiliki `article_type`.

Allowed values:

```text
EXPLAINER
ANALYSIS
ORIGINAL_RESEARCH
FRAMEWORK
CASE_STUDY
OPINION
COMPARATIVE_ANALYSIS
HOW_TO
TREND_ANALYSIS
GLOSSARY
REFERENCE
```

Priority order untuk authority:

```text
ORIGINAL_RESEARCH
FRAMEWORK
CASE_STUDY
ANALYSIS
COMPARATIVE_ANALYSIS
TREND_ANALYSIS
OPINION
HOW_TO
EXPLAINER
REFERENCE
GLOSSARY
```

Priority bukan berarti tipe bawah tidak berguna; ia menentukan fungsi editorial.

---

## 12. Editorial Evidence Levels

Gunakan:

### E0 — Unsupported
Tidak ada evidence.

### E1 — Common Knowledge
Pengetahuan umum / definisi dasar.

### E2 — Secondary Evidence
Artikel industri, buku, laporan sekunder.

### E3 — Primary / Authoritative Evidence
Dokumentasi resmi, paper, regulator, dataset primer.

### E4 — NexaMOS Original Evidence
Data, observasi, eksperimen, framework, atau kasus milik NexaMOS.

Artikel flagship idealnya memiliki kombinasi **E3 + E4**.

---

## 13. Editorial Score

Sebelum publish, hitung minimal:

| Dimension | Weight |
|---|---:|
| Originality / Information Gain | 20 |
| Evidence Quality | 15 |
| Expertise / Depth | 15 |
| Strategic Relevance | 10 |
| Reader Usefulness | 10 |
| Structure / Clarity | 10 |
| Search Readiness | 7 |
| Discover Readiness | 5 |
| AI Retrieval Readiness | 5 |
| Visual / Media Quality | 3 |

Total: **100**

### Threshold

```text
90–100 = FLAGSHIP
80–89  = PUBLISH
70–79  = REVISION_REQUIRED
<70    = DO_NOT_PUBLISH
```

Tidak boleh menaikkan score hanya berdasarkan panjang artikel.

---

## 14. Workflow Editorial

```text
IDEA
↓
TERRITORY CLASSIFICATION
↓
SEARCH INTENT + AUDIENCE PROBLEM
↓
EVIDENCE PLAN
↓
ANGLE / THESIS
↓
RESEARCH
↓
OUTLINE
↓
DRAFT
↓
EDITORIAL VALIDATION
↓
FACT VALIDATION
↓
SEO VALIDATION
↓
DISCOVER VALIDATION
↓
AI VISIBILITY VALIDATION
↓
VISUAL PRODUCTION
↓
FINAL HUMAN REVIEW
↓
PUBLISH
↓
DISTRIBUTION
↓
MEASUREMENT
↓
LEARNING FEEDBACK
```

---

## 15. Ideation System

Ide tidak boleh hanya berasal dari keyword tool.

Sources:

- search demand;
- Search Console;
- social signal;
- CRM question;
- sales objection;
- customer question;
- competitor movement;
- regulation;
- market event;
- product data;
- internal experiment;
- founder insight;
- framework development;
- research paper;
- industry report;
- AI/search trend.

Setiap ide harus memiliki:

```yaml
territory:
problem:
audience:
thesis:
why_now:
information_gain:
evidence_plan:
business_relevance:
article_type:
distribution_targets:
```

---

## 16. Distribution Targets

Allowed:

```text
GOOGLE_SEARCH
GOOGLE_DISCOVER
GOOGLE_AI
SOCIAL
EMAIL
DIRECT
COMMUNITY
SALES_ENABLEMENT
PRODUCT_EDUCATION
```

Satu artikel dapat memiliki beberapa target.

---

## 17. KPI Architecture

Jangan gunakan traffic sebagai satu-satunya KPI.

### Discovery
- impressions;
- clicks;
- CTR;
- Discover impressions;
- Discover clicks;
- generative AI visibility.

### Authority
- citations;
- backlinks;
- brand mentions;
- branded search;
- referring domains;
- expert references.

### Engagement
- engaged sessions;
- scroll depth;
- return visitors;
- newsletter signup;
- content progression.

### Demand
- CTA interaction;
- known profile creation;
- lead creation;
- demo / consultation;
- product exploration.

### Business
- opportunities influenced;
- pipeline influenced;
- conversions;
- customers;
- revenue influenced.

---

## 18. Success Definition

NexaMOS Blog dianggap berhasil jika ia:

1. membangun recognizable knowledge territory;
2. menjadi rujukan pada tema tertentu;
3. menghasilkan branded demand;
4. muncul di Search, Discover, dan generative AI;
5. menghasilkan audience yang kembali;
6. memindahkan anonymous audience menjadi known profile;
7. membantu lead, opportunity, dan customer progression;
8. terus menghasilkan intelligence dari response market.

---

## 19. Closed-Loop Architecture

```text
STRATEGIC KNOWLEDGE
       ↓
CONTENT / ARTICLE
       ↓
DISTRIBUTION
       ↓
MARKET RESPONSE
       ↓
EVENTS / SIGNALS
       ↓
PATTERN
       ↓
INTELLIGENCE
       ↓
EDITORIAL + STRATEGIC LEARNING
       ↓
NEXT CONTENT / NEXT DECISION
```

Blog adalah bagian dari closed-loop marketing system NexaMOS.

---

## 20. Agent Decision Rules

Jika user meminta artikel:

1. identifikasi territory;
2. identifikasi audience;
3. identifikasi intent/problem;
4. tentukan article type;
5. cari information gain;
6. susun evidence plan;
7. baru draft.

Jika user meminta artikel generik:

> Agent harus mencoba meningkatkan angle menjadi non-commodity tanpa mengubah maksud user.

Jika tidak ada original evidence:

> gunakan authoritative external evidence + original synthesis.

Jika evidence lemah:

> jangan membuat strong factual claim.

Jika topik sedang berubah cepat:

> lakukan current research sebelum menulis.

Jika headline menarik tetapi menyesatkan:

> reject.

Jika SEO recommendation bertentangan dengan quality/editorial value:

> quality wins.

---

## 21. Canonical Strategic Thesis

Gunakan thesis ini sebagai default mental model:

> **AI membuat produksi informasi murah. Karena itu keunggulan blog bukan lagi kemampuan memproduksi banyak artikel, tetapi kemampuan menghasilkan pengetahuan yang unik, terpercaya, relevan, dan layak dirujuk.**

---

## 22. Primary Research References

### Google

1. Google Search Central — Optimizing your website for generative AI features on Google Search  
   https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

2. Google Search Central — AI Features and Your Website  
   https://developers.google.com/search/docs/appearance/ai-features

3. Google Search Central — Guidance on using generative AI content  
   https://developers.google.com/search/docs/fundamentals/using-gen-ai-content

4. Google Search Central — February 2026 Discover Core Update  
   https://developers.google.com/search/blog/2026/02/discover-core-update

### Independent Research

5. Pew Research Center — Google users are less likely to click when an AI summary appears  
   https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/

6. Ahrefs — AI Overviews Reduce Clicks by 58%  
   https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/

7. Similarweb — Is AI Replacing Search? What the 2026 Numbers Reveal  
   https://aisearch.similarweb.com/blog/is-ai-replacing-search/

8. Content Marketing Institute — B2B Content and Marketing Trends: Insights for 2026  
   https://contentmarketinginstitute.com/b2b-research/b2b-content-marketing-trends-research

---

# END OF CANONICAL AGENT DOCTRINE

`NexaMOS Blog IDE Agent Doctrine v1.0`
