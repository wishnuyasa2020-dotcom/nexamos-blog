/**
 * NexaMOS HTTP Source Acquisition Provider
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Mengambil konten material mentah via HTTP/HTTPS standar dengan pengamanan ketat:
 * - Proteksi SSRF (blokir localhost, 127.0.0.1, private IP ranges, non-http protocols)
 * - Hanya metode GET
 * - Timeout handling
 * - Pembatasan ukuran muatan (max response size)
 * - Pemetaan Content-Type ke SourceFormat
 * - Penolakan biner PDF eksplisit (PDF_BINARY_UNSUPPORTED)
 */

import type { SourceAcquisitionProvider } from './source-acquisition-provider.ts';
import type { SourceCandidate } from '../source-candidate.ts';
import type { RawSourceInput, SourceFormat } from '../../ingestion/source-ingestion.ts';
import type { AcquisitionOptions } from '../source-acquisition.ts';
import { mapMimeTypeToSourceFormat } from '../source-acquisition.ts';
import { SourceSecurityValidator } from '../source-fetcher.ts';
import type { Result, ResearchDomainError } from '../../domain/research-result.ts';
import { ok, err, createResearchDomainError } from '../../domain/research-result.ts';

export class HttpSourceAcquisitionProvider implements SourceAcquisitionProvider {
  readonly providerName = 'HttpSourceAcquisitionProvider';
  private securityValidator: SourceSecurityValidator;

  constructor(validator?: SourceSecurityValidator) {
    this.securityValidator = validator || new SourceSecurityValidator();
  }

  async acquire(
    candidate: SourceCandidate,
    options?: AcquisitionOptions
  ): Promise<Result<RawSourceInput, ResearchDomainError>> {
    // 1. Validasi Keamanan SSRF
    const securityCheck = this.securityValidator.validateUrl(candidate.url);
    if (!securityCheck.allowed) {
      return err(
        createResearchDomainError(
          'SSRF_BLOCKED',
          `Permintaan akuisisi diblokir oleh guardrail keamanan SSRF: ${securityCheck.reason}`,
          { targetUrl: candidate.url }
        )
      );
    }

    const targetUrl = securityCheck.normalizedUrl || candidate.url;
    const timeoutMs = options?.timeoutMs || 5000;
    const maxSizeBytes = options?.maxSizeBytes || 2 * 1024 * 1024; // 2 MB

    // 2. Setup Abort Signal untuk timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NexaMOS-Research-Acquisition-Bot/1.0 (+https://nexamos.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/json,text/plain,text/markdown;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return err(
          createResearchDomainError(
            'ACQUISITION_FAILED',
            `Server merespons status error HTTP ${response.status} (${response.statusText}) untuk '${targetUrl}'.`,
            { status: response.status, statusText: response.statusText }
          )
        );
      }

      // 3. Validasi Content-Type
      const contentType = response.headers.get('content-type');
      const mappedFormat = mapMimeTypeToSourceFormat(contentType);

      if (mappedFormat === 'PDF_BINARY_UNSUPPORTED') {
        return err(
          createResearchDomainError(
            'PDF_BINARY_UNSUPPORTED',
            `Pengambilan biner PDF langsung belum didukung. Gunakan teks PDF yang telah diekstrak via format PDF_TEXT.`,
            { contentType }
          )
        );
      }

      if (!mappedFormat) {
        return err(
          createResearchDomainError(
            'UNSUPPORTED_SOURCE_FORMAT',
            `Tipe konten '${contentType}' tidak didukung oleh pipeline akuisisi NexaMOS.`,
            { contentType }
          )
        );
      }

      // 4. Pembatasan Ukuran Konten
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const declaredSize = parseInt(contentLengthHeader, 10);
        if (declaredSize > maxSizeBytes) {
          return err(
            createResearchDomainError(
              'ACQUISITION_FAILED',
              `Ukuran respons (${declaredSize} bytes) melebihi batas maksimum ${maxSizeBytes} bytes.`
            )
          );
        }
      }

      const bodyText = await response.text();
      if (bodyText.length > maxSizeBytes) {
        return err(
          createResearchDomainError(
            'ACQUISITION_FAILED',
            `Ukuran teks hasil unduhan (${bodyText.length} bytes) melebihi batas ${maxSizeBytes} bytes.`
          )
        );
      }

      const rawInput: RawSourceInput = {
        researchProjectId: candidate.researchProjectId,
        sourceType: candidate.sourceType || 'INDUSTRY_RESEARCH',
        format: mappedFormat as SourceFormat,
        title: candidate.title,
        url: targetUrl,
        publisher: candidate.publisher || null,
        author: candidate.author || null,
        publicationDate: candidate.publicationDate || null,
        content: bodyText,
        metadata: {
          acquiredVia: 'HTTP_GET',
          statusCode: response.status,
          contentType: contentType || 'unknown',
          contentSizeBytes: bodyText.length
        }
      };

      return ok(rawInput);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      const isTimeout = (fetchError as Error).name === 'AbortError';
      return err(
        createResearchDomainError(
          'ACQUISITION_FAILED',
          isTimeout
            ? `Akuisisi konten dari '${targetUrl}' melebihi batas waktu ${timeoutMs}ms.`
            : `Gagal mengambil konten dari '${targetUrl}': ${(fetchError as Error).message}`,
          { isTimeout, originalError: (fetchError as Error).message }
        )
      );
    }
  }
}
