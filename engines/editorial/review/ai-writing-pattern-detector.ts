/**
 * NexaMOS AI Writing Pattern Detector
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 3B specifications
 * Mendeteksi pola repetitif dan klise khas model bahasa (AI_STYLE_RISK).
 * PENTING: Ini adalah detektor pola gaya bahasa (style pattern), bukan vonis kepengarangan (authorship verdict).
 */

import type { ArticleDraft } from '../article-draft.ts';
import type { ReviewIssue } from './editorial-review.ts';

export interface AIWritingPatternResult {
  score: number; // 0 - 100 (100 = alami dan unik, rendah = tinggi pola klise)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  issues: ReviewIssue[];
  strengths: string[];
}

export class AIWritingPatternDetector {
  private readonly clichePatterns = [
    {
      regex: /(^|[.!?]\s+)(dalam era|di era)\s+(digital|ai|kecerdasan buatan|globalisasi|informasi|modern ini)\s*(yang berkembang pesat|saat ini|,|\s+yang\b)/gi,
      name: 'CLICHE_ERA_OPENING',
      message: 'Penggunaan pembuka klise "dalam era..." yang terlalu sering muncul pada teks AI generik.',
      recommendation: 'Buka langsung dengan peristiwa spesifik, kontradiksi data, atau dinamika nyata pasar.'
    },
    {
      regex: /\b(penting untuk dicatat bahwa|perlu diingat bahwa|patut digarisbawahi bahwa)\b/gi,
      name: 'EXCESSIVE_META_SIGNALLING',
      message: 'Frasa meta "penting untuk dicatat bahwa" yang melemahkan ketegasan kalimat.',
      recommendation: 'Hapus frasa tersebut dan langsung sampaikan poin pentingnya secara lugas.'
    },
    {
      regex: /\b(tidak dapat dipungkiri bahwa|bukan rahasia lagi bahwa)\b/gi,
      name: 'EMPTY_CERTAINTY_PHRASE',
      message: 'Frasa kepastian hampa yang tidak menambah nilai pembuktian.',
      recommendation: 'Sajikan bukti langsung daripada memakai pengantar kepastian verbal.'
    },
    {
      regex: /\b(mari kita|kita harus bersama-sama|semoga artikel ini bermanfaat)\b/gi,
      name: 'GENERIC_MOTIVATIONAL_ENDING',
      message: 'Penutup bergaya motivasi generik yang kurang sesuai dengan standar analitis NexaMOS.',
      recommendation: 'Tutup dengan implikasi keputusan strategis atau ringkasan arsitektural.'
    }
  ];

  public evaluate(draft: ArticleDraft): AIWritingPatternResult {
    const issues: ReviewIssue[] = [];
    const strengths: string[] = [];
    let score = 100;

    for (const section of draft.sections) {
      for (const pattern of this.clichePatterns) {
        const matches = section.content.match(pattern.regex);
        if (matches && matches.length > 0) {
          issues.push({
            dimension: 'ORIGINALITY',
            code: 'AI_STYLE_RISK',
            message: `${pattern.message} (Terdeteksi: "${matches[0]}")`,
            severity: 'MINOR',
            sectionId: section.id,
            snippet: matches[0],
            recommendation: pattern.recommendation
          });
          score -= 8;
        }
      }
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (issues.length >= 3) {
      riskLevel = 'HIGH';
    } else if (issues.length >= 1) {
      riskLevel = 'MEDIUM';
    }

    if (riskLevel === 'LOW') {
      strengths.push('Gaya penulisan terdengar alami, berbobot, dan bebas dari pola klise AI generik.');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      riskLevel,
      issues,
      strengths
    };
  }
}
