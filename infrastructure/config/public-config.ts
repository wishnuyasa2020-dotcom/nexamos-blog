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

  return {
    siteUrl,
    blogBasePath,
    previewPort,
    previewHost
  };
}

export const publicConfig = getPublicConfig();
