/**
 * NexaMOS Knowledge Territory
 *
 * Three canonical knowledge territories:
 * - INTELLIGENCE: "Apa yang sebenarnya sedang terjadi di pasar?"
 * - STRATEGY: "Pilihan apa yang harus dibuat untuk menang?"
 * - TACTICAL: "Bagaimana pilihan strategi dieksekusi dan diukur?"
 */

export type Territory = 'INTELLIGENCE' | 'STRATEGY' | 'TACTICAL';

export const TERRITORIES: readonly Territory[] = [
  'INTELLIGENCE',
  'STRATEGY',
  'TACTICAL'
] as const;

export interface TerritoryDefinition {
  territory: Territory;
  coreQuestion: string;
  focusAreas: string[];
}

export const TERRITORY_DEFINITIONS: Record<Territory, TerritoryDefinition> = {
  INTELLIGENCE: {
    territory: 'INTELLIGENCE',
    coreQuestion: 'Apa yang sebenarnya sedang terjadi di pasar?',
    focusAreas: [
      'market intelligence',
      'competitive intelligence',
      'customer intelligence',
      'signal detection',
      'pattern recognition',
      'data & measurement',
      'research',
      'AI/computational analytics'
    ]
  },
  STRATEGY: {
    territory: 'STRATEGY',
    coreQuestion: 'Pilihan apa yang harus dibuat untuk menang?',
    focusAreas: [
      'competitive strategy',
      'category design',
      'positioning',
      'segmentation & targeting',
      'value proposition',
      'value innovation',
      'business model',
      'strategic trade-offs'
    ]
  },
  TACTICAL: {
    territory: 'TACTICAL',
    coreQuestion: 'Bagaimana pilihan strategi dieksekusi dan diukur?',
    focusAreas: [
      'acquisition',
      'content publishing',
      'search engine optimization (SEO)',
      'social distribution',
      'customer relationship management (CRM)',
      'sales execution',
      'lifecycle & retention',
      'automation & workflow'
    ]
  }
};
