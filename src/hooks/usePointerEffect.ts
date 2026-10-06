import { useEffect, useRef } from 'react';

type PointerEffect = 'tilt' | 'spotlight';

/**
 * Feeds the pointer's position to CSS as custom properties, for effects that
 * follow the cursor.
 *
 * - `tilt` sets `--tilt-x`/`--tilt-y` on the element itself, each from -1 to
 *   1 across its width and height (0 at the center, and again on leave).
 * - `spotlight` sets `--spot-x`/`--spot-y`, in pixels, on every descendant
 *   with a `data-spotlight` attribute, each relative to that descendant's own
 *   box. One listener on a grid therefore drives every tile in it.
 *
 * The values go straight onto `style`, batched to one write per frame, and
 * never through React state: a pointer moves far faster than a component
 * should re-render. Nothing is attached for touch-only devices or when the
 * visitor has asked for reduced motion.
 */
export function usePointerEffect<T extends HTMLElement>(effect: PointerEffect) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frame = 0;
    let latest: PointerEvent | null = null;

    function apply() {
      frame = 0;
      if (!latest || !element) {
        return;
      }
      if (effect === 'tilt') {
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--tilt-x', (((latest.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
        element.style.setProperty('--tilt-y', (((latest.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
        return;
      }
      for (const target of element.querySelectorAll<HTMLElement>('[data-spotlight]')) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--spot-x', `${latest.clientX - rect.left}px`);
        target.style.setProperty('--spot-y', `${latest.clientY - rect.top}px`);
      }
    }

    function handleMove(event: PointerEvent) {
      latest = event;
      if (!frame) {
        frame = requestAnimationFrame(apply);
      }
    }

    function handleLeave() {
      if (effect === 'tilt' && element) {
        element.style.setProperty('--tilt-x', '0');
        element.style.setProperty('--tilt-y', '0');
      }
    }

    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerleave', handleLeave);

    return () => {
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', handleLeave);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [effect]);

  return ref;
}
