/**
 * NexaMOS Discovery Query Builder
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Mengubah ResearchQuestion dan ResearchGap menjadi DiscoveryQuery secara deterministik (tanpa LLM).
 */

import type { ResearchQuestion } from '../domain/research-question.ts';
import type { ResearchGap } from '../domain/research-gap.ts';
import type { SourceType } from '../domain/source-type.ts';
import type { DiscoveryQuery, DiscoveryQueryIntent } from './source-discovery.ts';

export interface QueryBuilderOptions {
  projectId: string;
  defaultLanguage?: string;
  maxQueriesPerQuestion?: number;
}

const STOP_WORDS = new Set([
  'apakah', 'bagaimana', 'mengapa', 'kenapa', 'kapan', 'dimana', 'siapa',
  'apa', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'adalah', 'itu',
  'ini', 'atau', 'dalam', 'bisa', 'dapat', 'masih',
  'is', 'how', 'why', 'what', 'when', 'where', 'who', 'the', 'and', 'or', 'in',
  'to', 'for', 'of', 'with', 'a', 'an', 'are', 'can', 'still'
]);

export class DiscoveryQueryBuilder {
  buildQueries(
    question: ResearchQuestion,
    gaps: ResearchGap[] = [],
    options: QueryBuilderOptions
  ): DiscoveryQuery[] {
    const queries: DiscoveryQuery[] = [];
    const coreKeywords = this.extractCoreKeywords(question.question);
    const maxQueries = options.maxQueriesPerQuestion || 5;

    // 1. Tangani Gaps Spesifik jika ada
    const relevantGaps = gaps.filter(
      (g) => !g.questionId || g.questionId === question.id
    );

    for (const gap of relevantGaps) {
      if (queries.length >= maxQueries) break;

      switch (gap.type) {
        case 'MISSING_COUNTER_EVIDENCE':
          queries.push(
            this.createQuery(
              options.projectId,
              question.id,
              `${coreKeywords} criticism OR debunked OR limitation OR drawback`,
              'FIND_COUNTER_EVIDENCE',
              ['EXPERT_ANALYSIS', 'INDUSTRY_RESEARCH', 'ACADEMIC_PAPER']
            )
          );
          break;

        case 'MISSING_PRIMARY_SOURCE':
          queries.push(
            this.createQuery(
              options.projectId,
              question.id,
              `${coreKeywords} official documentation OR whitepaper`,
              'FIND_PRIMARY_SOURCE',
              ['OFFICIAL_DOCUMENTATION', 'GOVERNMENT', 'REGULATOR', 'ACADEMIC_PAPER']
            )
          );
          break;

        case 'MISSING_CURRENT_DATA':
          queries.push(
            this.createQuery(
              options.projectId,
              question.id,
              `${coreKeywords} benchmark statistics survey 2024 2025 2026`,
              'FIND_CURRENT_DATA',
              ['DATASET', 'PRIMARY_RESEARCH', 'INDUSTRY_RESEARCH']
            )
          );
          break;

        case 'MISSING_LOCAL_CONTEXT':
          queries.push(
            this.createQuery(
              options.projectId,
              question.id,
              `${coreKeywords} Indonesia data regulasi industri`,
              'FIND_LOCAL_CONTEXT',
              ['GOVERNMENT', 'REGULATOR', 'INDUSTRY_RESEARCH']
            )
          );
          break;
      }
    }

    // 2. Query Standar Deterministik (jika kuota masih tersedia)
    if (queries.length < maxQueries) {
      queries.push(
        this.createQuery(
          options.projectId,
          question.id,
          `${coreKeywords} official documentation`,
          'FIND_PRIMARY_SOURCE',
          ['OFFICIAL_DOCUMENTATION', 'PRIMARY_RESEARCH']
        )
      );
    }

    if (queries.length < maxQueries) {
      queries.push(
        this.createQuery(
          options.projectId,
          question.id,
          `${coreKeywords} empirical study benchmark data`,
          'FIND_EMPIRICAL_EVIDENCE',
          ['PRIMARY_RESEARCH', 'INDUSTRY_RESEARCH', 'DATASET']
        )
      );
    }

    if (queries.length < maxQueries) {
      queries.push(
        this.createQuery(
          options.projectId,
          question.id,
          `${coreKeywords} trends challenges overview`,
          'GENERAL_RESEARCH',
          ['INDUSTRY_RESEARCH', 'EXPERT_ANALYSIS']
        )
      );
    }

    return queries.slice(0, maxQueries);
  }

  private extractCoreKeywords(rawText: string): string {
    const cleaned = rawText
      .replace(/[?.,!;:"'()[\]{}<>/\\|@#$%^&*+=~`]/g, ' ')
      .toLowerCase();

    const words = cleaned
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

    return words.slice(0, 6).join(' ');
  }

  private createQuery(
    projectId: string,
    questionId: string,
    queryString: string,
    intent: DiscoveryQueryIntent,
    preferredSourceTypes: SourceType[]
  ): DiscoveryQuery {
    const id = `dq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      id,
      researchProjectId: projectId,
      researchQuestionId: questionId,
      query: queryString,
      intent,
      preferredSourceTypes,
      createdAt: new Date().toISOString()
    };
  }
}
