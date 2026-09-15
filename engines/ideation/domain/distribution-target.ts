/**
 * NexaMOS Distribution Targets
 *
 * Sourced from NexaMOS Blog IDE Agent Doctrine v1.0 (Section 16)
 */

export type DistributionTarget =
  | 'GOOGLE_SEARCH'
  | 'GOOGLE_DISCOVER'
  | 'GOOGLE_AI'
  | 'SOCIAL'
  | 'EMAIL'
  | 'DIRECT'
  | 'COMMUNITY'
  | 'SALES_ENABLEMENT'
  | 'PRODUCT_EDUCATION';

export const DISTRIBUTION_TARGETS: readonly DistributionTarget[] = [
  'GOOGLE_SEARCH',
  'GOOGLE_DISCOVER',
  'GOOGLE_AI',
  'SOCIAL',
  'EMAIL',
  'DIRECT',
  'COMMUNITY',
  'SALES_ENABLEMENT',
  'PRODUCT_EDUCATION'
] as const;
