/**
 * NexaMOS Feedback Router & Closed Loop Orchestrator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Sections 28, 29, 30, 31, 32, 50).
 * Hard Principles:
 * - NO AUTO-OPTIMIZATION LOOP: Dilarang keras melakukan auto-rewrite atau hot-republish artikel.
 * - Closed Loop ke Phase 1: FollowUpTopicProposal masuk ke Topic Lifecycle dengan status CAPTURED (tidak boleh bypass ke APPROVED).
 * - Closed Loop ke Phase 2: ResearchRefreshRequest disalurkan ke Research Engine.
 * - Editorial changes wajib melalui siklus Phase 4 (Validator) → Phase 5 (Distribution Gate) → Phase 6 (Publishing).
 * - CRITICAL priority hanya untuk tracking error atau korupsi data, bukan penurunan traffic.
 */

import type { PerformanceDiagnosis } from './performance-diagnosis.ts';
import type { ContentLearning } from './content-learning.ts';
import type {
  FeedbackAction,
  FollowUpTopicProposal,
  ResearchRefreshRequest
} from './feedback-action.ts';
import type { ArticlePerformanceSnapshot } from './performance-snapshot.ts';
import type { TopicManagementService } from '../ideation/topic-management-service.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';

export class FeedbackRouter {
  private topicService?: TopicManagementService;

  constructor(topicService?: TopicManagementService) {
    this.topicService = topicService;
  }

  /**
   * Menghasilkan daftar FeedbackAction dari diagnosis dan snapshot
   */
  public proposeActions(params: {
    snapshot: ArticlePerformanceSnapshot;
    diagnoses: PerformanceDiagnosis[];
    learnings: ContentLearning[];
  }): FeedbackAction[] {
    const { snapshot, diagnoses } = params;
    const actions: FeedbackAction[] = [];

    for (const diag of diagnoses) {
      switch (diag.diagnosisType) {
        // 1. Masalah Presentasi Search -> Rute SEO / Editorial (Tinjau judul / meta)
        case 'SEARCH_PRESENTATION_WEAKNESS': {
          actions.push({
            id: `action-seo-title-${Date.now()}-${actions.length}`,
            target: 'SEO',
            actionType: 'TEST_TITLE',
            priority: 'MEDIUM', // Bukan CRITICAL, penurunan/kelemahan CTR adalah evaluasi editorial biasa
            reason:
              'CTR organik berada di bawah median kohort. Direkomendasikan evaluasi judul dan meta description di alur editorial.',
            originArticleId: snapshot.articleId,
            supportingDiagnosisIds: [diag.id],
            payload: {
              recommendedNotes:
                'Uji variasi judul dengan kejelasan problem langsung tanpa sensasionalisme. Perubahan wajib melalui Editorial Validator dan Distribution Gate sebelum versi baru diterbitkan.'
            },
            status: 'PROPOSED',
            createdAt: new Date().toISOString()
          });
          break;
        }

        // 2. Konten Kuat tetapi Distribusi Lemah -> Rute Editorial (Internal Linking)
        case 'STRONG_CONTENT_WEAK_DISTRIBUTION': {
          actions.push({
            id: `action-dist-link-${Date.now()}-${actions.length}`,
            target: 'EDITORIAL',
            actionType: 'IMPROVE_INTERNAL_LINKING',
            priority: 'LOW',
            reason:
              'Engagement pembaca tinggi namun jangkauan pembaca masih sempit. Disarankan menambahkan tautan kontekstual dari artikel terbit lain yang relevan.',
            originArticleId: snapshot.articleId,
            supportingDiagnosisIds: [diag.id],
            payload: {
              recommendedNotes: 'Tambahkan backlink internal dari artikel terbit dengan traffic organik mapan.'
            },
            status: 'PROPOSED',
            createdAt: new Date().toISOString()
          });
          break;
        }

        // 3. Peluang Penyegaran Konten -> Rute Research Engine (Phase 2)
        case 'CONTENT_REFRESH_OPPORTUNITY': {
          const refreshRequest: ResearchRefreshRequest = {
            articleId: snapshot.articleId,
            topicId: snapshot.topicId,
            reason: 'Penurunan impresi pencarian konsisten terdeteksi; bukti data primer memerlukan penyegaran.',
            staleEvidenceIdentified: ['Data benchmark tahun sebelumnya', 'Statistik industri yang telah usang'],
            suggestedFocusAreas: ['Kompilasi studi observasional mutakhir tahun berjalan'],
            requestedAt: new Date().toISOString()
          };

          actions.push({
            id: `action-research-refresh-${Date.now()}-${actions.length}`,
            target: 'RESEARCH',
            actionType: 'REFRESH_RESEARCH',
            priority: 'MEDIUM',
            reason:
              'Siklus peluruhan visibilitas terdeteksi. Permintaan penyegaran riset diajukan ke Phase 2 Research Engine.',
            originArticleId: snapshot.articleId,
            supportingDiagnosisIds: [diag.id],
            payload: {
              researchRefreshRequest: refreshRequest
            },
            status: 'PROPOSED',
            createdAt: new Date().toISOString()
          });
          break;
        }

        // 4. Kemenangan Visibilitas AI / Otoritas -> Rute Topic Engine (Phase 1 Follow-up Topic)
        case 'AI_VISIBILITY_GAIN': {
          const followUpProposal: FollowUpTopicProposal = {
            proposedTitle: `Eksplorasi Lanjutan: Implementasi Praktis pada Ranah ${snapshot.territory}`,
            problem: `Bagaimana organisasi mengimplementasikan rekomendasi dari artikel "${snapshot.slug}" secara operasional di lapangan?`,
            audienceSegment: 'Enterprise Technical Leaders',
            primaryIntent: 'Menyediakan panduan implementasi taktis dari kerangka kerja yang telah mapan',
            suggestedTerritory: snapshot.territory,
            recommendedArticleType: 'HOW_TO',
            originArticleId: snapshot.articleId,
            rationaleSignals: diag.signals.map((s) => s.signalType)
          };

          actions.push({
            id: `action-topic-proposal-${Date.now()}-${actions.length}`,
            target: 'TOPIC',
            actionType: 'PRIORITIZE_FOLLOW_UP',
            priority: 'MEDIUM',
            reason:
              'Keterpilihan artikel pada ruang Generative AI Search mengindikasikan minat tinggi pasar; diusulkan topik turunan baru ke Phase 1.',
            originArticleId: snapshot.articleId,
            supportingDiagnosisIds: [diag.id],
            payload: {
              followUpTopicProposal: followUpProposal
            },
            status: 'PROPOSED',
            createdAt: new Date().toISOString()
          });
          break;
        }

        default:
          break;
      }
    }

    return actions;
  }

  /**
   * Mengeksekusi perutean tindakan ke subsistem terkait
   * Menjamin Topic masuk dengan status CAPTURED (tidak bypass ke APPROVED)
   */
  public async routeAction(action: FeedbackAction): Promise<{
    routed: boolean;
    createdTopic?: Topic;
    details?: string;
  }> {
    if (action.target === 'TOPIC' && action.payload?.followUpTopicProposal) {
      if (!this.topicService) {
        return {
          routed: false,
          details: 'TopicManagementService tidak terpasang pada FeedbackRouter; routing ditunda.'
        };
      }

      const proposal = action.payload.followUpTopicProposal;

      // PENTING: Membuat Topic di Phase 1 dengan status awal 'CAPTURED'
      // Analytics TIDAK BOLEH mengubah status langsung menjadi APPROVED!
      const topicResult = await this.topicService.captureTopic({
        title: proposal.proposedTitle,
        slug: `follow-up-${proposal.originArticleId}-${Date.now().toString(36)}`,
        territory: proposal.suggestedTerritory,
        status: 'CAPTURED', // Status wajib doktrin: harus melalui screening & kualifikasi Phase 1
        audience: {
          segment: proposal.audienceSegment
        },
        problem: proposal.problem,
        intent: {
          primary: proposal.primaryIntent
        },
        thesis: null,
        whyNow: 'Dihasilkan secara deterministik dari sinyal performa artikel terbit terdahulu.',
        informationGain: {
          expectedContribution: 'Melanjutkan studi kasus empiris dari artikel induk yang telah terbukti kuat.',
          originalityType: ['ORIGINAL_DATA'],
          commodityRisk: 'LOW'
        },
        evidencePlan: {
          requiredEvidenceLevel: 'E2',
          plannedSources: ['Internal Benchmark Study'],
          originalEvidenceRequired: true
        },
        businessRelevance: {
          objective: 'Peluang Topik Lanjutan dari Feedback Loop',
          funnelRole: 'MOFU'
        },
        recommendedArticleType: proposal.recommendedArticleType,
        distributionTargets: ['GOOGLE_SEARCH', 'GOOGLE_AI']
      });

      if (!topicResult.ok || !topicResult.value) {
        throw new Error(`Gagal merutekan FollowUpTopicProposal ke Phase 1: ${topicResult.error?.message}`);
      }

      action.status = 'ROUTED';
      action.routedAt = new Date().toISOString();

      return {
        routed: true,
        createdTopic: topicResult.value,
        details: `Topik baru berhasil dibuat di Phase 1 dengan status 'CAPTURED' (ID: ${topicResult.value.id}). Menunggu kualifikasi kanonikal.`
      };
    }

    action.status = 'ROUTED';
    action.routedAt = new Date().toISOString();

    return {
      routed: true,
      details: `Action berhasil dirutekan ke target domain '${action.target}' untuk ditindaklanjuti secara editorial.`
    };
  }
}
