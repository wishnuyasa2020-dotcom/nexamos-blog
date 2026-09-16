/**
 * NexaMOS Real AI Editorial Provider
 *
 * Sourced from NexaMOS Blog Production Pilot 01 Step 3 specifications.
 * Menghubungkan Editorial Engine ke model LLM nyata dengan batas grounding yang ketat:
 * - DILARANG MENGARANG FAKTA: Faktualitas murni berasal dari ResearchBrief
 * - DILARANG MENGARANG ID: Klaim dan sitasi wajib merujuk ke IDs yang sah dari brief
 * - DILARANG MENGARANG ANGKA / KUTIPAN: Statistik numerik dan kutipan wajib verbatim/didukung bukti
 * - Model bebas mengekspresikan struktur naratif, sudut pandang, logika, dan analisis orisinal
 */

import type {
  AIEditorialProvider,
  GeneratedDraftPayload
} from '../../engines/editorial/ai-editorial-provider.ts';
import type { EditorialGenerationRequest } from '../../engines/editorial/editorial-generation-request.ts';
import type { EditorialPlan } from '../../engines/editorial/editorial-plan.ts';
import type { ArticleSection } from '../../engines/editorial/article-section.ts';
import { AIHttpClient, AIClientError } from './ai-http-client.ts';
import { StructuredOutputValidator } from './structured-output-validator.ts';
import type { AIProviderConfig } from './ai-provider-config.ts';

const EDITORIAL_SYSTEM_HARD_RULE = `Anda adalah Lead Content Architect & Engineering Editor untuk NexaMOS Blog.
ATURAN UTAMA (MUTLAK & TIDAK DAPAT DITAWAR):
1. GROUNDED RESEARCH ONLY: Seluruh klaim faktual WAJIB ditautkan ke claimId yang sah dari ResearchBrief yang disediakan.
2. ZERO TOLERANCE FOR FABRICATION: Dilarang mengarang URL, nama institusi fiktif, angka statistik baru, atau ID sitasi fiktif.
3. KUTIPAN & ANGKA: Angka statistik atau persentase hanya boleh ditulis jika tercantum dalam ResearchBrief.
4. FORMAT OUTPUT: Seluruh respon WAJIB berupa JSON terstruktur tanpa markdown text pembuka atau penutup.`;

export class RealAIEditorialProvider implements AIEditorialProvider {
  private readonly client: AIHttpClient;
  private readonly config: AIProviderConfig;

  constructor(config: AIProviderConfig, client?: AIHttpClient) {
    this.config = config;
    this.client = client || new AIHttpClient(config);
  }

  public async createEditorialPlan(request: EditorialGenerationRequest): Promise<EditorialPlan> {
    const brief = request.researchBrief;
    const claims = brief.supportedClaims.map((c) => ({ id: c.id, statement: c.statement }));
    const findings = brief.keyFindings.map((f) => ({ id: f.id, headline: f.headline }));
    const limitations = brief.limitations || [];

    const prompt = `${EDITORIAL_SYSTEM_HARD_RULE}

TUGAS: Rumuskan EditorialPlan terstruktur untuk artikel berikut:
Topik: "${request.topic.title}"
Tipe Artikel: ${request.articleType}
Peran Editorial: ${request.editorialRole}
Sudut Pandang yang Disarankan: ${request.editorialAngle || brief.recommendedEditorialAngle || '-'}

KLAIM TERVERIFIKASI DARI RESEARCH BRIEF (HANYA GUNAKAN ID BERIKUT):
${JSON.stringify(claims, null, 2)}

TEMUAN KUNCI:
${JSON.stringify(findings, null, 2)}

LIMITASI & SENGKETA:
${JSON.stringify(limitations, null, 2)}

FORMAT JSON YANG WAJIB DIHASILKAN:
{
  "workingTitle": "Judul kerja artikel yang tajam dan otoritatif",
  "thesis": "Pernyataan tesis utama yang kokoh dan dapat diuji",
  "angle": "Sudut pandang editorial unik yang menolak klise komoditas",
  "readerPromise": "Nilai pengetahuan konkret yang didapatkan pembaca",
  "sectionPlan": [
    {
      "heading": "Judul Seksi",
      "purpose": "HOOK | CONTEXT | ARGUMENT | EVIDENCE | FRAMEWORK | ANALYSIS | COUNTERPOINT | IMPLICATION | PRACTICAL_APPLICATION | CONCLUSION",
      "keyPoints": ["Poin 1", "Poin 2"],
      "plannedClaimIds": ["ID klaim dari daftar di atas"]
    }
  ],
  "claimsToUse": ["claim-id-1", "claim-id-2"],
  "findingsToUse": ["finding-id-1"],
  "counterpoints": ["Poin penyeimbang / limitasi"],
  "intendedTakeaway": "Pesan inti strategis yang dibekali pembaca"
}`;

    const response = await this.client.complete({
      messages: [
        { role: 'system', content: EDITORIAL_SYSTEM_HARD_RULE },
        { role: 'user', content: prompt }
      ],
      responseFormat: 'json_object',
      temperature: 0.2
    });

    const parsed = StructuredOutputValidator.parseJson(response.content);
    return StructuredOutputValidator.validateEditorialPlan(parsed);
  }

  public async generateArticleDraft(
    request: EditorialGenerationRequest,
    plan: EditorialPlan
  ): Promise<GeneratedDraftPayload> {
    const brief = request.researchBrief;

    // Himpun ID yang sah untuk validasi ketat anti-halusinasi
    const allowedClaimIds = new Set([
      ...brief.supportedClaims.map((c) => c.id),
      ...(brief.partiallySupportedClaims || []).map((c) => c.id),
      ...(brief.keyFindings || []).map((f) => f.id)
    ]);
    const allowedSourceIds = new Set((brief.sourceIndex || []).map((s) => (s as any).sourceId || (s as any).id));
    const allowedEvidenceIds = new Set((brief.evidenceIndex || []).map((e) => (e as any).evidenceId || (e as any).id));

    const prompt = `${EDITORIAL_SYSTEM_HARD_RULE}

TUGAS: Tulis naskah lengkap draft artikel (ArticleDraft) berdasarkan EditorialPlan yang telah disetujui.

TOPIK & METADATA:
Topik: "${request.topic.title}"
Tesis: "${plan.thesis}"
Angle: "${plan.angle}"
Rencana Seksi:
${JSON.stringify(plan.sectionPlan, null, 2)}

DATA RISET RESMI YANG WAJIB DIKUTIP:
Klaim Terbukti (Supported Claims):
${JSON.stringify(brief.supportedClaims.map((c) => ({ id: c.id, statement: c.statement })), null, 2)}
Temuan Kunci (Key Findings):
${JSON.stringify((brief.keyFindings || []).map((f) => ({ id: f.id, statement: f.statement })), null, 2)}
Indeks Bukti:
${JSON.stringify((brief.evidenceIndex || []).slice(0, 10).map((e) => ({ id: (e as any).evidenceId || (e as any).id, sourceId: e.sourceId, text: ((e as any).quote || (e as any).textSnippet || '').slice(0, 200) })), null, 2)}
Indeks Sumber:
${JSON.stringify((brief.sourceIndex || []).map((s) => ({ id: (s as any).sourceId || (s as any).id, title: s.title, url: s.url })), null, 2)}

PERINGATAN KERAS GROUNDING:
- Dilarang membuat claimId atau sourceId atau evidenceId palsu!
- Seluruh klaim dalam claimUsages dan citationMap WAJIB bersumber dari ID di atas.

FORMAT JSON YANG WAJIB DIHASILKAN:
{
  "title": "${plan.workingTitle}",
  "dek": "Subjudul penjelasan yang memancing pemikiran strategis pembaca",
  "slug": "${request.topic.slug || 'naskah-artikel'}",
  "thesis": "${plan.thesis}",
  "editorialAngle": "${plan.angle}",
  "sections": [
    {
      "id": "sec-1",
      "heading": "Judul Seksi",
      "purpose": "HOOK | CONTEXT | ARGUMENT | EVIDENCE | FRAMEWORK | ANALYSIS | COUNTERPOINT | IMPLICATION | CONCLUSION",
      "content": "Isi lengkap naskah artikel per seksi...",
      "order": 1,
      "claimUsageIds": ["cu-1"]
    }
  ],
  "claimUsages": [
    {
      "id": "cu-1",
      "claimId": "claim-id-resmi-dari-daftar-di-atas",
      "sectionId": "sec-1",
      "usageType": "DIRECT | PARAPHRASED | SYNTHESIZED | CONTEXTUAL",
      "statement": "Pernyataan klaim faktual yang digunakan dalam teks"
    }
  ],
  "citationMap": [
    {
      "claimUsageId": "cu-1",
      "claimId": "claim-id-resmi-dari-daftar-di-atas",
      "sourceIds": ["source-id-resmi"],
      "evidenceIds": ["evidence-id-resmi"]
    }
  ]
}`;

    const response = await this.client.complete({
      messages: [
        { role: 'system', content: EDITORIAL_SYSTEM_HARD_RULE },
        { role: 'user', content: prompt }
      ],
      responseFormat: 'json_object',
      temperature: 0.2
    });

    const parsed = StructuredOutputValidator.parseJson(response.content);

    // Normalisasi variasi minor format claimId jika cocok dengan allowedClaimIds
    if (parsed && Array.isArray(parsed.claimUsages) && allowedClaimIds.size > 0) {
      for (const cu of parsed.claimUsages) {
        if (cu && cu.claimId && !allowedClaimIds.has(cu.claimId)) {
          const match = Array.from(allowedClaimIds).find(
            (id) => id.toLowerCase() === cu.claimId.toLowerCase() ||
                    id.replace(/-/g, '') === cu.claimId.replace(/-/g, '')
          );
          if (match) {
            cu.claimId = match;
          }
        }
      }
      if (Array.isArray(parsed.citationMap)) {
        for (const cm of parsed.citationMap) {
          if (cm && cm.claimId && !allowedClaimIds.has(cm.claimId)) {
            const match = Array.from(allowedClaimIds).find(
              (id) => id.toLowerCase() === cm.claimId.toLowerCase() ||
                      id.replace(/-/g, '') === cm.claimId.replace(/-/g, '')
            );
            if (match) {
              cm.claimId = match;
            }
          }
        }
      }
    }

    return StructuredOutputValidator.validateArticleDraft(parsed, {
      allowedClaimIds,
      allowedSourceIds,
      allowedEvidenceIds
    });
  }

  public async reviseSection(
    request: EditorialGenerationRequest,
    section: ArticleSection,
    instruction: string
  ): Promise<ArticleSection> {
    const prompt = `${EDITORIAL_SYSTEM_HARD_RULE}

TUGAS: Revisi seksi artikel berikut sesuai instruksi editorial:
Judul Seksi: "${section.heading}"
Isi Saat Ini:
${section.content}

Instruksi Revisi:
"${instruction}"

FORMAT JSON YANG WAJIB DIHASILKAN:
{
  "id": "${section.id}",
  "heading": "${section.heading}",
  "content": "Isi seksi hasil revisi...",
  "order": ${section.order},
  "purpose": "${section.purpose}",
  "claimUsageIds": ${JSON.stringify(section.claimUsageIds || [])}
}`;

    const response = await this.client.complete({
      messages: [
        { role: 'system', content: EDITORIAL_SYSTEM_HARD_RULE },
        { role: 'user', content: prompt }
      ],
      responseFormat: 'json_object',
      temperature: 0.2
    });

    const parsed = StructuredOutputValidator.parseJson(response.content);
    return StructuredOutputValidator.validateSection(parsed, section.id, section.order);
  }
}
