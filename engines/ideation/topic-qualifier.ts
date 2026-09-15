/**
 * NexaMOS Topic Qualification Engine
 *
 * Sourced from NexaMOS Blog Master Reference & IDE Agent Doctrine v1.0 (Phase 1B)
 *
 * Menjawab pertanyaan: "Apakah candidate topic layak menjadi editorial opportunity NexaMOS?"
 *
 * Melakukan evaluasi 6 gerbang (gates):
 * 1. TERRITORY_FIT
 * 2. AUDIENCE_RELEVANCE
 * 3. KNOWLEDGE_VALUE
 * 4. EVIDENCE_FEASIBILITY
 * 5. NON_COMMODITY_POTENTIAL (dengan Supporting Content Exception)
 * 6. BUSINESS_RELEVANCE
 *
 * Output: QUALIFIED | RESEARCH_REQUIRED | ON_HOLD | REJECTED
 */

import type {
  Topic,
  GateEvaluation,
  QualificationDecision,
  TopicQualificationResult,
  QualificationGateId,
  EditorialRole
} from './domain/topic.types.ts';
import { TERRITORIES } from './domain/territory.ts';

export const QUALIFIER_ENGINE_VERSION = 'v1.0-deterministic';

export interface TopicQualifierOptions {
  evaluatorVersion?: string;
  allowProvisionalThesis?: boolean;
}

/**
 * Mengevaluasi kelayakan topik berdasarkan 6 gerbang editorial
 */
export function qualifyTopic(
  topic: Partial<Topic>,
  options: TopicQualifierOptions = {}
): TopicQualificationResult {
  const version = options.evaluatorVersion || QUALIFIER_ENGINE_VERSION;
  const now = new Date().toISOString();

  // Inisialisasi evaluasi gerbang
  const gates: Record<QualificationGateId, GateEvaluation> = {
    TERRITORY_FIT: evaluateTerritoryFit(topic),
    AUDIENCE_RELEVANCE: evaluateAudienceRelevance(topic),
    KNOWLEDGE_VALUE: evaluateKnowledgeValue(topic),
    EVIDENCE_FEASIBILITY: evaluateEvidenceFeasibility(topic),
    NON_COMMODITY_POTENTIAL: evaluateNonCommodityPotential(topic),
    BUSINESS_RELEVANCE: evaluateBusinessRelevance(topic)
  };

  // Tentukan keputusan akhir berdasarkan status gerbang (Gate-based decision)
  const gateList = Object.values(gates);
  const failGates = gateList.filter((g) => g.status === 'FAIL');
  const unknownGates = gateList.filter((g) => g.status === 'UNKNOWN');

  let decision: QualificationDecision;
  let summary: string;

  if (failGates.length > 0) {
    decision = 'REJECTED';
    const failedNames = failGates.map((g) => g.gate).join(', ');
    summary = `Topik ditolak karena tidak memenuhi gerbang: ${failedNames}.`;
  } else if (gates.EVIDENCE_FEASIBILITY.status === 'UNKNOWN') {
    decision = 'RESEARCH_REQUIRED';
    summary =
      'Topik berpotensi kuat namun membutuhkan riset tambahan untuk memvalidasi kelayakan bukti pendukung.';
  } else if (unknownGates.length > 0) {
    // Jika ada gerbang lain yang belum cukup informasinya
    decision = 'RESEARCH_REQUIRED';
    const unknownNames = unknownGates.map((g) => g.gate).join(', ');
    summary = `Informasi topik belum memadai pada gerbang: ${unknownNames}; diperlukan riset pra-kualifikasi.`;
  } else if (topic.status === 'ON_HOLD') {
    decision = 'ON_HOLD';
    summary = 'Topik memenuhi syarat editorial namun diputuskan untuk ditahan sementara (on hold).';
  } else {
    decision = 'QUALIFIED';
    summary = 'Topik memenuhi seluruh 6 gerbang kualifikasi editorial NexaMOS dan layak masuk pipeline produksi.';
  }

  return {
    decision,
    gates,
    summary,
    qualifiedAt: now,
    evaluatorVersion: version
  };
}

// ============================================================================
// GATE EVALUATORS (PENGUJI GERBANG)
// ============================================================================

/**
 * Gate 1: TERRITORY_FIT
 * Memeriksa apakah topik sesuai dengan salah satu dari 3 territory kanonikal NexaMOS.
 */
function evaluateTerritoryFit(topic: Partial<Topic>): GateEvaluation {
  if (!topic.territory) {
    return {
      gate: 'TERRITORY_FIT',
      status: 'FAIL',
      explanation: 'Territory tidak didefinisikan.'
    };
  }

  if (!TERRITORIES.includes(topic.territory)) {
    return {
      gate: 'TERRITORY_FIT',
      status: 'FAIL',
      explanation: `Territory '${topic.territory}' tidak dikenal dalam doktrin kanonikal NexaMOS.`
    };
  }

  return {
    gate: 'TERRITORY_FIT',
    status: 'PASS',
    explanation: `Sesuai dengan territory kanonikal '${topic.territory}'.`
  };
}

/**
 * Gate 2: AUDIENCE_RELEVANCE
 * Memeriksa apakah target audiens spesifik dan memiliki masalah / Job-to-be-Done yang nyata.
 */
function evaluateAudienceRelevance(topic: Partial<Topic>): GateEvaluation {
  if (!topic.audience || !topic.audience.segment || topic.audience.segment.trim().length === 0) {
    return {
      gate: 'AUDIENCE_RELEVANCE',
      status: 'FAIL',
      explanation: 'Segmen audiens sasaran belum didefinisikan secara spesifik.'
    };
  }

  if (!topic.problem || topic.problem.trim().length === 0) {
    return {
      gate: 'AUDIENCE_RELEVANCE',
      status: 'FAIL',
      explanation: 'Problem atau tantangan spesifik audiens belum dirumuskan.'
    };
  }

  return {
    gate: 'AUDIENCE_RELEVANCE',
    status: 'PASS',
    explanation: `Menargetkan segmen '${topic.audience.segment}' dengan artikulasi problem yang jelas.`
  };
}

/**
 * Gate 3: KNOWLEDGE_VALUE
 * Memeriksa apakah topik menjanjikan kebaruan pengetahuan (information gain) dan bukan sekadar pengulangan.
 */
function evaluateKnowledgeValue(topic: Partial<Topic>): GateEvaluation {
  const infoGain = topic.informationGain;
  if (!infoGain) {
    return {
      gate: 'KNOWLEDGE_VALUE',
      status: 'FAIL',
      explanation: 'Spesifikasi information gain belum disediakan.'
    };
  }

  if (!infoGain.expectedContribution || infoGain.expectedContribution.trim().length === 0) {
    return {
      gate: 'KNOWLEDGE_VALUE',
      status: 'FAIL',
      explanation: 'Kontribusi unik (expected contribution) topik tidak didefinisikan.'
    };
  }

  // Jika editorialRole adalah SUPPORTING / REFERENCE, information gain boleh berupa foundational completeness
  const isSupporting = isSupportingRole(topic.editorialRole);
  if (isSupporting) {
    return {
      gate: 'KNOWLEDGE_VALUE',
      status: 'PASS',
      explanation: 'Memberikan nilai kelengkapan referensi/glosarium untuk arsitektur klaster topik.'
    };
  }

  if (!infoGain.originalityType || infoGain.originalityType.length === 0) {
    return {
      gate: 'KNOWLEDGE_VALUE',
      status: 'FAIL',
      explanation: 'Tidak ada originalityType yang dipilih untuk membuktikan kebaruan pengetahuan.'
    };
  }

  return {
    gate: 'KNOWLEDGE_VALUE',
    status: 'PASS',
    explanation: `Menyediakan nilai kebaruan melalui: ${infoGain.originalityType.join(', ')}.`
  };
}

/**
 * Gate 4: EVIDENCE_FEASIBILITY
 * Memeriksa kelayakan dan ketersediaan rencana bukti pendukung (E0-E4).
 */
function evaluateEvidenceFeasibility(topic: Partial<Topic>): GateEvaluation {
  const plan = topic.evidencePlan;
  if (!plan) {
    return {
      gate: 'EVIDENCE_FEASIBILITY',
      status: 'FAIL',
      explanation: 'Rencana bukti (evidencePlan) belum disusun.'
    };
  }

  // E0 = Unsupported: Tidak ada bukti pendukung
  if (plan.requiredEvidenceLevel === 'E0') {
    return {
      gate: 'EVIDENCE_FEASIBILITY',
      status: 'FAIL',
      explanation: 'Standar bukti E0 (Unsupported) tidak memenuhi syarat kualifikasi artikel editorial NexaMOS.'
    };
  }

  // Jika membutuhkan E3 (Primary) atau E4 (Original), namun plannedSources kosong dan bukan supporting role
  const needsPrimaryOrOriginal = plan.requiredEvidenceLevel === 'E3' || plan.requiredEvidenceLevel === 'E4';
  if (needsPrimaryOrOriginal) {
    if (!plan.plannedSources || plan.plannedSources.length === 0) {
      return {
        gate: 'EVIDENCE_FEASIBILITY',
        status: 'UNKNOWN',
        explanation: `Topik membutuhkan bukti tingkat ${plan.requiredEvidenceLevel}, namun sumber data terencana belum dipetakan. Riset awal diwajibkan.`
      };
    }
  }

  // Jika E1 (Common knowledge) untuk role SUPPORTING/REFERENCE
  if (plan.requiredEvidenceLevel === 'E1') {
    return {
      gate: 'EVIDENCE_FEASIBILITY',
      status: 'PASS',
      explanation: 'Bukti berbasis common knowledge memadai untuk konten penjelas/referensi.'
    };
  }

  // Jika memiliki plannedSources
  if (plan.plannedSources && plan.plannedSources.length > 0) {
    return {
      gate: 'EVIDENCE_FEASIBILITY',
      status: 'PASS',
      explanation: `Rencana bukti tingkat ${plan.requiredEvidenceLevel} didukung ${plan.plannedSources.length} sumber terencana.`
    };
  }

  return {
    gate: 'EVIDENCE_FEASIBILITY',
    status: 'UNKNOWN',
    explanation: 'Kelayakan bukti masih memerlukan klarifikasi sumber data.'
  };
}

/**
 * Gate 5: NON_COMMODITY_POTENTIAL
 * Menguji risiko komoditisasi konten dan mengecek Supporting Content Exception.
 */
function evaluateNonCommodityPotential(topic: Partial<Topic>): GateEvaluation {
  const infoGain = topic.informationGain;
  const commodityRisk = infoGain?.commodityRisk ?? 'UNKNOWN';
  const role = topic.editorialRole;

  // EXCEPTION: Supporting Content Exception
  // Konten komoditas (misal "Apa itu CRM?") dapat lolos jika fungsinya adalah SUPPORTING atau REFERENCE
  if (isSupportingRole(role)) {
    return {
      gate: 'NON_COMMODITY_POTENTIAL',
      status: 'PASS',
      explanation: `Lolos melalui Supporting Content Exception (peran: ${role}) untuk fungsi klaster dan glosarium.`
    };
  }

  // Jika risiko komoditas LOW atau MEDIUM
  if (commodityRisk === 'LOW' || commodityRisk === 'MEDIUM') {
    return {
      gate: 'NON_COMMODITY_POTENTIAL',
      status: 'PASS',
      explanation: `Potensi non-komoditas aman (risiko komoditas: ${commodityRisk}).`
    };
  }

  // Jika risiko komoditas HIGH:
  // Cek apakah ada rencana diferensiasi yang kredibel (originalityType beragam dan expectedContribution kuat)
  if (commodityRisk === 'HIGH') {
    const hasOriginalityTypes = infoGain?.originalityType && infoGain.originalityType.length > 0;
    const hasSubstantiveContribution =
      infoGain?.expectedContribution && infoGain.expectedContribution.trim().length > 30;

    if (hasOriginalityTypes && hasSubstantiveContribution) {
      return {
        gate: 'NON_COMMODITY_POTENTIAL',
        status: 'PASS',
        explanation:
          'Risiko komoditas awal tinggi, namun memenuhi syarat melalui rencana diferensiasi intelektual yang kredibel.'
      };
    }

    return {
      gate: 'NON_COMMODITY_POTENTIAL',
      status: 'FAIL',
      explanation:
        'Risiko komoditas tinggi dan tidak ada rencana diferensiasi atau kebaruan informasi yang kredibel.'
    };
  }

  return {
    gate: 'NON_COMMODITY_POTENTIAL',
    status: 'UNKNOWN',
    explanation: 'Tingkat risiko komoditas belum dapat ditentukan.'
  };
}

/**
 * Gate 6: BUSINESS_RELEVANCE
 * Memeriksa keselarasan topik dengan tujuan bisnis dan perjalanan pengetahuan/pelanggan NexaMOS.
 */
function evaluateBusinessRelevance(topic: Partial<Topic>): GateEvaluation {
  const biz = topic.businessRelevance;
  if (!biz) {
    return {
      gate: 'BUSINESS_RELEVANCE',
      status: 'FAIL',
      explanation: 'Relevansi bisnis (businessRelevance) belum ditentukan.'
    };
  }

  if (!biz.objective || biz.objective.trim().length === 0) {
    return {
      gate: 'BUSINESS_RELEVANCE',
      status: 'FAIL',
      explanation: 'Tujuan strategis bisnis (objective) tidak didefinisikan.'
    };
  }

  if (!biz.funnelRole || biz.funnelRole.trim().length === 0) {
    return {
      gate: 'BUSINESS_RELEVANCE',
      status: 'FAIL',
      explanation: 'Peran dalam knowledge/customer journey (funnelRole) tidak didefinisikan.'
    };
  }

  return {
    gate: 'BUSINESS_RELEVANCE',
    status: 'PASS',
    explanation: `Mendukung sasaran bisnis '${biz.objective}' pada fase '${biz.funnelRole}'.`
  };
}

/**
 * Helper: Cek apakah peran editorial adalah konten pendukung/referensi
 */
function isSupportingRole(role?: EditorialRole | null): boolean {
  return role === 'SUPPORTING' || role === 'REFERENCE';
}
