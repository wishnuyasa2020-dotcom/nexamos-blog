/**
 * NexaMOS AI Visibility Recommendations Engine & Anti-GEO-Hack Router
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menghasilkan rekomendasi terarah dengan perutean lintas domain:
 * - Unsupported claim -> RESEARCH
 * - Unclear/overclaimed statement -> EDITORIAL
 * - Indexability / robots problem -> SEO_TECHNICAL
 * - Low information gain -> EDITORIAL / CONTENT_STRATEGY
 * - Missing explanatory visual -> VISUAL_DESIGN
 *
 * DOKTRIN ANTI-GEO-HACK:
 * Dilarang merekomendasikan artificial micro-chunking, entity stuffing, ratusan variasi halaman per prompt,
 * sitasi palsu, atau konsensus pakar fiktif. Semua praktik tersebut ditolak dengan AI_OPTIMIZATION_ABUSE_RISK.
 */

import type { AIVisibilityIssue, AIVisibilityRecommendation } from './ai-visibility-validation.ts';

export class AIVisibilityRecommendationEngine {
  public generate(issues: AIVisibilityIssue[]): AIVisibilityRecommendation[] {
    const recommendations: AIVisibilityRecommendation[] = [];

    for (const issue of issues) {
      switch (issue.code) {
        case 'OVERCLAIMED_STATEMENT':
        case 'UNBOUNDED_ANALYTICAL_CLAIM':
          recommendations.push({
            type: 'CLAIM_CLARIFICATION',
            title: `Klarifikasi Klaim Analitis [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Beri batasan lingkup eksplisit dan hindari generalisasi absolut.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'VAGUE_ANSWERABILITY':
        case 'MISSING_EXPLICIT_CONCLUSION':
          recommendations.push({
            type: 'CONTENT_CLARIFICATION',
            title: `Penajaman Jawaban Substantif [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Pertegas kesimpulan dan implikasi praktis atas pertanyaan pembaca.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'AMBIGUOUS_ENTITY_NAMING':
        case 'UNDEFINED_ACRONYM':
          recommendations.push({
            type: 'ENTITY_CLARIFICATION',
            title: `Disambiguasi Entitas & Terminologi [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Gunakan penamaan entitas resmi dan definisikan akronim pada awal kemunculan.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'UNSUPPORTED_CITATION':
        case 'CRITICAL_GROUNDING_FAILURE':
          recommendations.push({
            type: 'CITATION_IMPROVEMENT',
            title: `Penguatan Bukti dan Sitasi [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Hubungkan klaim dengan temuan riset primer atau rujukan empiris.',
            crossEngineDestination: 'RESEARCH'
          });
          break;

        case 'OPAQUE_AUTHORSHIP':
        case 'UNSPECIFIED_KNOWLEDGE_SOURCE':
          recommendations.push({
            type: 'SOURCE_TRANSPARENCY',
            title: `Transparansi Kepengarangan & Provenance [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Lengkapi profil penulis, institusi penerbit, dan tanggal pembaruan.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'LOW_INFORMATION_GAIN':
        case 'COMMODITY_CONTENT_RISK':
          recommendations.push({
            type: 'INFORMATION_GAIN_IMPROVEMENT',
            title: `Peningkatan Nilai Tambah Informasi [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Integrasikan framework mandiri NexaMOS atau riset unik.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;

        case 'ARTICLE_NOT_INDEXABLE':
        case 'GENERATIVE_AI_SITE_EXCLUDED':
        case 'CRITICAL_CANONICAL_CONFLICT':
        case 'SNIPPET_ELIGIBILITY_WARNING':
          recommendations.push({
            type: 'SEO_TECHNICAL_RETURN',
            title: `Koreksi Kelayakan Teknis Search [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Perbaiki konfigurasi robots, status inklusi Search Console, atau canonical URL.',
            crossEngineDestination: 'SEO_TECHNICAL'
          });
          break;

        case 'CONTENT_INTERACTION_LOCKED':
        case 'PAYWALL_ACCESS_RESTRICTION':
        case 'JS_RENDERING_REVIEW':
          recommendations.push({
            type: 'ACCESSIBILITY_FIX',
            title: `Aksesibilitas Teks Primer [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Pastikan teks utama dapat dirayapi langsung tanpa rintangan interaksi.',
            crossEngineDestination: 'SEO_TECHNICAL'
          });
          break;

        case 'MISSING_EXPLANATORY_VISUAL':
          recommendations.push({
            type: 'MULTIMODAL_IMPROVEMENT',
            title: `Pengayaan Visual Penjelas [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Tambahkan diagram arsitektur atau visual kontekstual.',
            crossEngineDestination: 'VISUAL_DESIGN'
          });
          break;

        case 'AI_OPTIMIZATION_ABUSE_RISK':
          recommendations.push({
            type: 'CONTENT_CLARIFICATION',
            title: `Peringatan Risiko Manipulasi AI (GEO Abuse Risk) [${issue.code}]`,
            description: issue.message,
            suggestedAction: 'Hentikan praktik manipulasi format generatif; fokus pada substansi pemikiran orisinal.',
            crossEngineDestination: 'EDITORIAL',
            isAbuseRiskWarning: true
          });
          break;

        default:
          recommendations.push({
            type: 'CONTENT_CLARIFICATION',
            title: `Klarifikasi Naskah [${issue.code}]`,
            description: issue.message,
            suggestedAction: issue.recommendation || 'Tinjau kembali kesiapan naskah untuk pemahaman AI.',
            crossEngineDestination: 'EDITORIAL'
          });
          break;
      }
    }

    return recommendations;
  }
}
