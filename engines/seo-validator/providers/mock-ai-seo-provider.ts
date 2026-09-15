/**
 * NexaMOS Mock AI SEO Provider
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 * Implementasi deterministik untuk pengujian unit dan integrasi.
 */

import type {
  AISEOReviewProvider,
  TitleSuggestionRequest,
  TitleSuggestion,
  DescriptionSuggestionRequest,
  DescriptionSuggestion,
  InternalLinkSuggestionRequest,
  InternalLinkAnchorSuggestion
} from '../ai-seo-provider.ts';

export class MockAISEOProvider implements AISEOReviewProvider {
  public async suggestTitles(request: TitleSuggestionRequest): Promise<TitleSuggestion[]> {
    const baseTitle = request.draft.title || request.topic?.title || 'Artikel NexaMOS';
    return [
      {
        suggestedTitle: `${baseTitle}: Analisis Strategis & Implikasi AI`,
        angle: 'STRATEGIC_IMPLICATION',
        rationale: 'Menambahkan diferensiasi fokus analitis tanpa mengubah arti dasar topik.'
      },
      {
        suggestedTitle: `Arsitektur Pengetahuan: ${baseTitle}`,
        angle: 'FRAMEWORK_FOCUSED',
        rationale: 'Menyoroti kerangka kerja otoritas entitas yang dibahas dalam naskah.'
      }
    ];
  }

  public async suggestDescription(
    request: DescriptionSuggestionRequest
  ): Promise<DescriptionSuggestion> {
    const desc =
      request.draft.dek ||
      `Analisis mendalam mengenai ${request.draft.title.toLowerCase()} serta dampaknya terhadap sistem kepemilikan pengetahuan dan otoritas organik di era AI.`;

    return {
      suggestedDescription: desc,
      characterCount: desc.length,
      rationale: 'Menyajikan ringkasan proposisi nilai artikel secara jujur untuk cuplikan SERP Google.'
    };
  }

  public async suggestInternalLinkAnchors(
    request: InternalLinkSuggestionRequest
  ): Promise<InternalLinkAnchorSuggestion[]> {
    const suggestions: InternalLinkAnchorSuggestion[] = [];

    for (const title of request.availableArticleTitles) {
      suggestions.push({
        targetTitle: title,
        recommendedAnchor: title,
        sectionId: request.draft.sections[0]?.id,
        contextSnippet: `Relevan dengan pembahasan pada bagian pendahuluan.`
      });
    }

    return suggestions;
  }
}
