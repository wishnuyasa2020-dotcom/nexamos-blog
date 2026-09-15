/**
 * NexaMOS Editorial Tone Profile Model
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Standar profil nada bicara dan suara editorial NexaMOS adaptif terhadap tipe artikel.
 */

import type { ArticleType } from '../../ideation/domain/article-type.ts';

export interface EditorialToneProfile {
  primaryVoice: string;
  coreAttributes: string[];
  bannedTones: string[];
  articleTypeToneMap: Record<ArticleType, string>;
}

export const DEFAULT_NEXAMOS_TONE_PROFILE: EditorialToneProfile = {
  primaryVoice:
    'analytical, clear, confident, evidence-led, practical, intellectually rigorous, non-sensational, non-patronizing',
  coreAttributes: [
    'analytical',
    'clear',
    'confident',
    'evidence-led',
    'practical',
    'intellectually rigorous',
    'non-sensational',
    'non-patronizing'
  ],
  bannedTones: [
    'corporate fluff',
    'motivational filler',
    'academic obscurity',
    'fake certainty',
    'overclaim',
    'cheap clickbait',
    'excessive slang'
  ],
  articleTypeToneMap: {
    ANALYSIS: 'analytical + argumentative',
    EXPLAINER: 'clear + educational',
    FRAMEWORK: 'structured + conceptual + practical',
    ORIGINAL_RESEARCH: 'precise + methodological',
    OPINION: 'strong but evidence-aware',
    HOW_TO: 'direct + actionable',
    TREND_ANALYSIS: 'current + cautious + analytical',
    GLOSSARY: 'concise + definitional',
    REFERENCE: 'neutral + retrievable',
    CASE_STUDY: 'objective + narrative + evidence-led',
    COMPARATIVE_ANALYSIS: 'balanced + multi-dimensional + analytical'
  }
};
