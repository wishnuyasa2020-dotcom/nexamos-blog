/**
 * NexaMOS AI Source Transparency Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5C specifications.
 * Menilai transparansi asal pengetahuan dan kepengarangan naskah:
 * - Kejelasan identitas penulis (author) dan institusi penerbit (publisher)
 * - Transparansi tanggal publikasi dan riwayat pembaruan (provenance date)
 * - Pelabelan jelas antara pengetahuan mandiri (NexaMOS original framework) vs sumber eksternal
 *
 * DOKTRIN KERAS:
 * Dilarang mengarang kredensial penulis atau klaim keahlian palsu!
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { AIVisibilityCheckResult, AIVisibilityIssue } from './ai-visibility-validation.ts';

export interface SourceTransparencyValidationResult {
  sourceTransparency: 'TRANSPARENT' | 'NEEDS_IMPROVEMENT' | 'OPAQUE';
  checkResult: AIVisibilityCheckResult;
  score: number; // 0 - 8
  issues: AIVisibilityIssue[];
}

export class SourceTransparencyValidator {
  public validate(
    draft: ArticleDraft,
    metadata?: ArticleSEOMetadata | null
  ): SourceTransparencyValidationResult {
    const issues: AIVisibilityIssue[] = [];
    let score = 8; // Bobot penuh SOURCE_TRANSPARENCY = 8

    const hasAuthor = Boolean(metadata?.author?.name && metadata.author.name.trim().length > 2);
    const hasPublisher = Boolean(metadata?.publisher?.name && metadata.publisher.name.trim().length > 2);
    const hasPublicationDate = Boolean(metadata?.publishedAt || draft.createdAt);

    // 1. Evaluasi Transparansi Penulis & Penerbit
    if (!hasAuthor && !hasPublisher) {
      score -= 3;
      issues.push({
        code: 'OPAQUE_AUTHORSHIP',
        checkId: 'AI_SOURCE_TRANSPARENCY',
        dimension: 'SOURCE_TRANSPARENCY',
        severity: 'WARNING',
        message: 'Artikel tidak mencantumkan identitas penulis atau institusi penerbit yang transparan.',
        location: 'metadata.author',
        recommendation: 'Sediakan identitas penulis atau penerbit resmi untuk memperkuat sinyal provenance bagi LLM.'
      });
    }

    // 2. Evaluasi Transparansi Tanggal Provenance
    if (!hasPublicationDate) {
      score -= 2;
      issues.push({
        code: 'UNSPECIFIED_KNOWLEDGE_SOURCE',
        checkId: 'AI_SOURCE_TRANSPARENCY',
        dimension: 'SOURCE_TRANSPARENCY',
        severity: 'INFO',
        message: 'Tanggal publikasi atau pembuatan naskah tidak terdefinisi secara transparan.',
        location: 'metadata.publishedAt',
        recommendation: 'Sediakan tanggal publikasi ISO 8601 yang valid.'
      });
    }

    const finalScore = Math.max(0, Math.min(8, score));
    let status: 'TRANSPARENT' | 'NEEDS_IMPROVEMENT' | 'OPAQUE' = 'TRANSPARENT';
    if (finalScore < 4) {
      status = 'OPAQUE';
    } else if (finalScore < 7) {
      status = 'NEEDS_IMPROVEMENT';
    }

    const checkResult: AIVisibilityCheckResult = {
      checkId: 'AI_SOURCE_TRANSPARENCY',
      dimension: 'SOURCE_TRANSPARENCY',
      status: status === 'TRANSPARENT' ? 'PASS' : status === 'NEEDS_IMPROVEMENT' ? 'WARNING' : 'FAIL',
      scoreContribution: finalScore,
      summary: status === 'TRANSPARENT'
        ? 'Sumber kepengarangan, penerbit, dan tanggal provenance tersaji secara transparan dan akuntabel.'
        : `Status transparansi sumber: ${status}.`
    };

    return {
      sourceTransparency: status,
      checkResult,
      score: finalScore,
      issues
    };
  }
}
