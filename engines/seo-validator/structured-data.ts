/**
 * NexaMOS Structured Data Contracts
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4A specifications.
 */

export type SupportedSchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'TechArticle'
  | 'BreadcrumbList'
  | 'Person'
  | 'Organization';

export interface StructuredDataEntity {
  '@context': 'https://schema.org';
  '@type': SupportedSchemaType;
  headline?: string;
  description?: string;
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
    jobTitle?: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  mainEntityOfPage?: string;
  [key: string]: any;
}
