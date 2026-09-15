/**
 * NexaMOS Editorial Generation Request Contract
 *
 * Sourced from NexaMOS Blog Phase 3A specifications
 * Kontrak input kanonikal untuk memicu generasi naskah artikel ter-grounding.
 */

import type { Topic } from '../ideation/domain/topic.types.ts';
import type { ArticleType } from '../ideation/domain/article-type.ts';
import type { EditorialRole } from '../ideation/domain/editorial-role.ts';
import type { Territory } from '../ideation/domain/territory.ts';
import type { ResearchBrief } from '../research/orchestrator/research-brief.ts';

export interface AuthorContext {
  name: string;
  role?: string | null;
  bio?: string | null;
}

export interface BrandContext {
  voice?: string | null;
  guidelines?: string[] | null;
}

export interface TargetLength {
  minWords?: number;
  maxWords?: number;
}

export interface EditorialGenerationRequest {
  topic: Topic;
  researchBrief: ResearchBrief;
  articleType: ArticleType;
  editorialRole: EditorialRole;
  territory: Territory;
  audience: string;
  primaryObjective: string;

  editorialAngle?: string | null;
  targetLength?: TargetLength | null;
  authorContext?: AuthorContext | null;
  brandContext?: BrandContext | null;
}
