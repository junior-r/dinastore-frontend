// Tracks currently-open overlays (Modal, Sidebar) in mount order so Escape
// closes only the topmost one. Without this, a modal opened from inside a
// sidebar (portaled to <body>, so no DOM-nesting relationship exists between
// them) would have its own Escape handler AND the sidebar's both fire on the
// same keypress, closing both at once — see useClickOutside.ts for the same
// problem on the click side.
const stack: (() => void)[] = [];
let listenerAttached = false;

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return;
  }
  stack[stack.length - 1]?.();
}

export function pushOverlay(onClose: () => void): () => void {
  stack.push(onClose);
  if (!listenerAttached) {
    document.addEventListener('keydown', handleKeyDown);
    listenerAttached = true;
  }

  return () => {
    const index = stack.lastIndexOf(onClose);
    if (index !== -1) {
      stack.splice(index, 1);
    }
    if (stack.length === 0 && listenerAttached) {
      document.removeEventListener('keydown', handleKeyDown);
      listenerAttached = false;
    }
  };
}
