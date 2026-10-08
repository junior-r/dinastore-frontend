import { useEffect, useRef } from 'react';
import { reportProductView } from '../lib/api/analytics';
import { randomUuid } from '../lib/uuid';
import { getVisitorId } from '../lib/visitor-id';
import { useAuthStore } from '../stores/auth-store';

// How often a visit in progress reports in. The trade-off is precision
// against request volume: if a tab is killed without warning (a crash, a
// phone reclaiming memory), at most this much watching time is lost.
const HEARTBEAT_MS = 15_000;

/**
 * Reports how long a product page is actually looked at, for the admin's
 * product-view history. Mount it on the product page once the product is
 * known.
 *
 * "Looked at" means the tab is visible. Time spent in a background tab, or
 * with the screen off, is not counted: the clock stops on `visibilitychange`
 * and resumes when the visitor comes back.
 *
 * It reports when the visit opens, on a heartbeat while visible, when the tab
 * is hidden, when the favorite state changes, and when the page goes away.
 * Each report carries the running total, not a delta, so a report that is
 * lost or arrives late costs nothing: the next one supersedes it.
 *
 * Nothing here can affect the page. A failed report is dropped silently,
 * because a metrics request is never worth an error in front of a shopper.
 */
export function useProductViewTracking(productId: string | undefined, favorited: boolean): void {
  // Read through refs inside the long-lived effect below, so a change in
  // favorite state doesn't tear the visit down and start a new one.
  const favoritedRef = useRef(favorited);
  const sendRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    const viewId = randomUuid();
    const visitorId = getVisitorId();
    let accumulatedMs = 0;
    // Null while the tab is hidden. performance.now() rather than Date.now():
    // it can't jump if the system clock is adjusted mid-visit.
    let visibleSince: number | null = document.visibilityState === 'visible' ? performance.now() : null;

    function pause() {
      if (visibleSince !== null) {
        accumulatedMs += performance.now() - visibleSince;
        visibleSince = null;
      }
    }

    function send() {
      const running = visibleSince === null ? 0 : performance.now() - visibleSince;
      // Read at send time, not captured: someone who signs in halfway through
      // a visit has the rest of it reported under their account.
      const token = useAuthStore.getState().accessToken ?? undefined;
      reportProductView(
        {
          viewId,
          productId: productId as string,
          visitorId,
          durationMs: Math.round(accumulatedMs + running),
          favorited: favoritedRef.current,
        },
        token,
      ).catch(() => {
        // See the note above: metrics never surface an error.
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        pause();
        // Hidden is the last moment a mobile browser reliably lets a page
        // run, so this is treated as a possible goodbye.
        send();
      } else {
        visibleSince = performance.now();
      }
    }

    function handlePageHide() {
      pause();
      send();
    }

    sendRef.current = send;
    send();
    const heartbeat = window.setInterval(() => {
      if (visibleSince !== null) {
        send();
      }
    }, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // Runs on an Astro soft navigation away from the product (the page
      // doesn't unload, so pagehide never fires) and when the product itself
      // changes. Either way this visit is over: stop the clock and send the
      // final total.
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      sendRef.current = null;
      pause();
      send();
    };
  }, [productId]);

  // Saving or removing the favorite is reported straight away rather than
  // left for the next heartbeat, so the row is right even if the visitor
  // leaves in the next few seconds. Skipped when the value hasn't changed,
  // which includes the first render (the opening report already carries it).
  useEffect(() => {
    if (favoritedRef.current === favorited) {
      return;
    }
    favoritedRef.current = favorited;
    sendRef.current?.();
  }, [favorited]);
}
