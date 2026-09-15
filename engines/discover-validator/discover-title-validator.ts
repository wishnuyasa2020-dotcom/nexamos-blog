/**
 * NexaMOS Google Discover Title & Headline Validator
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 4B specifications.
 * Menilai integritas judul untuk feed Discover: esensi konten, spesifisitas, dan perlindungan dari manipulasi emosional.
 * DOKTRIN PENTING: JANGAN KACAUkan Strong Provocative Hook dengan Clickbait Murahan!
 * Judul seperti "AI Tidak Membunuh Blog. Ia Membunuh Blog Generik." adalah SAH jika didukung bukti dan tesis.
 * Yang ditolak adalah formula rasa ingin tahu hampa (curiosity gap), kemarahan palsu (outrage bait), dan kepalsuan fakta.
 */

import type { ArticleDraft } from '../editorial/article-draft.ts';
import type { DiscoverCheckResult, DiscoverIssue } from './discover-validation.ts';

export interface DiscoverTitleValidationResult {
  checkResult: DiscoverCheckResult;
  score: number; // 0 - 10
  isClickbait: boolean;
  issues: DiscoverIssue[];
}

export class DiscoverTitleValidator {
  private readonly clickbaitPatterns = [
    /\b(bikin syok|bikin kaget|wajib tahu sebelum terlambat|rahasia gila|nomor \d+ bikin geleng-geleng)\b/i,
    /\b(kamu tidak akan percaya|jangan baca ini jika|terkuak sudah|ini yang mereka sembunyikan)\b/i,
    /\b(hancur total seketika|kebohongan besar terbongkar)\b/i,
    /!{2,}/
  ];

  public validate(draft: ArticleDraft): DiscoverTitleValidationResult {
    const issues: DiscoverIssue[] = [];
    const title = draft.title?.trim() || '';
    let score = 10; // Bobot penuh Title Integrity = 10
    let isClickbait = false;

    if (!title) {
      score = 0;
      issues.push({
        code: 'CRITICAL_TITLE_DECEPTION',
        checkId: 'DISCOVER_TITLE_INTEGRITY',
        dimension: 'TITLE_INTEGRITY',
        severity: 'CRITICAL',
        message: 'Judul artikel kosong.',
        location: 'draft.title',
        recommendation: 'Tentukan judul artikel yang jelas menangkap esensi tulisan.'
      });
      return {
        checkResult: {
          checkId: 'DISCOVER_TITLE_INTEGRITY',
          dimension: 'TITLE_INTEGRITY',
          status: 'FAIL',
          scoreContribution: 0,
          summary: 'Judul artikel kosong.'
        },
        score: 0,
        isClickbait: false,
        issues
      };
    }

    // 1. Deteksi Formula Clickbait Murahan (Rasa Ingin Tahu Hampa / Outrage Bait)
    for (const pattern of this.clickbaitPatterns) {
      if (pattern.test(title)) {
        isClickbait = true;
        score = 2;
        issues.push({
          code: 'DISCOVER_CLICKBAIT_RISK',
          checkId: 'DISCOVER_TITLE_INTEGRITY',
          dimension: 'TITLE_INTEGRITY',
          severity: 'WARNING',
          message: `Judul ("${title}") mengandung formula clickbait manipulatif yang melanggar pedoman Google Discover.`,
          location: 'draft.title',
          recommendation: 'Ubah judul menjadi rumusan masalah intelektual yang substantif dan deskriptif.'
        });
        break;
      }
    }

    // 2. Evaluasi Keselarasan Judul dengan Isi (CLAIM SUPPORT + CONTENT MATCH)
    const titleLower = title.toLowerCase();
    const thesisLower = (draft.thesis || '').toLowerCase();
    const contentText = draft.sections.map((s) => `${s.heading} ${s.content}`).join(' ').toLowerCase();

    const indonesianStopwords = new Set([
      'apakah', 'masih', 'yang', 'dalam', 'dengan', 'mengapa', 'bukan', 'tidak',
      'adalah', 'untuk', 'pada', 'oleh', 'dari', 'bisa', 'akan', 'lebih', 'tentang',
      'secara', 'antara', 'tetapi', 'namun', 'karena', 'seperti', 'hanya', 'tanpa'
    ]);

    // Ekstraksi kata-kata substantif judul (> 3 karakter dan bukan stopword)
    const titleWords = titleLower
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !indonesianStopwords.has(w));

    let matchedWords = 0;
    for (const tw of titleWords) {
      if (thesisLower.includes(tw) || contentText.includes(tw)) {
        matchedWords++;
      }
    }

    const matchRatio = titleWords.length > 0 ? matchedWords / titleWords.length : 1;

    // Jika judul mengklaim hal yang tidak dibahas di badan artikel (TITLE_CONTENT_MISMATCH)
    if (matchRatio < 0.3 && titleWords.length >= 2) {
      score = Math.min(score, 3);
      issues.push({
        code: 'TITLE_CONTENT_MISMATCH',
        checkId: 'DISCOVER_TITLE_INTEGRITY',
        dimension: 'TITLE_INTEGRITY',
        severity: 'WARNING',
        message: 'Terdapat jurang ketidakcocokan antara judul dengan isi naskah (misleading title / bait-and-switch).',
        location: 'draft.title',
        recommendation: 'Pastikan judul secara jujur mencerminkan argumen yang diuraikan di badan artikel.'
      });
    }

    // 3. Evaluasi Strong Hook vs Sensasionalisme
    // Judul yang kuat dan provokatif diizinkan jika matchRatio tinggi dan tidak menggunakan formula clickbait
    if (!isClickbait && matchRatio >= 0.7) {
      // Judul kuat dan didukung penuh
      score = 10;
    }

    const checkResult: DiscoverCheckResult = {
      checkId: 'DISCOVER_TITLE_INTEGRITY',
      dimension: 'TITLE_INTEGRITY',
      status: issues.some((i) => i.severity === 'CRITICAL')
        ? 'FAIL'
        : issues.some((i) => i.severity === 'WARNING')
        ? 'WARNING'
        : 'PASS',
      scoreContribution: Math.max(0, Math.min(10, score)),
      summary: issues.length === 0
        ? 'Judul berwibawa, menangkap esensi konten dengan akurat, dan bebas dari clickbait.'
        : `Catatan integritas judul: ${issues[0].message}`
    };

    return {
      checkResult,
      score,
      isClickbait,
      issues
    };
  }
}
