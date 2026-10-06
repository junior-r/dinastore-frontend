import { randomUuid } from './uuid';

const STORAGE_KEY = 'dinastore-visitor';

// Used when localStorage is unavailable (private mode with storage blocked):
// one id for the life of the page rather than a new one per report, so a
// single visit is still a single row.
let sessionFallback: string | null = null;

/**
 * A random id for this browser, created on first use and kept in
 * localStorage. It is what lets the product-view history tell that several
 * visits came from the same anonymous person.
 *
 * It identifies a browser, not a human: it holds nothing about who they are,
 * differs on every device, and is gone if they clear their site data.
 */
export function getVisitorId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const created = randomUuid();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    sessionFallback ??= randomUuid();
    return sessionFallback;
  }
}
