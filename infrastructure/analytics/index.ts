/**
 * NexaMOS Infrastructure Analytics Boundary
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Section 39).
 * Hard Principle:
 * Domain engine (/engines/analytics/) bebas dari detail eksternal seperti OAuth tokens,
 * Google Cloud SDKs, credentials JSON, HTTP timeouts, atau protokol REST.
 *
 * Integrasi live eksternal masa depan (Google Search Console API, GA4 Data API)
 * akan diimplementasikan pada lapisan /infrastructure/analytics/ ini sebagai adapter yang
 * mengimplementasikan AnalyticsProvider interface.
 */

export interface ExternalAnalyticsAuthConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  serviceAccountKeyPath?: string;
}

export interface LiveProviderConnectionResult {
  providerName: string;
  status: 'CONNECTED' | 'AUTH_FAILED' | 'CONFIG_MISSING';
  message: string;
}
