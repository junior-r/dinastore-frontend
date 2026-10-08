import { useEffect, useRef } from 'react';

// Overlays that portal to document.body (see Modal.tsx) are no longer DOM
// descendants of an ancestor overlay's ref (e.g. Sidebar's panel), even
// though they're nested in the React tree — so a plain `ref.contains(target)`
// check misreads a click inside the portaled overlay as "outside" and closes
// the ancestor too. Marking each overlay's outermost element with this
// attribute lets the check recognize "that's a different, foreign overlay,
// not truly outside me" and ignore it.
const OVERLAY_ROOT_SELECTOR = '[data-overlay-root]';

export function useClickOutside<T extends HTMLElement>(onOutsideClick: () => void) {
  const ref = useRef<T>(null);
  const callbackRef = useRef(onOutsideClick);
  callbackRef.current = onOutsideClick;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      const targetOverlay = (target instanceof Element ? target : target.parentElement)?.closest(
        OVERLAY_ROOT_SELECTOR,
      );
      const ownOverlay = ref.current.closest(OVERLAY_ROOT_SELECTOR);
      if (targetOverlay && targetOverlay !== ownOverlay) {
        return;
      }

      callbackRef.current();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return ref;
}
