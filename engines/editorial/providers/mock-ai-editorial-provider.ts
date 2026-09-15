/**
 * NexaMOS Mock AI Editorial Provider
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Implementasi mock AI deterministik untuk testing tanpa pemanggilan API eksternal.
 */

import type { AIEditorialProvider, GeneratedDraftPayload } from '../ai-editorial-provider.ts';
import type { EditorialGenerationRequest } from '../editorial-generation-request.ts';
import type { EditorialPlan, SectionPlanItem } from '../editorial-plan.ts';
import type { ArticleSection } from '../article-section.ts';
import type { ClaimUsage } from '../claim-usage.ts';
import type { CitationMapEntry } from '../citation-map.ts';

export interface MockAIEditorialProviderConfig {
  customPlan?: EditorialPlan;
  customPayload?: GeneratedDraftPayload;
  omitThesisForAnalysis?: boolean;
  injectUngroundedNumber?: boolean;
  injectInventedQuote?: boolean;
  injectFakeClaimId?: boolean;
  omitCounterpointForDisputed?: boolean;
  commodityOnly?: boolean;
}

export class MockAIEditorialProvider implements AIEditorialProvider {
  private config: MockAIEditorialProviderConfig;

  constructor(config: MockAIEditorialProviderConfig = {}) {
    this.config = config;
  }

  public setConfig(config: MockAIEditorialProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  public async createEditorialPlan(request: EditorialGenerationRequest): Promise<EditorialPlan> {
    if (this.config.customPlan) {
      return this.config.customPlan;
    }

    const { topic, researchBrief, articleType, editorialRole } = request;

    // Default thesis
    let thesis =
      this.config.omitThesisForAnalysis && articleType === 'ANALYSIS'
        ? ''
        : articleType === 'GLOSSARY' || articleType === 'REFERENCE'
          ? ''
          : `Blog tetap relevan di era AI, tetapi fungsinya bergeser dari sekadar agregator traffic menjadi owned knowledge system yang membangun authority dan demand.`;

    const sectionPlan: SectionPlanItem[] = this.buildDefaultSectionPlan(articleType, editorialRole, researchBrief);

    const claimsToUse = researchBrief.supportedClaims.map((c) => c.id);
    const findingsToUse = researchBrief.keyFindings.map((f) => f.id);
    const counterpoints = researchBrief.limitations || [];

    return {
      workingTitle: topic.title,
      thesis,
      angle:
        request.editorialAngle ||
        researchBrief.recommendedEditorialAngle ||
        'Pergeseran nilai dari commodity content ke original knowledge and entity authority',
      readerPromise:
        'Memahami arsitektur konten baru di mana riset primer dan pemikiran orisinal mengalahkan volume sintesis generik AI.',
      sectionPlan,
      claimsToUse,
      findingsToUse,
      counterpoints,
      intendedTakeaway:
        'Bisnis harus menghentikan produksi artikel komoditas dan membangun mesin riset serta kepemilikan pengetahuan.'
    };
  }

  public async generateArticleDraft(
    request: EditorialGenerationRequest,
    plan: EditorialPlan
  ): Promise<GeneratedDraftPayload> {
    if (this.config.customPayload) {
      return this.config.customPayload;
    }

    const { topic, researchBrief } = request;
    const sections: ArticleSection[] = [];
    const claimUsages: ClaimUsage[] = [];
    const citationMap: CitationMapEntry[] = [];

    // Gunakan klaim pertama dari brief jika ada
    const primaryClaim = researchBrief.supportedClaims[0] || {
      id: 'claim-default-001',
      statement: 'Blog berbasis riset orisinal mempertahankan retensi pembaca lebih tinggi dibandingkan situs agregator.'
    };

    const targetClaimId = this.config.injectFakeClaimId ? 'claim-fictitious-999' : primaryClaim.id;

    // Ambil bukti dan sumber yang terhubung
    const evidenceEntry = researchBrief.evidenceIndex[0];
    const sourceEntry = researchBrief.sourceIndex[0];

    // Bangun seksi-seksi berdasarkan sectionPlan
    for (let i = 0; i < plan.sectionPlan.length; i++) {
      const planItem = plan.sectionPlan[i];
      const sectionId = `sec-${i + 1}-${planItem.purpose.toLowerCase()}`;
      const claimUsageId = `cu-${i + 1}`;

      let content = '';

      if (planItem.purpose === 'HOOK') {
        content = `Banyak yang memperkirakan bahwa kemunculan AI generatif akan mematikan fungsi blog. Namun fakta di lapangan menunjukkan hal sebaliknya: penurunan hanya terjadi pada artikel agregator komoditas.`;
      } else if (planItem.purpose === 'CONTEXT') {
        content = `Dalam lanskap pencarian saat ini, jawaban cepat AI mendominasi pertanyaan permukaan, sementara pertanyaan strategis membutuhkan kedalaman analisis yang hanya bisa dihasilkan oleh riset terstruktur.`;
      } else if (planItem.purpose === 'ARGUMENT') {
        content = plan.thesis || `Argumen utama kami adalah bahwa kepemilikan pengetahuan menjadi benteng pertahanan (moat) terkuat bagi merek di era AI.`;
      } else if (planItem.purpose === 'EVIDENCE') {
        // Jika diminta menyuntikkan ungrounded number
        if (this.config.injectUngroundedNumber) {
          content = `Berdasarkan observasi baru, 99.7% pembuat konten gagal memahami era baru ini tanpa rujukan data.`;
        } else if (this.config.injectInventedQuote) {
          content = `Sebagaimana dinyatakan oleh pakar: "Seluruh strategi blog tradisional sudah sepenuhnya usang dan mati total per hari ini."`;
        } else {
          // Konten valid ter-grounding
          const quoteText = evidenceEntry ? `"${evidenceEntry.quote}"` : '';
          content = `Data empiris menunjukkan bahwa ${primaryClaim.statement} ${quoteText}`;
        }
      } else if (planItem.purpose === 'FRAMEWORK') {
        content = `NexaMOS Content Moat Framework membagi arsitektur konten menjadi tiga pilar: Proprietary Data, Original Interpretation, dan Direct Relationship.`;
      } else if (planItem.purpose === 'COUNTERPOINT') {
        content = `Tentu terdapat limitasi dan pandangan tandingan: tidak semua perusahaan memiliki sumber daya untuk melakukan studi primer berskala besar. Oleh karena itu, batasan metodologi dan asumsi harus selalu transparan diungkapkan.`;
      } else if (planItem.purpose === 'IMPLICATION' || planItem.purpose === 'PRACTICAL_APPLICATION') {
        content = `Implikasi taktis bagi tim editorial adalah menghentikan penulisan berbasis volume dan beralih ke siklus penerbitan yang berbasis evidence grounding.`;
      } else if (planItem.purpose === 'CONCLUSION') {
        content = `Sebagai kesimpulan, blog bukan lagi sekadar alat perolehan klik murah, melainkan sistem saraf pengetahuan inti yang memvalidasi reputasi institusi.`;
      } else {
        content = `Pembahasan mendalam mengenai ${planItem.heading} dengan fokus pada kejelasan dan keandalan data.`;
      }

      // Buat claim usage pada seksi EVIDENCE atau ARGUMENT
      const hasClaim = planItem.purpose === 'EVIDENCE' || planItem.purpose === 'ARGUMENT';
      const sectionClaimIds: string[] = [];

      if (hasClaim && !this.config.injectUngroundedNumber) {
        sectionClaimIds.push(claimUsageId);
        claimUsages.push({
          id: claimUsageId,
          claimId: targetClaimId,
          sectionId,
          usageType: 'DIRECT',
          statement: primaryClaim.statement
        });

        if (sourceEntry && evidenceEntry) {
          citationMap.push({
            claimUsageId,
            claimId: targetClaimId,
            sourceIds: [sourceEntry.sourceId],
            evidenceIds: [evidenceEntry.evidenceId]
          });
        }
      }

      sections.push({
        id: sectionId,
        heading: planItem.heading,
        purpose: planItem.purpose,
        content,
        order: i + 1,
        claimUsageIds: sectionClaimIds
      });
    }

    // Jika commodityOnly aktif, hilangkan seksi FRAMEWORK dan IMPLICATION
    if (this.config.commodityOnly) {
      const filteredSections = sections.filter(
        (s) => s.purpose !== 'FRAMEWORK' && s.purpose !== 'IMPLICATION' && s.purpose !== 'PRACTICAL_APPLICATION'
      );
      sections.length = 0;
      sections.push(...filteredSections);
    }

    return {
      title: plan.workingTitle,
      dek: 'Mengapa era kecerdasan buatan justru meningkatkan nilai kepemilikan pengetahuan dan riset orisinal.',
      slug: topic.slug,
      thesis: plan.thesis,
      editorialAngle: plan.angle,
      sections,
      claimUsages,
      citationMap,
      generatorVersion: 'nexamos-editorial-gen-v1.0-mock',
      promptVersion: 'editorial-prompt-v1.0'
    };
  }

  private buildDefaultSectionPlan(
    articleType: string,
    editorialRole: string,
    brief: any
  ): SectionPlanItem[] {
    if (articleType === 'HOW_TO') {
      return [
        { heading: 'Pengantar & Kebutuhan Taktis', purpose: 'CONTEXT', keyPoints: ['Tantangan saat ini'], plannedClaimIds: [] },
        { heading: 'Framework Langkah Kerja', purpose: 'FRAMEWORK', keyPoints: ['Arsitektur proses'], plannedClaimIds: [] },
        { heading: 'Instruksi Eksekusi Bertahap', purpose: 'PRACTICAL_APPLICATION', keyPoints: ['Langkah 1 sampai 3'], plannedClaimIds: [] },
        { heading: 'Kesimpulan & Evaluasi Hasil', purpose: 'CONCLUSION', keyPoints: ['Metrik keberhasilan'], plannedClaimIds: [] }
      ];
    }

    if (articleType === 'GLOSSARY') {
      return [
        { heading: 'Definisi Konseptual', purpose: 'CONTEXT', keyPoints: ['Definisi inti'], plannedClaimIds: [] },
        { heading: 'Diferensiasi & Ruang Lingkup', purpose: 'ANALYSIS', keyPoints: ['Batasan istilah'], plannedClaimIds: [] }
      ];
    }

    if (articleType === 'ORIGINAL_RESEARCH') {
      return [
        { heading: 'Latar Belakang & Hipotesis', purpose: 'HOOK', keyPoints: ['Tujuan riset'], plannedClaimIds: [] },
        { heading: 'Metodologi & Pengumpulan Data', purpose: 'CONTEXT', keyPoints: ['Populasi & instrumen'], plannedClaimIds: [] },
        { heading: 'Temuan Empiris & Bukti Kunci', purpose: 'EVIDENCE', keyPoints: ['Hasil statistik'], plannedClaimIds: [] },
        { heading: 'Limitasi Metodologi & Risiko Bias', purpose: 'COUNTERPOINT', keyPoints: ['Batasan temuan'], plannedClaimIds: [] },
        { heading: 'Kesimpulan & Implikasi Praktis', purpose: 'CONCLUSION', keyPoints: ['Rekomendasi'], plannedClaimIds: [] }
      ];
    }

    // Default untuk ANALYSIS / FLAGSHIP / AUTHORITY
    const plan: SectionPlanItem[] = [
      { heading: 'Pengantar: Disrupsi Pencarian di Era AI', purpose: 'HOOK', keyPoints: ['Konteks lanskap'], plannedClaimIds: [] },
      { heading: 'Pergeseran Nilai dari Komoditas ke Kepemilikan Pengetahuan', purpose: 'CONTEXT', keyPoints: ['Pemisahan komoditas vs otoritas'], plannedClaimIds: [] },
      { heading: 'Tesis Inti & Argumen Otoritas', purpose: 'ARGUMENT', keyPoints: ['Tesis utama'], plannedClaimIds: [] },
      { heading: 'Bukti Empiris Retensi dan Perilaku Pembaca', purpose: 'EVIDENCE', keyPoints: ['Data retensi 85%'], plannedClaimIds: [] },
      { heading: 'Kerangka Kerja: NexaMOS Content Moat Architecture', purpose: 'FRAMEWORK', keyPoints: ['Tiga pilar benteng'], plannedClaimIds: [] },
      { heading: 'Limitasi Metodologis & Pertimbangan Sumber Daya', purpose: 'COUNTERPOINT', keyPoints: ['Keterbatasan'], plannedClaimIds: [] },
      { heading: 'Implikasi Strategis bagi Penerbitan Modern', purpose: 'IMPLICATION', keyPoints: ['Langkah strategis'], plannedClaimIds: [] },
      { heading: 'Kesimpulan: Masa Depan Blog Sebagai Sistem Pengetahuan', purpose: 'CONCLUSION', keyPoints: ['Sintesis akhir'], plannedClaimIds: [] }
    ];

    if (this.config.omitCounterpointForDisputed) {
      return plan.filter((p) => p.purpose !== 'COUNTERPOINT');
    }

    return plan;
  }
}
