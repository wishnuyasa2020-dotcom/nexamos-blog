/// <reference path="../../../tests/ambient.d.ts" />
/**
 * NexaMOS Content Hasher Helper
 *
 * Sourced from NexaMOS Blog Phase 2B specifications
 * Menggunakan Node.js native crypto untuk hashing SHA-256
 */

import { createHash } from 'node:crypto';

export function computeContentHash(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  return createHash('sha256').update(normalized, 'utf-8').digest('hex');
}
