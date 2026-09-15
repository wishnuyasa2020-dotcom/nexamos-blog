/**
 * NexaMOS Shared Domain Result Pattern
 *
 * Sourced from NexaMOS Blog Phase 1C specifications
 */

export type Result<T, E = DomainError> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: E;
    };

export const ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value
});

export const err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error
});

export type DomainErrorCode =
  | 'TOPIC_NOT_FOUND'
  | 'DUPLICATE_TOPIC_ID'
  | 'DUPLICATE_TOPIC_SLUG'
  | 'INVALID_TOPIC_TRANSITION'
  | 'TOPIC_NOT_QUALIFIED'
  | 'TOPIC_NOT_PRIORITIZED'
  | 'TOPIC_NOT_APPROVED'
  | 'ARTICLE_RELATION_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED_OVERRIDE'
  | 'REPOSITORY_ERROR';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export function createDomainError(
  code: DomainErrorCode,
  message: string,
  details?: Record<string, unknown>
): DomainError {
  return {
    code,
    message,
    details
  };
}
