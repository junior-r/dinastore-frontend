import { QueryClient } from '@tanstack/react-query';

let browserQueryClient: QueryClient | undefined;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Server-side (Astro's SSR pass over each island) always gets a fresh client —
 * there's no request-scoped cache worth keeping across requests.
 *
 * Client-side, this returns the same singleton every call. That's what makes
 * caching/prefetching actually pay off: Astro's ClientRouter (view
 * transitions) turns same-origin navigations into soft navigations that keep
 * the JS module graph alive, so this module-level singleton — and everything
 * cached in it — survives navigating from the catalog list to a product page.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
