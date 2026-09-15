/**
 * NexaMOS Performance Diagnosis Service
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Sections 23, 24, 25).
 * Hard Principles:
 * - Multi-metric diagnosis: kombinasi visibilitas + klik + engagement.
 * - Confidence dipengaruhi kelengkapan data, anomali provider, dan ukuran sampel.
 * - Guardrail: Tolak kesimpulan kausatif tanpa eksperimen terkontrol (validateCausalAttribution).
 */

import type { PerformanceSignal, SignalConfidence } from './performance-signal.ts';
import type { PerformanceDiagnosis, PerformanceDiagnosisType } from './performance-diagnosis.ts';
import { validateCausalAttribution } from './performance-diagnosis.ts';
import type { ArticlePerformanceSnapshot } from './performance-snapshot.ts';

export class PerformanceDiagnosisService {
  /**
   * Menginterpretasikan sekumpulan sinyal menjadi diagnosis performa terstruktur
   */
  public diagnose(params: {
    snapshot: ArticlePerformanceSnapshot;
    signals: PerformanceSignal[];
  }): PerformanceDiagnosis[] {
    const { snapshot, signals } = params;
    const diagnoses: PerformanceDiagnosis[] = [];

    const signalTypes = new Set(signals.map((s) => s.signalType));
    const anomalies = snapshot.anomaliesDetected;
    const hasAnomaly = anomalies.length > 0;

    // Helper penentu confidence diagnosis
    const calculateDiagnosisConfidence = (
      supportingSignals: PerformanceSignal[],
      baseConfidence: SignalConfidence
    ): SignalConfidence => {
      if (snapshot.overallSampleSufficiency === 'INSUFFICIENT') return 'LOW';
      if (hasAnomaly) return 'LOW';
      if (supportingSignals.length === 1 && supportingSignals[0].confidence === 'LOW') return 'LOW';
      if (supportingSignals.every((s) => s.confidence === 'HIGH') && baseConfidence === 'HIGH') return 'HIGH';
      return 'MEDIUM';
    };

    // 1. SEARCH_PRESENTATION_WEAKNESS: Impresi tinggi tapi CTR rendah
    if (signalTypes.has('HIGH_IMPRESSIONS_LOW_CTR')) {
      const supp = signals.filter((s) => s.signalType === 'HIGH_IMPRESSIONS_LOW_CTR');
      const conf = calculateDiagnosisConfidence(supp, 'HIGH');
      const summary =
        'Artikel berhasil meraih eksposur impresi yang besar pada hasil pencarian, namun rasio klik (CTR) berada di bawah harapan. Ini mengindikasikan adanya kelemahan presentasi pada judul, deskripsi meta, atau relevansi snippet terhadap intent kueri pencari.';
      
      const valCheck = validateCausalAttribution(summary);
      if (!valCheck.isValid) {
        throw new Error(`Pelanggaran Doktrin Kausalitas: ${valCheck.message}`);
      }

      diagnoses.push({
        id: `diag-search-pres-${Date.now()}-${diagnoses.length}`,
        articleId: snapshot.articleId,
        signals: supp,
        diagnosisType: 'SEARCH_PRESENTATION_WEAKNESS',
        summary,
        confidence: conf,
        evidence: [
          `Impresi pencarian: ${snapshot.search?.impressions.value ?? 0}`,
          `CTR aktual: ${((snapshot.search?.ctr.value ?? 0) * 100).toFixed(2)}%`,
          'Disparitas signifikan antara jangkauan tampil dan minat klik'
        ],
        limitations: hasAnomaly
          ? ['Terdeteksi anomali pencatatan pada provider data; akurasi CTR mungkin terpengaruh.']
          : ['Analisis belum memperhitungkan perubahan layout SERP eksternal Google.'],
        anomaliesConsidered: anomalies,
        createdAt: new Date().toISOString()
      });
    }

    // 2. STRONG_CONTENT_WEAK_DISTRIBUTION: Engagement sangat kuat tapi traffic/distribusi masih minim
    if (signalTypes.has('LOW_TRAFFIC_HIGH_ENGAGEMENT') || (signalTypes.has('STRONG_ENGAGEMENT') && !signalTypes.has('SEARCH_IMPRESSIONS_RISING'))) {
      const supp = signals.filter(
        (s) => s.signalType === 'LOW_TRAFFIC_HIGH_ENGAGEMENT' || s.signalType === 'STRONG_ENGAGEMENT'
      );
      const conf = calculateDiagnosisConfidence(supp, 'MEDIUM');
      const summary =
        'Kualitas retensi naskah terbukti sangat tinggi di kalangan pembaca yang hadir, namun jangkauan distribusi organik saat ini masih terbatas. Konten ini memiliki bobot substansi yang layak diperkuat melalui internal linking dan promosi saluran.';

      diagnoses.push({
        id: `diag-strong-content-${Date.now()}-${diagnoses.length}`,
        articleId: snapshot.articleId,
        signals: supp,
        diagnosisType: 'STRONG_CONTENT_WEAK_DISTRIBUTION',
        summary,
        confidence: conf,
        evidence: [
          `Sesi tercatat: ${snapshot.behavior?.sessions.value ?? 0}`,
          `Tingkat engagement: ${((snapshot.behavior?.engagementRate.value ?? 0) * 100).toFixed(1)}%`,
          `Rata-rata waktu baca: ${(snapshot.behavior?.averageEngagementTimeSeconds.value ?? 0).toFixed(0)} detik`
        ],
        limitations: [
          'Ukuran sampel pembaca saat ini masih kecil sehingga varians pembaca awal dapat mempengaruhi hasil.'
        ],
        anomaliesConsidered: anomalies,
        createdAt: new Date().toISOString()
      });
    }

    // 3. STRONG_DISTRIBUTION_WEAK_ENGAGEMENT: Traffic besar tapi bounce/engagement rendah
    if (signalTypes.has('HIGH_TRAFFIC_LOW_ENGAGEMENT') || signalTypes.has('WEAK_ENGAGEMENT')) {
      const supp = signals.filter(
        (s) => s.signalType === 'HIGH_TRAFFIC_LOW_ENGAGEMENT' || s.signalType === 'WEAK_ENGAGEMENT'
      );
      const conf = calculateDiagnosisConfidence(supp, 'HIGH');
      const summary =
        'Jangkauan penemuan pembaca sangat masif, namun mayoritas pengunjung tidak melanjutkan pembacaan mendalam. Ini menunjukkan adanya diskoneksi antara janji presentasi/judul dengan kedalaman materi pengantar pada awal artikel.';

      diagnoses.push({
        id: `diag-strong-dist-weak-eng-${Date.now()}-${diagnoses.length}`,
        articleId: snapshot.articleId,
        signals: supp,
        diagnosisType: 'STRONG_DISTRIBUTION_WEAK_ENGAGEMENT',
        summary,
        confidence: conf,
        evidence: [
          `Volume sesi pembaca: ${snapshot.behavior?.sessions.value ?? 0}`,
          `Engagement rate rendah: ${((snapshot.behavior?.engagementRate.value ?? 0) * 100).toFixed(1)}%`
        ],
        limitations: ['Faktor teknis page load speed peramban pembaca belum diisolasi sepenuhnya.'],
        anomaliesConsidered: anomalies,
        createdAt: new Date().toISOString()
      });
    }

    // 4. CONTENT_REFRESH_OPPORTUNITY: Penurunan bertahap visibilitas organik
    if (signalTypes.has('CONTENT_DECAY') || signalTypes.has('SEARCH_IMPRESSIONS_FALLING')) {
      const supp = signals.filter(
        (s) => s.signalType === 'CONTENT_DECAY' || s.signalType === 'SEARCH_IMPRESSIONS_FALLING'
      );
      const conf = calculateDiagnosisConfidence(supp, 'MEDIUM');
      const summary =
        'Terdeteksi peluruhan performa impresi organik artikel. Materi pengetahuan ini berpeluang membutuhkan penyegaran bukti data mutakhir atau pembaruan seksi kontekstual agar tetap kompetitif di mata mesin dan pembaca.';

      diagnoses.push({
        id: `diag-refresh-opp-${Date.now()}-${diagnoses.length}`,
        articleId: snapshot.articleId,
        signals: supp,
        diagnosisType: 'CONTENT_REFRESH_OPPORTUNITY',
        summary,
        confidence: conf,
        evidence: [
          'Penurunan impresi pencarian yang konsisten antar periode evaluasi',
          'Sinyal siklus penuaan bukti atau perubahan intensitas kueri industri'
        ],
        limitations: ['Belum mempertimbangkan seasonalitas pasar atau fluktuasi libur.'],
        anomaliesConsidered: anomalies,
        createdAt: new Date().toISOString()
      });
    }

    // 5. TOPIC_AUTHORITY_GAIN & AI_VISIBILITY_GAIN
    if (signalTypes.has('AI_SEARCH_VISIBILITY_EMERGING') || signalTypes.has('AI_DISCOVER_VISIBILITY_EMERGING')) {
      const supp = signals.filter(
        (s) => s.signalType === 'AI_SEARCH_VISIBILITY_EMERGING' || s.signalType === 'AI_DISCOVER_VISIBILITY_EMERGING'
      );
      const conf = calculateDiagnosisConfidence(supp, 'HIGH');
      const summary =
        'Artikel berhasil memasuki ruang sitasi dan grounding Generative AI Search / Discover. Ini menandakan struktur konten, batas klaim, dan data primer artikel memiliki keterlacakan sintesis mesin yang baik.';

      diagnoses.push({
        id: `diag-ai-vis-gain-${Date.now()}-${diagnoses.length}`,
        articleId: snapshot.articleId,
        signals: supp,
        diagnosisType: 'AI_VISIBILITY_GAIN',
        summary,
        confidence: conf,
        evidence: [
          `Impresi Generative AI Search tercatat: ${snapshot.generativeAISearch?.impressions.value ?? 0}`,
          'Kemunculan pada sistem grounding mesin penjawab terkonfirmasi'
        ],
        limitations: ['Provider belum menyediakan perincian query fan-out spesifik.'],
        anomaliesConsidered: anomalies,
        createdAt: new Date().toISOString()
      });
    }

    return diagnoses;
  }
}
