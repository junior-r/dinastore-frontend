import { useEffect, useRef } from 'react';

/**
 * Reveals an element (class `reveal`) or its children (class `reveal-group`)
 * the first time it scrolls into view. The animation itself is CSS, keyed off
 * the `data-reveal` attribute this hook manages; see global.css.
 *
 * The attribute is written straight to the DOM rather than held in React
 * state: it changes at most twice per element, nothing else renders from it,
 * and a state update would re-render the whole section for a style change.
 *
 * Pass `ready: false` while the element's content is still a loading
 * placeholder. The hook waits, so the reveal plays on the real content
 * instead of being spent on a skeleton.
 */
export function useReveal<T extends HTMLElement>(ready = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!ready || !element || typeof IntersectionObserver === 'undefined') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    // Already on screen: leave it alone. Hiding it now just to animate it
    // back in would be a visible flicker of content the reader can see.
    if (element.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    element.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.dataset.reveal = 'in';
          observer.disconnect();
        }
      },
      // Fires a little after the element's top edge clears the bottom of the
      // viewport, so the motion happens where the reader is looking.
      { rootMargin: '0px 0px -12% 0px' },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ready]);

  return ref;
}
