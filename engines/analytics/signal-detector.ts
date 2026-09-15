/**
 * NexaMOS Signal Detector Engine
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 7 specifications (Sections 19, 20, 21, 22).
 * Hard Principles:
 * - Deterministic signal detection.
 * - No universal threshold: contextual based on baseline and window.
 * - Sample sufficiency guard: LOW_SAMPLE cannot yield HIGH confidence signals.
 * - Trend comparison: current window vs previous comparable window.
 */

import type { ArticlePerformanceSnapshot, PerformanceBaseline } from './performance-snapshot.ts';
import type { PerformanceSignal, PerformanceSignalType, SignalConfidence } from './performance-signal.ts';
import type { SampleSufficiency } from './analytics-metric.ts';

export class SignalDetector {
  /**
   * Mendeteksi sinyal performa dari snapshot saat ini, snapshot sebelumnya (opsional), dan baseline kohort (opsional)
   */
  public detectSignals(params: {
    currentSnapshot: ArticlePerformanceSnapshot;
    previousSnapshot?: ArticlePerformanceSnapshot | null;
    baseline?: PerformanceBaseline | null;
  }): PerformanceSignal[] {
    const { currentSnapshot, previousSnapshot, baseline } = params;
    const signals: PerformanceSignal[] = [];

    const hasAnomaly = currentSnapshot.anomaliesDetected.length > 0;
    const overallSufficiency = currentSnapshot.overallSampleSufficiency;

    // Helper penentu confidence berbasis kecukupan sampel dan anomali
    const determineConfidence = (rawConfidence: SignalConfidence, sufficiency: SampleSufficiency): SignalConfidence => {
      if (sufficiency === 'INSUFFICIENT') return 'LOW';
      if (sufficiency === 'LOW_SAMPLE' && rawConfidence === 'HIGH') return 'MEDIUM';
      if (hasAnomaly && rawConfidence === 'HIGH') return 'MEDIUM';
      return rawConfidence;
    };

    // 1. Sinyal Search Impressions Rising / Falling (Trend vs Previous Window)
    if (currentSnapshot.search && previousSnapshot?.search) {
      const currImp = currentSnapshot.search.impressions.value ?? 0;
      const prevImp = previousSnapshot.search.impressions.value ?? 0;

      if (prevImp > 0) {
        const deltaPct = ((currImp - prevImp) / prevImp) * 100;
        const searchSufficiency = currentSnapshot.search.impressions.sampleSufficiency;

        if (deltaPct >= 25 && currImp >= 100) {
          signals.push({
            id: `sig-search-rising-${Date.now()}-${signals.length}`,
            articleId: currentSnapshot.articleId,
            signalType: 'SEARCH_IMPRESSIONS_RISING',
            confidence: determineConfidence('HIGH', searchSufficiency),
            window: currentSnapshot.window,
            sampleSufficiency: searchSufficiency,
            metricsObserved: { currentImpressions: currImp, previousImpressions: prevImp, deltaPercentage: deltaPct },
            description: `Impresi pencarian meningkat sebesar ${deltaPct.toFixed(1)}% dibandingkan periode sebelumnya.`,
            context: { percentageDelta: deltaPct, hasProviderAnomaly: hasAnomaly },
            detectedAt: new Date().toISOString()
          });
        } else if (deltaPct <= -30 && prevImp >= 100) {
          signals.push({
            id: `sig-search-falling-${Date.now()}-${signals.length}`,
            articleId: currentSnapshot.articleId,
            signalType: 'SEARCH_IMPRESSIONS_FALLING',
            confidence: determineConfidence('MEDIUM', searchSufficiency),
            window: currentSnapshot.window,
            sampleSufficiency: searchSufficiency,
            metricsObserved: { currentImpressions: currImp, previousImpressions: prevImp, deltaPercentage: deltaPct },
            description: `Impresi pencarian menurun sebesar ${Math.abs(deltaPct).toFixed(1)}% dibandingkan periode sebelumnya.`,
            context: { percentageDelta: deltaPct, hasProviderAnomaly: hasAnomaly },
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    // 2. Sinyal Search CTR Discrepancy (HIGH_IMPRESSIONS_LOW_CTR vs LOW_IMPRESSIONS_HIGH_CTR)
    if (currentSnapshot.search) {
      const imp = currentSnapshot.search.impressions.value ?? 0;
      const ctr = currentSnapshot.search.ctr.value ?? 0;
      const searchSufficiency = currentSnapshot.search.impressions.sampleSufficiency;

      // Ambang batas benchmark kohort jika ada, atau batas kontekstual
      const benchmarkCTR = baseline?.benchmarks.medianSearchCTR ?? 0.035; // Default ~3.5%

      if (imp >= 500 && ctr < benchmarkCTR * 0.5 && searchSufficiency === 'SUFFICIENT') {
        signals.push({
          id: `sig-high-imp-low-ctr-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'HIGH_IMPRESSIONS_LOW_CTR',
          confidence: determineConfidence('HIGH', searchSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: searchSufficiency,
          metricsObserved: { impressions: imp, ctr, benchmarkCTR },
          description: `Impresi pencarian tinggi (${imp}) tetapi CTR (${(ctr * 100).toFixed(2)}%) berada jauh di bawah benchmark (${(benchmarkCTR * 100).toFixed(2)}%). Mengindikasikan potensi kelemahan pada presentation/judul/snippet SERP.`,
          detectedAt: new Date().toISOString()
        });
      } else if (imp < 200 && imp >= 30 && ctr >= 0.08) {
        signals.push({
          id: `sig-low-imp-high-ctr-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'LOW_IMPRESSIONS_HIGH_CTR',
          confidence: determineConfidence('MEDIUM', searchSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: searchSufficiency,
          metricsObserved: { impressions: imp, ctr },
          description: `CTR sangat tinggi (${(ctr * 100).toFixed(2)}%) meskipun volume impresi masih terbatas (${imp}). Mengindikasikan keselarasan relevansi judul yang kuat pada segmen pencari tertentu.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // 3. Sinyal Google Discover (EMERGING, SPIKE, DECAY)
    if (currentSnapshot.discover && currentSnapshot.discover.thresholdStatus === 'ABOVE_THRESHOLD') {
      const discImp = currentSnapshot.discover.impressions.value ?? 0;
      const prevDiscImp = previousSnapshot?.discover?.impressions.value ?? 0;
      const discSufficiency = currentSnapshot.discover.impressions.sampleSufficiency;

      if (prevDiscImp === 0 && discImp >= 100) {
        signals.push({
          id: `sig-disc-emerging-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'DISCOVER_VISIBILITY_EMERGING',
          confidence: determineConfidence('HIGH', discSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: discSufficiency,
          metricsObserved: { discoverImpressions: discImp },
          description: `Artikel mulai menembus ambang batas kemunculan Google Discover (${discImp} impresi awal terdeteksi).`,
          detectedAt: new Date().toISOString()
        });
      } else if (prevDiscImp > 0 && discImp >= prevDiscImp * 2.5 && discImp >= 500) {
        signals.push({
          id: `sig-disc-spike-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'DISCOVER_VISIBILITY_SPIKE',
          confidence: determineConfidence('HIGH', discSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: discSufficiency,
          metricsObserved: { currentDiscoverImpressions: discImp, previousDiscoverImpressions: prevDiscImp },
          description: `Lonjakan tajam impresi Google Discover terdeteksi (${discImp} vs ${prevDiscImp} periode lalu).`,
          detectedAt: new Date().toISOString()
        });
      } else if (prevDiscImp >= 500 && discImp <= prevDiscImp * 0.2) {
        signals.push({
          id: `sig-disc-decay-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'DISCOVER_VISIBILITY_DECAY',
          confidence: determineConfidence('MEDIUM', discSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: discSufficiency,
          metricsObserved: { currentDiscoverImpressions: discImp, previousDiscoverImpressions: prevDiscImp },
          description: `Penurunan wajar siklus hidup Discover (freshness decay) setelah lonjakan sebelumnya.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // 4. Sinyal Generative AI Search (AI_SEARCH_VISIBILITY_EMERGING)
    if (currentSnapshot.generativeAISearch) {
      const aiImp = currentSnapshot.generativeAISearch.impressions.value ?? 0;
      const aiSufficiency = currentSnapshot.generativeAISearch.impressions.sampleSufficiency;

      if (aiImp > 0) {
        signals.push({
          id: `sig-ai-search-emerging-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'AI_SEARCH_VISIBILITY_EMERGING',
          confidence: determineConfidence(aiImp >= 100 ? 'HIGH' : 'MEDIUM', aiSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: aiSufficiency,
          metricsObserved: { aiSearchImpressions: aiImp },
          description: `Keberadaan artikel pada hasil Generative AI Search terdeteksi (${aiImp} impresi AI). Menandakan keterlacakan sitasi/grounding aktif.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // 5. Sinyal Generative AI Discover (AI_DISCOVER_VISIBILITY_EMERGING)
    if (currentSnapshot.generativeAIDiscover) {
      const aiDiscImp = currentSnapshot.generativeAIDiscover.impressions.value ?? 0;
      const aiDiscSufficiency = currentSnapshot.generativeAIDiscover.impressions.sampleSufficiency;

      if (aiDiscImp > 0) {
        signals.push({
          id: `sig-ai-disc-emerging-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'AI_DISCOVER_VISIBILITY_EMERGING',
          confidence: determineConfidence(aiDiscImp >= 100 ? 'HIGH' : 'MEDIUM', aiDiscSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: aiDiscSufficiency,
          metricsObserved: { aiDiscoverImpressions: aiDiscImp },
          description: `Visibilitas pada Generative AI Discover terdeteksi (${aiDiscImp} impresi).`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // 6. Sinyal Behavior & Engagement (STRONG_ENGAGEMENT vs WEAK_ENGAGEMENT)
    if (currentSnapshot.behavior) {
      const sessions = currentSnapshot.behavior.sessions.value ?? 0;
      const engRate = currentSnapshot.behavior.engagementRate.value ?? 0;
      const avgTime = currentSnapshot.behavior.averageEngagementTimeSeconds.value ?? 0;
      const behSufficiency = currentSnapshot.behavior.sessions.sampleSufficiency;

      const benchmarkEngRate = baseline?.benchmarks.medianEngagementRate ?? 0.55;
      const benchmarkTime = baseline?.benchmarks.medianEngagementTimeSeconds ?? 60;

      if (sessions >= 50 && engRate >= benchmarkEngRate * 1.2 && avgTime >= benchmarkTime * 1.2) {
        signals.push({
          id: `sig-strong-eng-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'STRONG_ENGAGEMENT',
          confidence: determineConfidence('HIGH', behSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: behSufficiency,
          metricsObserved: { sessions, engagementRate: engRate, averageEngagementTime: avgTime },
          description: `Engagement pengguna sangat kuat (Engagement Rate ${(engRate * 100).toFixed(1)}%, rata-rata waktu baca ${avgTime.toFixed(0)} detik). Pembaca membaca secara mendalam.`,
          detectedAt: new Date().toISOString()
        });
      } else if (sessions >= 50 && (engRate < benchmarkEngRate * 0.6 || avgTime < benchmarkTime * 0.5)) {
        signals.push({
          id: `sig-weak-eng-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'WEAK_ENGAGEMENT',
          confidence: determineConfidence('MEDIUM', behSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: behSufficiency,
          metricsObserved: { sessions, engagementRate: engRate, averageEngagementTime: avgTime },
          description: `Engagement pengguna relatif rendah (${(engRate * 100).toFixed(1)}% engagement rate, durasi ${avgTime.toFixed(0)} detik). Mengindikasikan ketidaksesuaian ekspektasi pembaca terhadap isi naskah.`,
          detectedAt: new Date().toISOString()
        });
      }

      // 7. Sinyal Kombinasi Traffic vs Engagement
      const totalVisits = sessions;
      if (totalVisits >= 200 && engRate < 0.35) {
        signals.push({
          id: `sig-high-traf-low-eng-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'HIGH_TRAFFIC_LOW_ENGAGEMENT',
          confidence: determineConfidence('HIGH', behSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: behSufficiency,
          metricsObserved: { sessions: totalVisits, engagementRate: engRate },
          description: `Volume kunjungan tinggi (${totalVisits} sesi) tetapi engagement rendah (${(engRate * 100).toFixed(1)}%). Distribusi berhasil mendatangkan pengunjung namun retensi konten lemah.`,
          detectedAt: new Date().toISOString()
        });
      } else if (totalVisits < 100 && totalVisits >= 20 && engRate >= 0.7 && avgTime >= 90) {
        signals.push({
          id: `sig-low-traf-high-eng-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'LOW_TRAFFIC_HIGH_ENGAGEMENT',
          confidence: determineConfidence('MEDIUM', behSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: behSufficiency,
          metricsObserved: { sessions: totalVisits, engagementRate: engRate, avgTime },
          description: `Traffic masih terbatas (${totalVisits} sesi) namun pembaca yang hadir sangat terikat (${(engRate * 100).toFixed(1)}% engagement). Peluang untuk memperluas distribusi dan internal link.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    // 8. Sinyal Content Longevity (CONTENT_DECAY vs EVERGREEN_STABILITY)
    if (currentSnapshot.search && previousSnapshot?.search) {
      const currImp = currentSnapshot.search.impressions.value ?? 0;
      const prevImp = previousSnapshot.search.impressions.value ?? 0;
      if (prevImp >= 300 && currImp <= prevImp * 0.4) {
        signals.push({
          id: `sig-content-decay-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'CONTENT_DECAY',
          confidence: determineConfidence('MEDIUM', currentSnapshot.search.impressions.sampleSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: currentSnapshot.search.impressions.sampleSufficiency,
          metricsObserved: { currentImpressions: currImp, previousImpressions: prevImp },
          description: `Terdeteksi penurunan bertahap visibilitas organik (Content Decay). Artikel berpotensi membutuhkan penyegaran data bukti atau pembaruan tema.`,
          detectedAt: new Date().toISOString()
        });
      } else if (prevImp >= 200 && Math.abs(currImp - prevImp) / prevImp <= 0.15) {
        signals.push({
          id: `sig-evergreen-${Date.now()}-${signals.length}`,
          articleId: currentSnapshot.articleId,
          signalType: 'EVERGREEN_STABILITY',
          confidence: determineConfidence('HIGH', currentSnapshot.search.impressions.sampleSufficiency),
          window: currentSnapshot.window,
          sampleSufficiency: currentSnapshot.search.impressions.sampleSufficiency,
          metricsObserved: { currentImpressions: currImp, previousImpressions: prevImp },
          description: `Performa impresi organik stabil dalam rentang ±15% antar periode (Evergreen Stability). Pengetahuan memiliki umur panjang.`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    return signals;
  }
}
