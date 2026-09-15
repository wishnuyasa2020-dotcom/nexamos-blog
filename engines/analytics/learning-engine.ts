/**
 * NexaMOS Content Learning Engine
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Sections 26, 27).
 * Hard Principles:
 * - LEARNING ≠ UNIVERSAL RULE.
 * - Mengekstrak kesimpulan operasional yang terikat konteks (territory, articleType, audience).
 * - Menolak generalisasi sweeping yang memaksakan satu temuan menjadi aturan mutlak.
 */

import type { ArticlePerformanceSnapshot } from './performance-snapshot.ts';
import type { PerformanceDiagnosis } from './performance-diagnosis.ts';
import type { ContentLearning, ContentLearningType } from './content-learning.ts';
import { validateContentLearningScope } from './content-learning.ts';

export class LearningEngine {
  /**
   * Mengekstrak pembelajaran operasional dari diagnosis performa
   */
  public extractLearnings(params: {
    snapshot: ArticlePerformanceSnapshot;
    diagnoses: PerformanceDiagnosis[];
  }): ContentLearning[] {
    const { snapshot, diagnoses } = params;
    const learnings: ContentLearning[] = [];

    for (const diag of diagnoses) {
      let learningType: ContentLearningType = 'TOPIC_LEARNING';
      let statement = '';

      switch (diag.diagnosisType) {
        case 'SEARCH_PRESENTATION_WEAKNESS': {
          learningType = 'TITLE_LEARNING';
          statement = `Pada artikel ${snapshot.articleType} di teritori ${snapshot.territory}, formulasi judul dengan intent eksplisit mendatangkan impresi besar namun membutuhkan snippet deskriptif yang lebih tajam untuk mengonversi klik pembaca.`;
          break;
        }

        case 'STRONG_CONTENT_WEAK_DISTRIBUTION': {
          learningType = 'DISTRIBUTION_LEARNING';
          statement = `Kedalaman naskah artikel bertema "${snapshot.slug}" membuktikan retensi tinggi pada segmen pembaca target; penguatan klaster tautan internal dari artikel ber-traffic lebih tinggi direkomendasikan untuk memperluas jangkauan.`;
          break;
        }

        case 'STRONG_DISTRIBUTION_WEAK_ENGAGEMENT': {
          learningType = 'ENGAGEMENT_LEARNING';
          statement = `Daya tarik distribusi pembuka tinggi pada format ${snapshot.articleType}, tetapi seksi awal naskah perlu diperbaiki agar langsung menjawab problem pembaca tanpa pengantar yang terlalu bertele-tele.`;
          break;
        }

        case 'CONTENT_REFRESH_OPPORTUNITY': {
          learningType = 'FRESHNESS_LEARNING';
          statement = `Topik analisis data ini menunjukkan siklus peluruhan visibilitas setelah periode publikasi tertentu; peninjauan berkala terhadap bukti primer diperlukan untuk menjaga otoritas topik.`;
          break;
        }

        case 'AI_VISIBILITY_GAIN': {
          learningType = 'AI_VISIBILITY_LEARNING';
          statement = `Struktur artikel dengan batasan klaim terikat dan tabel data terbukti efektif terpilih dalam sintesis Generative AI Search pada ranah ${snapshot.territory}.`;
          break;
        }

        default:
          continue;
      }

      const learning: ContentLearning = {
        id: `learn-${snapshot.articleId}-${Date.now()}-${learnings.length}`,
        articleId: snapshot.articleId,
        topicId: snapshot.topicId,
        learningType,
        statement,
        supportingSignals: diag.signals.map((s) => s.id),
        supportingDiagnoses: [diag.id],
        confidence: diag.confidence,
        applicableTo: {
          territories: [snapshot.territory],
          articleTypes: [snapshot.articleType],
          contextualScope: `Artikel teritori ${snapshot.territory} bertipe ${snapshot.articleType}`,
          isUniversalRule: false // Penegakan doktrin non-universal
        },
        createdAt: new Date().toISOString()
      };

      // Validasi doktrin
      const scopeCheck = validateContentLearningScope(learning);
      if (!scopeCheck.isValid) {
        throw new Error(`Pelanggaran Doktrin Learning: ${scopeCheck.message}`);
      }

      learnings.push(learning);
    }

    return learnings;
  }
}
