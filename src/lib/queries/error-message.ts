import { ApiError } from '@/lib/api-client';

/**
 * The text to show for a failed request: the API's own message when it sent
 * one, otherwise the caller's fallback (a network failure, for instance, has
 * no message worth showing).
 *
 * Shared by every `lib/queries/*` module. Each used to carry its own copy.
 */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
