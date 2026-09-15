/**
 * NexaMOS Blog Vercel Deployment Routing & External Integration Contract Generator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 architectural correction.
 *
 * PENTING:
 * 1. Aplikasi Blog di workspace ini melayani rute internalnya sendiri:
 *    /         -> Blog Index
 *    /[slug]   -> Published Article
 * 2. Workspace Blog TIDAK mengontrol atau memodifikasi vercel.json milik Landing Page (Workspace A).
 * 3. Rewrite nexamos.cloud/blog/* ke BLOG_ORIGIN adalah tanggung jawab Workspace Landing / Edge Router.
 */

export interface VercelHeaderConfig {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

export interface VercelBlogDeploymentRouting {
  cleanUrls?: boolean;
  trailingSlash?: boolean;
  headers?: VercelHeaderConfig[];
}

export interface ExternalLandingRewriteContract {
  targetDomain: string;
  publicBlogBasePath: string;
  upstreamBlogOriginPlaceholder: string;
  requiredRewrites: Array<{ source: string; destination: string }>;
  requiredHeaders: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  notes: string;
}

export class VercelRoutingPlanBuilder {
  /**
   * Menghasilkan konfigurasi vercel.json untuk Deployment Mandiri Aplikasi Blog (Workspace B)
   * Hanya mengatur optimasi static delivery, cleanUrls, dan headers SEO/caching untuk blog itu sendiri.
   */
  public static buildBlogDeploymentRouting(): VercelBlogDeploymentRouting {
    return {
      cleanUrls: true,
      trailingSlash: false,
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1' }
          ]
        },
        {
          source: '/sitemap.xml',
          headers: [
            { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
            { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' }
          ]
        }
      ]
    };
  }

  /**
   * Menghasilkan spesifikasi kontrak integrasi untuk diserahkan ke Workspace A (Landing)
   * TIDAK dieksekusi atau dipasang di workspace Blog ini.
   */
  public static generateLandingIntegrationContract(
    blogOriginPlaceholder: string = 'https://BLOG_DEPLOYMENT_ORIGIN'
  ): ExternalLandingRewriteContract {
    const cleanOrigin = blogOriginPlaceholder.replace(/\/$/, '');

    return {
      targetDomain: 'nexamos.cloud',
      publicBlogBasePath: '/blog',
      upstreamBlogOriginPlaceholder: cleanOrigin,
      requiredRewrites: [
        {
          source: '/blog',
          destination: `${cleanOrigin}/`
        },
        {
          source: '/blog/:path*',
          destination: `${cleanOrigin}/:path*`
        }
      ],
      requiredHeaders: [
        {
          source: '/blog/:path*',
          headers: [
            { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1' },
            { key: 'X-Forwarded-Host', value: 'nexamos.cloud' }
          ]
        }
      ],
      notes: 'Rewrite/proxy ini harus dipasang pada Vercel Project A (Landing Workspace). Browser URL tetap nexamos.cloud/blog/... tanpa browser redirect.'
    };
  }
}
