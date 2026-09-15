/**
 * NexaMOS Google Discover Page Experience Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai keramahan pengalaman halaman (mobile friendliness, interstitial risk, aksesibilitas, HTTPS).
 * DOKTRIN: DILARANG mengarang skor Core Web Vitals jika data empiris belum diukur!
 * Ketiadaan data menghasilkan status UNKNOWN, BUKAN kelulusan palsu (fabricated PASS).
 */

import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export interface PageExperienceSignals {
  mobileFriendly?: boolean;
  intrusiveInterstitialRisk?: boolean;
  secureTransport?: boolean; // HTTPS
  hasMeasuredCoreWebVitals?: boolean;
  lcpScoreMs?: number;
  clsScore?: number;
}

export type DiscoverPageExperienceStatus = 'OPTIMAL' | 'ACCEPTABLE' | 'UNKNOWN' | 'POOR';

export interface DiscoverPageExperienceValidationResult {
  experienceStatus: DiscoverPageExperienceStatus;
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 5
  issues: DiscoverIssue[];
}

export class DiscoverPageExperienceValidator {
  public validate(signals?: PageExperienceSignals | null): DiscoverPageExperienceValidationResult {
    const issues: DiscoverIssue[] = [];
    let score = 5; // Bobot penuh Page Experience = 5
    let status: DiscoverPageExperienceStatus = 'ACCEPTABLE';

    if (!signals) {
      status = 'UNKNOWN';
      score = 3;
      issues.push({
        code: 'UNVERIFIED_PAGE_EXPERIENCE',
        checkId: 'DISCOVER_PAGE_EXPERIENCE',
        dimension: 'PAGE_EXPERIENCE',
        severity: 'INFO',
        message: 'Data empiris kenyamanan halaman (Page Experience / CWV) belum tersedia.',
        location: 'pageExperience',
        recommendation: 'Lakukan audit berkala pada Core Web Vitals di perangkat mobile.'
      });

      return {
        experienceStatus: status,
        checkResult: {
          checkId: 'DISCOVER_PAGE_EXPERIENCE',
          dimension: 'PAGE_EXPERIENCE',
          status: 'WARNING',
          scoreContribution: score,
          summary: 'Metrik Page Experience belum diukur secara empiris (status: UNKNOWN).'
        },
        score,
        issues
      };
    }

    // 1. Pemeriksaan Mobile Friendly
    if (signals.mobileFriendly === false) {
      status = 'POOR';
      score -= 3;
      issues.push({
        code: 'PAGE_EXPERIENCE_POOR',
        checkId: 'DISCOVER_PAGE_EXPERIENCE',
        dimension: 'PAGE_EXPERIENCE',
        severity: 'CRITICAL',
        message: 'Halaman terindikasi tidak mobile-friendly. Discover adalah platform mobile-first!',
        location: 'signals.mobileFriendly',
        recommendation: 'Optimalkan tata letak responsive viewport untuk layar smartphone.'
      });
    }

    // 2. Pemeriksaan Pop-up Intrusif (Intrusive Interstitial Risk)
    if (signals.intrusiveInterstitialRisk === true) {
      score -= 2;
      issues.push({
        code: 'PAGE_EXPERIENCE_POOR',
        checkId: 'DISCOVER_PAGE_EXPERIENCE',
        dimension: 'PAGE_EXPERIENCE',
        severity: 'WARNING',
        message: 'Terdeteksi risiko interstitial yang menghalangi konten utama (pop-up/banner agresif).',
        location: 'signals.intrusiveInterstitialRisk',
        recommendation: 'Hindari pop-up layar penuh yang menutupi konten artikel saat pembaca pertama kali mendarat.'
      });
    }

    // 3. Pemeriksaan HTTPS (Secure Transport)
    if (signals.secureTransport === false) {
      status = 'POOR';
      score -= 2;
      issues.push({
        code: 'PAGE_EXPERIENCE_POOR',
        checkId: 'DISCOVER_PAGE_EXPERIENCE',
        dimension: 'PAGE_EXPERIENCE',
        severity: 'CRITICAL',
        message: 'Koneksi tidak menggunakan HTTPS. Google Discover mewajibkan enkripsi HTTPS yang aman.',
        location: 'signals.secureTransport',
        recommendation: 'Aktifkan sertifikat SSL/TLS dan alihkan traffic ke protokol HTTPS.'
      });
    }

    // 4. Verifikasi Core Web Vitals
    if (signals.hasMeasuredCoreWebVitals) {
      if ((signals.lcpScoreMs && signals.lcpScoreMs > 4000) || (signals.clsScore && signals.clsScore > 0.25)) {
        score -= 2;
        issues.push({
          code: 'PAGE_EXPERIENCE_POOR',
          checkId: 'DISCOVER_PAGE_EXPERIENCE',
          dimension: 'PAGE_EXPERIENCE',
          severity: 'WARNING',
          message: 'Hasil ukur Core Web Vitals menunjukkan waktu muat lambat (LCP > 4s) atau pergeseran tata letak tinggi (CLS > 0.25).',
          location: 'signals.cwv',
          recommendation: 'Optimasi aset gambar dan stabilkan dimensi elemen visual halaman.'
        });
      } else {
        status = 'OPTIMAL';
      }
    } else {
      status = 'UNKNOWN';
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_PAGE_EXPERIENCE',
      dimension: 'PAGE_EXPERIENCE',
      status: status === 'POOR' ? 'FAIL' : status === 'UNKNOWN' ? 'WARNING' : 'PASS',
      scoreContribution: Math.max(0, Math.min(5, score)),
      summary: status === 'OPTIMAL'
        ? 'Pengalaman halaman mobile optimal dengan metrik Core Web Vitals yang terverifikasi.'
        : `Status pengalaman halaman: ${status}.`
    };

    return {
      experienceStatus: status,
      checkResult,
      score: Math.max(0, score),
      issues
    };
  }
}
