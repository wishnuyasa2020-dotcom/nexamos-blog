/**
 * NexaMOS Google Discover Timeliness Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai ketepatan waktu konten untuk feed Discover berbasis minat:
 * - publicationDate, updatedAt, topicVolatility, researchFreshness, whyNow.
 * PENTING: Discover dapat menampilkan konten yang lebih lama jika tetap berguna dan relevan (OLD != AUTOMATIC FAIL).
 * Yang dinilai adalah relevansi terhadap minat audiens saat ini.
 */

import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ArticleSEOMetadata } from '../seo-validator/article-seo-metadata.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export type DiscoverTimelinessStatus =
  | 'CURRENT'
  | 'EVERGREEN_RELEVANT'
  | 'AGING'
  | 'STALE'
  | 'UNKNOWN';

export interface DiscoverTimelinessValidationResult {
  timelinessStatus: DiscoverTimelinessStatus;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 10
  issues: DiscoverIssue[];
}

export class DiscoverTimelinessValidator {
  public validate(
    topic?: Topic | null,
    metadata?: ArticleSEOMetadata | null,
    referenceDate: Date = new Date()
  ): DiscoverTimelinessValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 10; // Bobot penuh dimensi Timeliness = 10
    let status: DiscoverTimelinessStatus = 'CURRENT';

    const pubDateStr = metadata?.publishedAt || metadata?.updatedAt;
    const whyNow = topic?.whyNow || '';
    const hasWhyNow = whyNow.trim().length > 10;

    if (!pubDateStr) {
      status = 'UNKNOWN';
      score = 7;
      issues.push({
        code: 'STALE_TIME_SENSITIVE_CONTENT',
        checkId: 'DISCOVER_TIMELINESS',
        dimension: 'TIMELINESS',
        severity: 'INFO',
        message: 'Tanggal publikasi tidak tercantum. Google Discover memprioritaskan artikel dengan sinyal tanggal transparan.',
        location: 'metadata.publishedAt',
        recommendation: 'Sediakan tanggal publikasi ISO 8601 yang valid.'
      });
    } else {
      const pubDate = new Date(pubDateStr);
      const ageInDays = Math.floor((referenceDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));

      // Asumsi volatilitas: jika territory TACTICAL, topik menyebut tren AI/algoritma, atau whyNow mendesak
      const isHighVolatility =
        topic?.territory === 'TACTICAL' ||
        Boolean(topic?.title && /era ai|algoritma|trend|update|202[5-9]/i.test(topic.title)) ||
        Boolean(topic?.whyNow && /algoritma|update|terkini|mendesak|breaking|dinamis/i.test(topic.whyNow));

      if (ageInDays <= 60) {
        status = 'CURRENT';
        score = 10;
      } else if (ageInDays <= 365) {
        if (isHighVolatility && !hasWhyNow) {
          status = 'AGING';
          score = 6;
          issues.push({
            code: 'STALE_TIME_SENSITIVE_CONTENT',
            checkId: 'DISCOVER_TIMELINESS',
            dimension: 'TIMELINESS',
            severity: 'INFO',
            message: 'Artikel bertema dinamis berusia lebih dari 2 bulan dan belum diperbarui.',
            location: 'metadata.publishedAt',
            recommendation: 'Periksa kesegaran data dan perbarui artikel jika ada dinamika pasar terbaru.'
          });
        } else {
          status = 'EVERGREEN_RELEVANT';
          score = 9;
        }
      } else {
        // Konten > 1 tahun
        if (isHighVolatility) {
          status = 'STALE';
          score = 4;
          issues.push({
            code: 'STALE_TIME_SENSITIVE_CONTENT',
            checkId: 'DISCOVER_TIMELINESS',
            dimension: 'TIMELINESS',
            severity: 'WARNING',
            message: 'Artikel topik berkecepatan tinggi berusia lebih dari 1 tahun. Discover cenderung membatasi distribusi artikel dinamis yang sudah basi.',
            location: 'metadata.publishedAt',
            recommendation: 'Lakukan peninjauan menyeluruh dan perbarui bukti riset terkini.'
          });
        } else {
          // Topik fundamental/evergreen tetap relevan
          status = 'EVERGREEN_RELEVANT';
          score = 8;
        }
      }
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_TIMELINESS',
      dimension: 'TIMELINESS',
      status: status === 'STALE' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, score)),
      summary: status === 'CURRENT'
        ? 'Konten terkini dengan aktualitas tinggi.'
        : status === 'EVERGREEN_RELEVANT'
        ? 'Konten evergreen yang tetap bernilai dan relevan bagi minat audiens.'
        : `Status aktualitas: ${status}.`
    };

    return {
      timelinessStatus: status,
      checkResult,
      score,
      issues
    };
  }
}
