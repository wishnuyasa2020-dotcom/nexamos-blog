/**
 * NexaMOS Public Configuration Layer
 *
 * Sourced from NexaMOS Production Pilot 01 specifications.
 * Membaca konfigurasi publik dari process.env dengan fallback default yang aman.
 * Menghindari hard-coding nilai konfigurasi di banyak file.
 */

export interface PublicConfig {
  siteUrl: string;
  blogBasePath: string;
  previewPort: number;
  previewHost: string;
  googleSiteVerification?: string;
  gaMeasurementId?: string;
}

export function getPublicConfig(): PublicConfig {
  const rawSiteUrl = process.env.PUBLIC_SITE_URL || 'https://nexamos.cloud';
  const rawBasePath = process.env.PUBLIC_BLOG_BASE_PATH || '/blog';
  const rawPort = process.env.PORT;
  const rawHost = process.env.HOST;

  const siteUrl = rawSiteUrl.trim().replace(/\/+$/, '');
  let blogBasePath = rawBasePath.trim().replace(/\/+$/, '');
  if (!blogBasePath.startsWith('/')) {
    blogBasePath = `/${blogBasePath}`;
  }

  const parsedPort = rawPort ? parseInt(rawPort, 10) : 4173;
  const previewPort = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 4173;
  const previewHost = rawHost?.trim() || '127.0.0.1';

  const rawGsc = process.env.PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const googleSiteVerification = rawGsc ? rawGsc : undefined;

  const rawGa = process.env.PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-7BKT098RDB';
  const gaMeasurementId = rawGa && /^G-[A-Za-z0-9]+$/i.test(rawGa) ? rawGa.toUpperCase() : undefined;

  return {
    siteUrl,
    blogBasePath,
    previewPort,
    previewHost,
    googleSiteVerification,
    gaMeasurementId
  };
}

export const publicConfig = getPublicConfig();
