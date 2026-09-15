/**
 * NexaMOS Source Candidate Evaluator
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Menggabungkan evaluasi otoritas, relevansi, kebaruan, dan duplikasi
 * untuk menghasilkan keputusan: ACCEPT, REJECT, atau REVIEW_REQUIRED.
 */

import type { SourceCandidate } from './source-candidate.ts';
import type { DiscoveryQuery } from './source-discovery.ts';
import type { AuthorityAssessment } from './authority-evaluator.ts';
import { AuthorityEvaluator } from './authority-evaluator.ts';
import type { FreshnessAssessment, TopicVolatility } from './freshness-evaluator.ts';
import { FreshnessEvaluator } from './freshness-evaluator.ts';

export type CandidateEvaluationDecision = 'ACCEPT' | 'REJECT' | 'REVIEW_REQUIRED';

export interface CandidateEvaluationResult {
  candidateId: string;
  decision: CandidateEvaluationDecision;
  rationale: string;
  authorityAssessment: AuthorityAssessment;
  freshnessAssessment: FreshnessAssessment;
  relevanceScore: number; // 0 - 100
  isDuplicate: boolean;
  evaluatedAt: string;
}

export interface CandidateEvaluatorDependencies {
  authorityEvaluator?: AuthorityEvaluator;
  freshnessEvaluator?: FreshnessEvaluator;
}

export interface EvaluationContext {
  query: DiscoveryQuery;
  topicVolatility?: TopicVolatility;
  currentDate?: string | Date;
  knownUrls?: Set<string>;
  knownTitles?: Set<string>;
}

export class SourceCandidateEvaluator {
  private authorityEvaluator: AuthorityEvaluator;
  private freshnessEvaluator: FreshnessEvaluator;

  constructor(deps: CandidateEvaluatorDependencies = {}) {
    this.authorityEvaluator = deps.authorityEvaluator || new AuthorityEvaluator();
    this.freshnessEvaluator = deps.freshnessEvaluator || new FreshnessEvaluator();
  }

  evaluate(
    candidate: SourceCandidate,
    context: EvaluationContext
  ): CandidateEvaluationResult {
    const volatility: TopicVolatility = context.topicVolatility || 'MEDIUM';

    // 1. Cek Duplikasi Awal (Pre-Acquisition Dedup)
    const isDuplicate = this.checkPreAcquisitionDuplicate(candidate, context);
    if (isDuplicate) {
      const auth = this.authorityEvaluator.evaluate({
        url: candidate.url,
        publisher: candidate.publisher,
        author: candidate.author,
        sourceType: candidate.sourceType
      });
      const fresh = this.freshnessEvaluator.evaluate({
        publicationDate: candidate.publicationDate,
        topicVolatility: volatility,
        currentDate: context.currentDate,
        sourceType: candidate.sourceType
      });

      return {
        candidateId: candidate.id,
        decision: 'REJECT',
        rationale: `Kandidat terdeteksi sebagai duplikat awal dari URL atau judul yang sudah ada.`,
        authorityAssessment: auth,
        freshnessAssessment: fresh,
        relevanceScore: 100,
        isDuplicate: true,
        evaluatedAt: new Date().toISOString()
      };
    }

    // 2. Evaluasi Otoritas
    const auth = this.authorityEvaluator.evaluate({
      url: candidate.url,
      publisher: candidate.publisher,
      author: candidate.author,
      sourceType: candidate.sourceType
    });

    // 3. Evaluasi Kebaruan
    const fresh = this.freshnessEvaluator.evaluate({
      publicationDate: candidate.publicationDate,
      topicVolatility: volatility,
      currentDate: context.currentDate,
      sourceType: candidate.sourceType
    });

    // 4. Evaluasi Relevansi
    const relevanceScore = this.computeRelevance(candidate, context.query);

    // 5. Decision Rules
    let decision: CandidateEvaluationDecision = 'ACCEPT';
    const reasons: string[] = [];

    // Kasus Irrelevance
    if (relevanceScore < 40) {
      decision = 'REJECT';
      reasons.push(`Skor relevansi rendah (${relevanceScore}/100) terhadap query '${context.query.query}'.`);
    }

    // Kasus Otoritas Rendah
    if (auth.score < 40) {
      decision = 'REJECT';
      reasons.push(`Skor otoritas sangat rendah (${auth.score}/100).`);
    }

    // Kasus Stale pada Domain Volatilitas Tinggi
    if (fresh.status === 'STALE' && volatility === 'HIGH') {
      decision = 'REVIEW_REQUIRED';
      reasons.push('Domain ber-volatilitas tinggi dengan data yang sudah usang memerlukan peninjauan editor.');
    } else if (fresh.status === 'STALE' && auth.score < 75) {
      decision = 'REJECT';
      reasons.push('Sumber usang dengan otoritas menengah ke bawah ditolak.');
    }

    // Kesesuaian tipe sumber jika ada preferredSourceTypes
    if (
      context.query.preferredSourceTypes.length > 0 &&
      candidate.sourceType &&
      !context.query.preferredSourceTypes.includes(candidate.sourceType)
    ) {
      if (decision === 'ACCEPT' && auth.score < 80) {
        decision = 'REVIEW_REQUIRED';
        reasons.push(
          `Tipe sumber ${candidate.sourceType} di luar preferensi query (${context.query.preferredSourceTypes.join(', ')}).`
        );
      }
    }

    if (decision === 'ACCEPT') {
      reasons.push(`Kandidat lolos kualifikasi (Otoritas: ${auth.score}, Relevansi: ${relevanceScore}, Freshness: ${fresh.status}).`);
    }

    return {
      candidateId: candidate.id,
      decision,
      rationale: reasons.join(' '),
      authorityAssessment: auth,
      freshnessAssessment: fresh,
      relevanceScore,
      isDuplicate: false,
      evaluatedAt: new Date().toISOString()
    };
  }

  private checkPreAcquisitionDuplicate(
    candidate: SourceCandidate,
    context: EvaluationContext
  ): boolean {
    if (candidate.url && context.knownUrls) {
      const normUrl = candidate.url.trim().toLowerCase().replace(/\/$/, '');
      if (context.knownUrls.has(normUrl)) return true;
    }
    if (candidate.title && context.knownTitles) {
      const normTitle = candidate.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (context.knownTitles.has(normTitle)) return true;
    }
    return false;
  }

  private computeRelevance(candidate: SourceCandidate, query: DiscoveryQuery): number {
    const queryTokens = query.query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (queryTokens.length === 0) return 70;

    const targetText = `${candidate.title} ${candidate.snippet || ''} ${candidate.url} ${candidate.publisher || ''}`.toLowerCase();

    let matched = 0;
    for (const token of queryTokens) {
      if (targetText.includes(token)) {
        matched++;
      }
    }

    const matchRatio = matched / queryTokens.length;
    let score = Math.round(matchRatio * 100);

    // Jika tipe sumber cocok dengan tipe pilihan query, berikan dorongan relevansi struktural
    if (query.preferredSourceTypes.length > 0 && candidate.sourceType && query.preferredSourceTypes.includes(candidate.sourceType)) {
      score = Math.min(100, score + 15);
    }

    return Math.min(100, Math.max(0, score));
  }
}
