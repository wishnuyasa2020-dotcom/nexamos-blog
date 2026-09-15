/**
 * NexaMOS Google Discover Topical Expertise Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Google Discover 2026 Core Update menilai keahlian situs secara spesifik per topik (topic-by-topic expertise).
 * Model Otoritas: ARTICLE -> TOPIC -> KNOWLEDGE CLUSTER -> TERRITORY
 * Menandai ISOLATED_TOPIC_RISK jika artikel merupakan topik acak tanpa kaitan kluster pengetahuan NexaMOS.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ExistingArticleIndexItem } from '../seo-validator/internal-link.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverTopicalExpertiseStatus =
  | 'ESTABLISHED'
  | 'DEVELOPING'
  | 'WEAK'
  | 'UNKNOWN';

export interface DiscoverTopicalExpertiseValidationResult {
  expertiseStatus: DiscoverTopicalExpertiseStatus;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 15
  issues: DiscoverIssue[];
}

export class DiscoverTopicExpertiseValidator {
  private readonly validTerritories = new Set(['INTELLIGENCE', 'STRATEGY', 'TACTICAL']);

  public validate(
    draft: ArticleDraft,
    topic?: Topic | null,
    inventory: ExistingArticleIndexItem[] = []
  ): DiscoverTopicalExpertiseValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 15; // Bobot penuh Topical Expertise = 15
    let status: DiscoverTopicalExpertiseStatus = 'DEVELOPING';

    const territory = draft.territory || topic?.territory;

    // 1. Validasi Keterikatan Territory Pengetahuan
    if (!territory || !this.validTerritories.has(territory)) {
      status = 'UNKNOWN';
      score = 4;
      issues.push({
        code: 'ISOLATED_TOPIC_RISK',
        checkId: 'DISCOVER_TOPICAL_EXPERTISE',
        dimension: 'TOPICAL_EXPERTISE',
        severity: 'CRITICAL',
        message: 'Artikel tidak memiliki territory pengetahuan NexaMOS yang sah (INTELLIGENCE, STRATEGY, TACTICAL).',
        location: 'draft.territory',
        recommendation: 'Petakan artikel ke salah satu territory pengetahuan resmi NexaMOS.'
      });
      return {
        expertiseStatus: status,
        checkResult: {
          checkId: 'DISCOVER_TOPICAL_EXPERTISE',
          dimension: 'TOPICAL_EXPERTISE',
          status: 'FAIL',
          scoreContribution: score,
          summary: 'Territory pengetahuan tidak terdefinisi.'
        },
        score,
        issues
      };
    }

    // 2. Evaluasi Kluster Pengetahuan Berdasarkan Inventori Artikel Terpublikasi
    // Cari artikel lain dalam territory yang sama, topicId, atau kata kunci tumpang tindih
    const draftWords = draft.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const territoryKey = territory.toLowerCase();

    const isTerritoryMatch = (term: string) => {
      const t = term.toLowerCase();
      if (territoryKey === 'strategy' && (t === 'strategi' || t === 'strategy')) return true;
      if (territoryKey === 'tactical' && (t === 'taktikal' || t === 'tactical' || t === 'taktik')) return true;
      if (territoryKey === 'intelligence' && (t === 'intelijen' || t === 'intelligence')) return true;
      return territoryKey === t;
    };

    const relatedArticles = inventory.filter((a) => {
      if (a.id === draft.id) return false;
      const anyArt = a as any;
      if (a.territory && isTerritoryMatch(a.territory)) return true;
      if (anyArt.territory && isTerritoryMatch(anyArt.territory)) return true;
      if (a.topicId === draft.topicId || anyArt.topicId === draft.topicId) return true;

      const concepts: string[] = a.keyConcepts || anyArt.keywords || [];
      if (
        concepts.some((k: string) => {
          const kLower = k.toLowerCase();
          return (
            draft.title.toLowerCase().includes(kLower) ||
            Boolean(topic?.title && topic.title.toLowerCase().includes(kLower)) ||
            isTerritoryMatch(kLower) ||
            draftWords.some((w) => kLower.includes(w))
          );
        })
      ) {
        return true;
      }
      if (draftWords.some((w) => a.title.toLowerCase().includes(w) || Boolean(a.summary && a.summary.toLowerCase().includes(w)))) {
        return true;
      }
      return false;
    });

    if (inventory.length > 0 && relatedArticles.length === 0) {
      status = 'WEAK';
      score = 6;
      issues.push({
        code: 'ISOLATED_TOPIC_RISK',
        checkId: 'DISCOVER_TOPICAL_EXPERTISE',
        dimension: 'TOPICAL_EXPERTISE',
        severity: 'WARNING',
        message: `Artikel berdiri sendiri (isolated topic) tanpa kluster pendukung di territory ${territory}. Google Discover memprioritaskan situs yang memiliki rekam jejak otoritas mapan pada topik terkait.`,
        location: 'knowledge_cluster',
        recommendation: 'Bangun kluster konten pilar pendukung di territory yang sama.'
      });
    } else if (relatedArticles.length >= 2) {
      status = 'ESTABLISHED';
      score = 15;
    } else {
      status = 'DEVELOPING';
      score = inventory.length === 0 ? 10 : 12;
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_TOPICAL_EXPERTISE',
      dimension: 'TOPICAL_EXPERTISE',
      status: status === 'WEAK' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(15, score)),
      summary: status === 'ESTABLISHED'
        ? `Keahlian topikal mapan di territory ${territory} dengan kluster pendukung yang solid.`
        : `Status keahlian topikal: ${status} (${relatedArticles.length} artikel terhubung di territory ${territory}).`
    };

    return {
      expertiseStatus: status,
      checkResult,
      score,
      issues
    };
  }
}
