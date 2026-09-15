/**
 * NexaMOS Unified Distribution Issue Router & Deduplication Engine
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 5D specifications.
 * Tugas:
 * 1. Mengelompokkan isu serupa dari lintas validator menjadi satu Canonical Distribution Issue.
 * 2. Mengarahkan isu ke domain pemilik yang berwenang (Routing).
 * 3. Menghindari duplikasi peringatan kepada tim editorial/teknis.
 */

import type { SEOIssue, SafeSEORecommendation } from '../seo-validator/seo-validation.ts';
import type { DiscoverIssue, DiscoverRecommendation } from '../discover-validator/discover-validation.ts';
import type { AIVisibilityIssue, AIVisibilityRecommendation } from '../ai-visibility/ai-visibility-validation.ts';
import type { ReviewIssue } from '../editorial/review/editorial-review.ts';
import type {
  DistributionIssue,
  DistributionIssueSeverity,
  DistributionRecommendation,
  DistributionRouteTarget,
  DistributionValidatorSource
} from './distribution-readiness.ts';

interface CanonicalEquivalenceRule {
  canonicalCode: string;
  defaultSeverity: DistributionIssueSeverity;
  defaultRoute: DistributionRouteTarget;
  isBlocking: boolean;
  defaultMessage: string;
  matches: {
    seo?: string[];
    discover?: string[];
    ai?: string[];
  };
}

/**
 * Tabel Aturan Deduplikasi Lintas Validator
 */
const CANONICAL_EQUIVALENCE_RULES: CanonicalEquivalenceRule[] = [
  {
    canonicalCode: 'ARTICLE_NOT_INDEXABLE',
    defaultSeverity: 'CRITICAL',
    defaultRoute: 'SEO_TECHNICAL',
    isBlocking: true,
    defaultMessage: 'Artikel disetel noindex atau tidak dapat diindeks oleh mesin perayap.',
    matches: {
      seo: ['NOINDEX_ON_PUBLISHED_ARTICLE', 'INDEXABILITY_CONFLICT'],
      discover: ['CONTENT_NOT_INDEXABLE'],
      ai: ['ARTICLE_NOT_INDEXABLE']
    }
  },
  {
    canonicalCode: 'PRIMARY_CONTENT_UNAVAILABLE',
    defaultSeverity: 'CRITICAL',
    defaultRoute: 'EDITORIAL',
    isBlocking: true,
    defaultMessage: 'Naskah artikel tidak memiliki judul atau teks tubuh konten primer.',
    matches: {
      seo: ['MISSING_PRIMARY_ARTICLE_CONTENT'],
      discover: ['MISSING_PRIMARY_CONTENT'],
      ai: ['PRIMARY_CONTENT_UNAVAILABLE']
    }
  },
  {
    canonicalCode: 'CRITICAL_CANONICAL_CONFLICT',
    defaultSeverity: 'CRITICAL',
    defaultRoute: 'SEO_TECHNICAL',
    isBlocking: true,
    defaultMessage: 'Konflik URL kanonikal atau perulangan (canonical loop) terdeteksi.',
    matches: {
      seo: ['INVALID_CANONICAL', 'CANONICAL_LOOP'],
      ai: ['CRITICAL_CANONICAL_CONFLICT']
    }
  },
  {
    canonicalCode: 'CLICKBAIT_TITLE_RISK',
    defaultSeverity: 'WARNING',
    defaultRoute: 'EDITORIAL',
    isBlocking: false,
    defaultMessage: 'Judul artikel berpotensi mengecoh pembaca atau mengandung hiperbola sensasional.',
    matches: {
      seo: ['TITLE_CLICKBAIT_RISK', 'TITLE_MISLEADING'],
      discover: ['DISCOVER_CLICKBAIT_RISK', 'SENSATIONAL_TITLE', 'TITLE_CONTENT_MISMATCH', 'CRITICAL_TITLE_DECEPTION']
    }
  },
  {
    canonicalCode: 'COMMODITY_CONTENT_RISK',
    defaultSeverity: 'WARNING',
    defaultRoute: 'CONTENT_STRATEGY',
    isBlocking: false,
    defaultMessage: 'Konten memiliki tingkat diferensiasi rendah terhadap hasil penelusuran umum web.',
    matches: {
      seo: ['LOW_SEARCH_DIFFERENTIATION'],
      discover: ['LOW_DISCOVER_ORIGINALITY'],
      ai: ['COMMODITY_CONTENT_RISK', 'LOW_INFORMATION_GAIN']
    }
  },
  {
    canonicalCode: 'HEADING_HIERARCHY_AMBIGUOUS',
    defaultSeverity: 'WARNING',
    defaultRoute: 'EDITORIAL',
    isBlocking: false,
    defaultMessage: 'Hierarki heading tidak terstruktur secara semantis atau terlalu generik.',
    matches: {
      seo: ['HEADING_STRUCTURE_INVALID', 'GENERIC_HEADING_EXCESS'],
      ai: ['HEADING_HIERARCHY_AMBIGUOUS', 'RETRIEVAL_COHERENCE_WEAK']
    }
  },
  {
    canonicalCode: 'VISUAL_ASSET_DEFICIT',
    defaultSeverity: 'WARNING',
    defaultRoute: 'VISUAL_DESIGN',
    isBlocking: false,
    defaultMessage: 'Aset visual pendukung belum optimal (kurang resolusi, bukan landscape, atau absen).',
    matches: {
      discover: [
        'VISUAL_ASSET_MISSING',
        'VISUAL_LOW_RESOLUTION',
        'VISUAL_NON_LANDSCAPE',
        'VISUAL_GENERIC_LOGO',
        'VISUAL_TEXT_HEAVY'
      ],
      ai: ['MISSING_EXPLANATORY_VISUAL']
    }
  },
  {
    canonicalCode: 'UNSUPPORTED_CITATION',
    defaultSeverity: 'WARNING',
    defaultRoute: 'RESEARCH',
    isBlocking: false,
    defaultMessage: 'Pernyataan klaim atau data statistik belum didukung oleh sitasi atau locator bukti.',
    matches: {
      ai: ['UNSUPPORTED_CITATION', 'MISSING_EVIDENCE_LOCATOR', 'CRITICAL_GROUNDING_FAILURE']
    }
  },
  {
    canonicalCode: 'GENERATIVE_AI_SITE_EXCLUDED',
    defaultSeverity: 'CRITICAL',
    defaultRoute: 'SITE_TECHNICAL',
    isBlocking: true,
    defaultMessage: 'Situs dieksklusikan dari fitur pencarian generatif Google pada konfigurasi Search Console.',
    matches: {
      ai: ['GENERATIVE_AI_SITE_EXCLUDED']
    }
  },
  {
    canonicalCode: 'DISCOVER_POLICY_INELIGIBLE',
    defaultSeverity: 'CRITICAL',
    defaultRoute: 'EDITORIAL',
    isBlocking: true,
    defaultMessage: 'Konten melanggar kebijakan kelayakan editorial Google Discover.',
    matches: {
      discover: ['DISCOVER_POLICY_INELIGIBLE', 'CONTENT_POLICY_RISK']
    }
  },
  {
    canonicalCode: 'CONTENT_ACCESSIBILITY_ISSUE',
    defaultSeverity: 'WARNING',
    defaultRoute: 'SITE_TECHNICAL',
    isBlocking: false,
    defaultMessage: 'Konten terkunci di balik paywall atau mengandalkan eksklusif Client-Side Rendering.',
    matches: {
      ai: ['PAYWALL_ACCESS_RESTRICTION', 'JS_RENDERING_REVIEW', 'CONTENT_INTERACTION_LOCKED']
    }
  },
  {
    canonicalCode: 'PAGE_EXPERIENCE_POOR',
    defaultSeverity: 'WARNING',
    defaultRoute: 'SITE_TECHNICAL',
    isBlocking: false,
    defaultMessage: 'Pengalaman halaman atau indikator Core Web Vitals membutuhkan tinjauan teknis.',
    matches: {
      discover: ['PAGE_EXPERIENCE_POOR', 'UNVERIFIED_PAGE_EXPERIENCE']
    }
  },
  {
    canonicalCode: 'ISOLATED_TOPIC_RISK',
    defaultSeverity: 'WARNING',
    defaultRoute: 'CONTENT_STRATEGY',
    isBlocking: false,
    defaultMessage: 'Topik terisolasi tanpa klaster konten pendukung yang cukup di situs.',
    matches: {
      seo: ['ORPHAN_ARTICLE_RISK'],
      discover: ['ISOLATED_TOPIC_RISK']
    }
  },
  {
    canonicalCode: 'OVERCLAIMED_STATEMENT',
    defaultSeverity: 'WARNING',
    defaultRoute: 'EDITORIAL',
    isBlocking: false,
    defaultMessage: 'Terdapat pernyataan absolut atau generalisasi analitis tanpa batasan memadai.',
    matches: {
      ai: ['OVERCLAIMED_STATEMENT', 'UNBOUNDED_ANALYTICAL_CLAIM']
    }
  }
];

export interface DeduplicationAndRoutingResult {
  canonicalIssues: DistributionIssue[];
  blockers: DistributionIssue[];
  warnings: DistributionIssue[];
  activeRoutes: DistributionRouteTarget[];
  recommendations: DistributionRecommendation[];
}

export class DistributionIssueRouter {
  /**
   * Menggabungkan, melakukan deduplikasi, dan merouting seluruh issue dari tiga validator.
   */
  public process(params: {
    seoIssues: SEOIssue[];
    discoverIssues: DiscoverIssue[];
    aiIssues: AIVisibilityIssue[];
    editorialIssues?: ReviewIssue[];
    seoRecommendations?: SafeSEORecommendation[];
    discoverRecommendations?: DiscoverRecommendation[];
    aiRecommendations?: AIVisibilityRecommendation[];
  }): DeduplicationAndRoutingResult {
    const {
      seoIssues,
      discoverIssues,
      aiIssues,
      editorialIssues = [],
      seoRecommendations = [],
      discoverRecommendations = [],
      aiRecommendations = []
    } = params;

    const canonicalMap = new Map<string, DistributionIssue>();
    const matchedOriginalCodes = new Set<string>();

    // 1. Cocokkan dengan equivalence rules
    for (const rule of CANONICAL_EQUIVALENCE_RULES) {
      const activeSources: DistributionValidatorSource[] = [];
      const foundOriginalCodes: string[] = [];
      const messages: string[] = [];
      let maxSeverity = rule.defaultSeverity;
      let hasBlocking = rule.isBlocking;

      // Cek SEO
      if (rule.matches.seo) {
        for (const issue of seoIssues) {
          if (rule.matches.seo.includes(issue.code)) {
            if (!activeSources.includes('SEO')) activeSources.push('SEO');
            foundOriginalCodes.push(issue.code);
            matchedOriginalCodes.add(`SEO:${issue.code}`);
            messages.push(issue.message);
            if (issue.severity === 'CRITICAL') {
              maxSeverity = 'CRITICAL';
              hasBlocking = true;
            }
          }
        }
      }

      // Cek Discover
      if (rule.matches.discover) {
        for (const issue of discoverIssues) {
          if (rule.matches.discover.includes(issue.code)) {
            if (!activeSources.includes('DISCOVER')) activeSources.push('DISCOVER');
            foundOriginalCodes.push(issue.code);
            matchedOriginalCodes.add(`DISCOVER:${issue.code}`);
            messages.push(issue.message);
            if (issue.severity === 'CRITICAL') {
              maxSeverity = 'CRITICAL';
              hasBlocking = true;
            }
          }
        }
      }

      // Cek AI Visibility
      if (rule.matches.ai) {
        for (const issue of aiIssues) {
          if (rule.matches.ai.includes(issue.code)) {
            if (!activeSources.includes('AI_VISIBILITY')) activeSources.push('AI_VISIBILITY');
            foundOriginalCodes.push(issue.code);
            matchedOriginalCodes.add(`AI_VISIBILITY:${issue.code}`);
            messages.push(issue.message);
            if (issue.severity === 'CRITICAL') {
              maxSeverity = 'CRITICAL';
              hasBlocking = true;
            }
          }
        }
      }

      if (activeSources.length > 0) {
        canonicalMap.set(rule.canonicalCode, {
          code: rule.canonicalCode,
          severity: maxSeverity,
          sourceValidators: activeSources,
          message: messages.length > 0 ? messages[0] : rule.defaultMessage,
          route: rule.defaultRoute,
          blocking: hasBlocking,
          originalCodes: foundOriginalCodes
        });
      }
    }

    // 2. Petakan isu spesifik SEO yang belum terdeduplikasi
    for (const issue of seoIssues) {
      if (!matchedOriginalCodes.has(`SEO:${issue.code}`)) {
        const route = this.mapSEORoute(issue.code, issue.dimension);
        const isCritical = issue.severity === 'CRITICAL';
        canonicalMap.set(`SEO_${issue.code}`, {
          code: issue.code,
          severity: isCritical ? 'CRITICAL' : issue.severity === 'WARNING' ? 'WARNING' : 'INFO',
          sourceValidators: ['SEO'],
          message: issue.message,
          route,
          blocking: isCritical,
          originalCodes: [issue.code],
          location: issue.location,
          recommendation: issue.recommendation
        });
      }
    }

    // 3. Petakan isu spesifik Discover yang belum terdeduplikasi
    for (const issue of discoverIssues) {
      if (!matchedOriginalCodes.has(`DISCOVER:${issue.code}`)) {
        const route = this.mapDiscoverRoute(issue.code, issue.dimension);
        const isCritical = issue.severity === 'CRITICAL';
        canonicalMap.set(`DISCOVER_${issue.code}`, {
          code: issue.code,
          severity: isCritical ? 'CRITICAL' : issue.severity === 'WARNING' ? 'WARNING' : 'INFO',
          sourceValidators: ['DISCOVER'],
          message: issue.message,
          route,
          blocking: isCritical,
          originalCodes: [issue.code],
          location: issue.location,
          recommendation: issue.recommendation
        });
      }
    }

    // 4. Petakan isu spesifik AI Visibility yang belum terdeduplikasi
    for (const issue of aiIssues) {
      if (!matchedOriginalCodes.has(`AI_VISIBILITY:${issue.code}`)) {
        const route = this.mapAIVisibilityRoute(issue.code, issue.dimension);
        const isCritical = issue.severity === 'CRITICAL';
        canonicalMap.set(`AI_${issue.code}`, {
          code: issue.code,
          severity: isCritical ? 'CRITICAL' : issue.severity === 'WARNING' ? 'WARNING' : 'INFO',
          sourceValidators: ['AI_VISIBILITY'],
          message: issue.message,
          route,
          blocking: isCritical,
          originalCodes: [issue.code],
          location: issue.location,
          recommendation: issue.recommendation
        });
      }
    }

    // 5. Petakan isu Editorial jika ada
    for (const issue of editorialIssues) {
      const isCritical = issue.severity === 'CRITICAL' || issue.severity === 'MAJOR';
      canonicalMap.set(`EDITORIAL_${issue.code}`, {
        code: issue.code,
        severity: isCritical ? 'CRITICAL' : issue.severity === 'MINOR' ? 'WARNING' : 'INFO',
        sourceValidators: ['EDITORIAL'],
        message: issue.message,
        route: 'EDITORIAL',
        blocking: isCritical,
        originalCodes: [issue.code],
        recommendation: issue.recommendation || undefined
      });
    }

    // 6. Pisahkan Blockers dan Warnings
    const allCanonical = Array.from(canonicalMap.values());
    const blockers = allCanonical.filter((item) => item.blocking || item.severity === 'CRITICAL');
    const warnings = allCanonical.filter((item) => !item.blocking && (item.severity === 'WARNING' || item.severity === 'INFO'));

    // 7. Himpun Active Routes unik
    const activeRoutesSet = new Set<DistributionRouteTarget>();
    for (const item of allCanonical) {
      activeRoutesSet.add(item.route);
    }
    const activeRoutes = Array.from(activeRoutesSet);

    // 8. Kumpulkan dan kelompokkan Rekomendasi Terpadu
    const recommendations = this.aggregateRecommendations(
      seoRecommendations,
      discoverRecommendations,
      aiRecommendations
    );

    return {
      canonicalIssues: allCanonical,
      blockers,
      warnings,
      activeRoutes,
      recommendations
    };
  }

  private mapSEORoute(code: string, dimension: string): DistributionRouteTarget {
    if (dimension === 'INTENT_ALIGNMENT' || dimension === 'TOPIC_CLARITY') return 'CONTENT_STRATEGY';
    if (dimension === 'TITLE_QUALITY' || dimension === 'HEADING_STRUCTURE') return 'EDITORIAL';
    if (code.includes('IMAGE') || dimension === 'IMAGE_SEO_QUALITY' as any) return 'VISUAL_DESIGN';
    if (dimension === 'INDEXABILITY' || dimension === 'CANONICAL_INTEGRITY' || dimension === 'STRUCTURED_DATA') {
      return 'SEO_TECHNICAL';
    }
    return 'SEO_TECHNICAL';
  }

  private mapDiscoverRoute(code: string, dimension: string): DistributionRouteTarget {
    if (dimension === 'ORIGINALITY' || dimension === 'DEPTH' || dimension === 'TITLE_INTEGRITY') return 'EDITORIAL';
    if (dimension === 'VISUAL_READINESS') return 'VISUAL_DESIGN';
    if (dimension === 'TOPICAL_EXPERTISE' || dimension === 'INTEREST_FIT' || dimension === 'LOCAL_RELEVANCE') return 'CONTENT_STRATEGY';
    if (dimension === 'PAGE_EXPERIENCE') return 'SITE_TECHNICAL';
    if (dimension === 'POLICY_SAFETY') return 'EDITORIAL';
    return 'EDITORIAL';
  }

  private mapAIVisibilityRoute(code: string, dimension: string): DistributionRouteTarget {
    if (dimension === 'CLAIM_CLARITY' || dimension === 'ENTITY_CLARITY' || dimension === 'RETRIEVAL_READINESS' || dimension === 'ANSWERABILITY') {
      return 'EDITORIAL';
    }
    if (dimension === 'CITATION_READINESS') return 'RESEARCH';
    if (dimension === 'INFORMATION_GAIN') return 'CONTENT_STRATEGY';
    if (dimension === 'CONTENT_ACCESSIBILITY') return 'SITE_TECHNICAL';
    if (dimension === 'MULTIMODAL_READINESS') return 'VISUAL_DESIGN';
    if (dimension === 'GOOGLE_AI_ELIGIBILITY') return 'SEO_TECHNICAL';
    return 'EDITORIAL';
  }

  private aggregateRecommendations(
    seoRecs: SafeSEORecommendation[],
    discoverRecs: DiscoverRecommendation[],
    aiRecs: AIVisibilityRecommendation[]
  ): DistributionRecommendation[] {
    const list: DistributionRecommendation[] = [];
    let recCounter = 1;

    for (const r of seoRecs) {
      let targetRoute: DistributionRouteTarget = 'SEO_TECHNICAL';
      if (r.type === 'CONTENT_CLARIFICATION' || r.requiresEditorialReturn) targetRoute = 'EDITORIAL';
      else if (r.type === 'INTERNAL_LINK_OPPORTUNITY') targetRoute = 'CONTENT_STRATEGY';

      list.push({
        id: `dist-rec-seo-${recCounter++}`,
        title: r.title,
        description: r.description,
        suggestedAction: r.suggestedAction,
        targetRoute,
        sourceValidators: ['SEO'],
        priority: r.requiresEditorialReturn ? 'HIGH' : 'MEDIUM'
      });
    }

    for (const r of discoverRecs) {
      let targetRoute: DistributionRouteTarget = 'EDITORIAL';
      if (r.crossEngineDestination) targetRoute = r.crossEngineDestination;
      else if (r.type === 'VISUAL_IMPROVEMENT') targetRoute = 'VISUAL_DESIGN';
      else if (r.type === 'TECHNICAL_FIX' || r.type === 'PAGE_EXPERIENCE_REVIEW') targetRoute = 'SITE_TECHNICAL';
      else if (r.type === 'TOPICAL_CLUSTER_IMPROVEMENT') targetRoute = 'CONTENT_STRATEGY';

      list.push({
        id: `dist-rec-disc-${recCounter++}`,
        title: r.title,
        description: r.description,
        suggestedAction: r.suggestedAction,
        targetRoute,
        sourceValidators: ['DISCOVER'],
        priority: 'MEDIUM'
      });
    }

    for (const r of aiRecs) {
      let targetRoute: DistributionRouteTarget = 'EDITORIAL';
      if (r.crossEngineDestination) targetRoute = r.crossEngineDestination;
      else if (r.type === 'CITATION_IMPROVEMENT') targetRoute = 'RESEARCH';
      else if (r.type === 'MULTIMODAL_IMPROVEMENT') targetRoute = 'VISUAL_DESIGN';
      else if (r.type === 'ACCESSIBILITY_FIX') targetRoute = 'SITE_TECHNICAL';
      else if (r.type === 'INFORMATION_GAIN_IMPROVEMENT') targetRoute = 'CONTENT_STRATEGY';

      list.push({
        id: `dist-rec-ai-${recCounter++}`,
        title: r.title,
        description: r.description,
        suggestedAction: r.suggestedAction,
        targetRoute,
        sourceValidators: ['AI_VISIBILITY'],
        priority: r.isAbuseRiskWarning ? 'HIGH' : 'MEDIUM'
      });
    }

    return list;
  }
}
