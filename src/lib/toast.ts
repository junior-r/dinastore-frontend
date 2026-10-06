import { toast } from 'sonner';

const STORAGE_KEY = 'dinastore-pending-toast';

type ToastKind = 'success' | 'error';

interface PendingToast {
  kind: ToastKind;
  message: string;
}

// Several actions (login, register, logout, place order) redirect via a hard
// `window.location.href` navigation immediately after succeeding, which tears
// down the current page (and its Toaster) before sonner can render anything.
// Queue the toast here and flush it once the next page's Toaster mounts.
export function toastOnNextLoad(kind: ToastKind, message: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, message } satisfies PendingToast));
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — skip, not fatal.
  }
}

export function flushPendingToast() {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) {
    return;
  }
  try {
    const pending = JSON.parse(raw) as PendingToast;
    toast[pending.kind](pending.message);
  } catch {
    // malformed payload — ignore.
  }
}
