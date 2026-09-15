/**
 * NexaMOS Mock AI Research Provider
 *
 * Sourced from NexaMOS Blog Phase 2D specifications
 * Implementasi in-memory terstruktur dari AIResearchProvider untuk testing
 * tanpa memanggil API eksternal berbayar.
 */

import type {
  AIResearchProvider,
  AIProviderMetadata,
  PlanResearchInput,
  AnalyzeGapsInput,
  AIGapAnalysisProposal,
  ProposeClaimsInput,
  ProposedClaim,
  AssistSynthesisInput,
  AISynthesisAssistance
} from '../ai-research-provider.ts';
import type { ResearchPlanProposal } from '../research-plan.ts';
import type { Result, ResearchDomainError } from '../../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../../domain/research-result.ts';

export interface MockAIResearchProviderOptions {
  providerName?: string;
  modelName?: string;
  promptVersion?: string;
  customPlanProposal?: ResearchPlanProposal;
  customGapAnalysis?: AIGapAnalysisProposal;
  customClaims?: ProposedClaim[];
  customSynthesis?: AISynthesisAssistance;
  simulateMalformedPlan?: boolean;
  simulateMalformedGaps?: boolean;
  simulateMalformedClaims?: boolean;
  simulateMalformedSynthesis?: boolean;
  simulateError?: string;
}

export class MockAIResearchProvider implements AIResearchProvider {
  private options: MockAIResearchProviderOptions;

  constructor(options: MockAIResearchProviderOptions = {}) {
    this.options = {
      providerName: 'mock-ai-provider',
      modelName: 'mock-reasoning-v1',
      promptVersion: '1.0.0',
      ...options
    };
  }

  getMetadata(): AIProviderMetadata {
    return {
      providerName: this.options.providerName || 'mock-ai-provider',
      modelName: this.options.modelName || 'mock-reasoning-v1',
      promptVersion: this.options.promptVersion || '1.0.0'
    };
  }

  setOptions(options: Partial<MockAIResearchProviderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  async planResearch(input: PlanResearchInput): Promise<Result<ResearchPlanProposal, ResearchDomainError>> {
    if (this.options.simulateError) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', this.options.simulateError));
    }

    if (this.options.simulateMalformedPlan) {
      // Mengembalikan objek tidak valid / malformed
      return err(createResearchDomainError('AI_OUTPUT_INVALID', 'AI plan proposal structure is malformed or unparseable.'));
    }

    if (this.options.customPlanProposal) {
      return ok(this.options.customPlanProposal);
    }

    // Default proposal berbasis topik
    const title = input.topic.title;
    const isBlogRelevance = title.toLowerCase().includes('blog') && title.toLowerCase().includes('ai');

    if (isBlogRelevance) {
      return ok({
        objective: 'Menyelidiki pergeseran relevansi, model bisnis, dan performa trafik aktivitas blog di era AI Search.',
        researchQuestions: [
          {
            question: 'Bagaimana tren traffic blog independen setelah kehadiran Google AI Overviews?',
            targetEvidenceLevel: 'E2',
            priority: 'CRITICAL'
          },
          {
            question: 'Apakah blog berbasis personal branding atau riset mendalam memiliki retensi audiens lebih tinggi dibandingkan content-farm?',
            targetEvidenceLevel: 'E2',
            priority: 'CRITICAL'
          },
          {
            question: 'Apakah aktivitas blog masih memiliki ROI bisnis positif bagi bisnis B2B di tahun 2025/2026?',
            targetEvidenceLevel: 'E2',
            priority: 'IMPORTANT'
          }
        ],
        requiredEvidenceLevel: input.topic.evidencePlan.requiredEvidenceLevel || 'E2',
        preferredSourceTypes: ['INDUSTRY_RESEARCH', 'DATASET', 'PRIMARY_RESEARCH'],
        counterEvidenceRequired: true,
        freshnessRequirement: 'HIGH',
        suggestedIterations: 3,
        rationale: 'Topik AI search mengalami volatilitas tinggi sehingga memerlukan data empiris mutakhir dan bukti tandingan.'
      });
    }

    return ok({
      objective: `Meneliti bukti empiris dan data industri untuk topik: ${title}`,
      researchQuestions: [
        {
          question: `Apa fakta dan data fundamental terkait ${title}?`,
          targetEvidenceLevel: input.topic.evidencePlan.requiredEvidenceLevel || 'E2',
          priority: 'CRITICAL'
        }
      ],
      requiredEvidenceLevel: input.topic.evidencePlan.requiredEvidenceLevel || 'E2',
      preferredSourceTypes: ['INDUSTRY_RESEARCH', 'ACADEMIC_PAPER'],
      counterEvidenceRequired: false,
      freshnessRequirement: 'MEDIUM',
      suggestedIterations: 2,
      rationale: 'Proposal standar untuk eksplorasi bukti kanonikal.'
    });
  }

  async analyzeResearchGaps(input: AnalyzeGapsInput): Promise<Result<AIGapAnalysisProposal, ResearchDomainError>> {
    if (this.options.simulateError) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', this.options.simulateError));
    }

    if (this.options.simulateMalformedGaps) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', 'AI gap analysis returned invalid format.'));
    }

    if (this.options.customGapAnalysis) {
      return ok(this.options.customGapAnalysis);
    }

    // Evaluasi cerdas bawaan mock
    const gaps: AIGapAnalysisProposal['priorityGaps'] = [];
    const actions: AIGapAnalysisProposal['suggestedActions'] = [];

    // 1. Cek apakah ada klaim causal/comparative tanpa counter-evidence
    const hasCausalOrCompClaim = input.claims.some(
      (c) => c.claimType === 'CAUSAL' || c.claimType === 'COMPARATIVE'
    );
    const hasMissingCounterGap = input.currentGaps.some((g) => g.type === 'MISSING_COUNTER_EVIDENCE');

    if (hasCausalOrCompClaim && !hasMissingCounterGap) {
      // Usulkan gap jika belum ada counter evidence yang memadai
      const uncounteredClaim = input.claims.find((c) => c.claimType === 'CAUSAL' || c.claimType === 'COMPARATIVE');
      gaps.push({
        type: 'MISSING_COUNTER_EVIDENCE',
        description: `Klaim kausal '${uncounteredClaim?.statement}' membutuhkan bukti tandingan untuk mencegah bias konfirmasi.`,
        claimId: uncounteredClaim?.id
      });
      actions.push({
        action: 'SEARCH_COUNTER_EVIDENCE',
        reason: 'Ditemukan klaim kausal/komparatif penting yang membutuhkan verifikasi bukti tandingan.',
        focusClaimId: uncounteredClaim?.id
      });
    }

    // 2. Cek apakah ada data stale pada volatilitas tinggi
    if (input.topicVolatility === 'HIGH') {
      const hasFreshnessGap = input.currentGaps.some((g) => g.type === 'MISSING_CURRENT_DATA');
      if (hasFreshnessGap) {
        gaps.push({
          type: 'MISSING_CURRENT_DATA',
          description: 'Volatilitas topik tinggi menuntut penelusuran data mutakhir.'
        });
        actions.push({
          action: 'SEARCH_CURRENT_DATA',
          reason: 'Topik berfluktuasi cepat dan beberapa bukti telah melewati masa kebaruan optimal.'
        });
      }
    }

    // 3. Cek apakah ada kontradiksi tajam
    const hasContradiction = input.currentGaps.some((g) => g.type === 'UNRESOLVED_CONTRADICTION');
    if (hasContradiction) {
      actions.push({
        action: 'REQUEST_HUMAN_REVIEW',
        reason: 'Terdapat kontradiksi tajam antar sumber yang membutuhkan penilaian manusia.'
      });
    }

    // Default action jika tidak ada masalah khusus
    if (actions.length === 0) {
      if (input.synthesis.readiness === 'READY_FOR_EDITORIAL') {
        actions.push({
          action: 'SYNTHESIZE',
          reason: 'Bukti telah memadai untuk perumusan sintesis akhir.'
        });
      } else {
        actions.push({
          action: 'SEARCH_MORE',
          reason: 'Dibutuhkan penelusuran sumber tambahan untuk memenuhi kecukupan bukti.'
        });
      }
    }

    return ok({
      gapSummary: gaps.length > 0 ? `Ditemukan ${gaps.length} kesenjangan bukti.` : 'Tidak ada kesenjangan kritis.',
      priorityGaps: gaps,
      suggestedActions: actions
    });
  }

  async proposeClaims(input: ProposeClaimsInput): Promise<Result<ProposedClaim[], ResearchDomainError>> {
    if (this.options.simulateError) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', this.options.simulateError));
    }

    if (this.options.simulateMalformedClaims) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', 'AI claim proposal malformed.'));
    }

    if (this.options.customClaims) {
      return ok(this.options.customClaims);
    }

    // Ekstrak usulan klaim dari bukti yang ada
    const claims: ProposedClaim[] = [];

    for (const ev of input.evidence) {
      const text = (ev.content || '').toLowerCase();
      if (text.includes('blog') || text.includes('traffic') || text.includes('relevan') || text.includes('organic')) {
        claims.push({
          statement: `Aktivitas blog yang berfokus pada konten orisinal dan studi kasus tetap mencatatkan retensi pembaca yang stabil di era AI Search.`,
          claimType: 'COMPARATIVE',
          importance: 'CRITICAL',
          rationale: `Berdasarkan bukti empiris dari kutipan: "${(ev.content || '').slice(0, 80)}..."`
        });
        claims.push({
          statement: `Penerapan ringkasan otomatis AI menyebabkan penurunan CTR pada artikel bertipe definisi umum (commodity content).`,
          claimType: 'CAUSAL',
          importance: 'CRITICAL',
          rationale: 'Menggambarkan fenomena pergeseran traffic pencarian.'
        });
        break;
      }
    }

    if (claims.length === 0 && input.evidence.length > 0) {
      claims.push({
        statement: `Bukti terindeks menunjukkan fakta operasional terkait topik.`,
        claimType: 'FACTUAL',
        importance: 'SUPPORTING',
        rationale: 'Klaim awal berdasarkan bukti pertama yang diekstraksi.'
      });
    }

    return ok(claims);
  }

  async assistSynthesis(input: AssistSynthesisInput): Promise<Result<AISynthesisAssistance, ResearchDomainError>> {
    if (this.options.simulateError) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', this.options.simulateError));
    }

    if (this.options.simulateMalformedSynthesis) {
      return err(createResearchDomainError('AI_OUTPUT_INVALID', 'AI synthesis response malformed.'));
    }

    if (this.options.customSynthesis) {
      return ok(this.options.customSynthesis);
    }

    return ok({
      recommendedEditorialAngle:
        'Mengapa Blog Tidak Mati, Melainkan Bergeser dari Mesin SEO Menjadi Pusat Otoritas dan Kepercayaan di Era AI.',
      editorialNotes: [
        'Tekankan pergeseran dari volume artikel komoditas ke kedalaman eksperimen dan data primer.',
        'Sajikan data penurunan klik artikel definisi bersamaan dengan data bertahannya blog berbasis opini pakar.',
        'Gunakan contoh konkret alur riset untuk memperkuat posisi Otoritas NexaMOS.'
      ],
      confidenceSummary:
        'Sintesis didukung kuat oleh temuan industri empiris, namun artikel perlu mencantumkan batasan bahwa dampak AI Search terus berevolusi.'
    });
  }
}
