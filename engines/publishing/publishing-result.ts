/**
 * NexaMOS Publishing Results Models
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 */

import type { PublicationPackage, PublicationManifest, PublicationStatus } from './publication.ts';
import type { PreflightValidationResult } from './publication-preflight.ts';
import type { PublicationEventRecord } from './publishing-event.ts';

export interface CreatePackageResult {
  success: boolean;
  package: PublicationPackage;
  event: PublicationEventRecord;
}

export interface PublishResult {
  success: boolean;
  publicationId: string;
  articleId: string;
  slug: string;
  canonicalUrl: string;
  status: PublicationStatus;
  manifest?: PublicationManifest;
  preflightResult: PreflightValidationResult;
  deploymentUrl?: string;
  error?: string;
  events: PublicationEventRecord[];
}

export interface UnpublishResult {
  success: boolean;
  publicationId: string;
  status: 'UNPUBLISHED';
  unpublishedAt: string;
  event: PublicationEventRecord;
}

export interface ArchiveResult {
  success: boolean;
  publicationId: string;
  status: 'ARCHIVED';
  archivedAt: string;
  event: PublicationEventRecord;
}

export interface RollbackResult {
  success: boolean;
  publicationId: string;
  revertedToVersion: number;
  newContentHash: string;
  event: PublicationEventRecord;
}
