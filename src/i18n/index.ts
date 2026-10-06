import { useEffect, useSyncExternalStore } from 'react';
import { useLocaleStore } from '../stores/locale-store';
import { SSR_LOCALE, type Locale } from './config';
import { en, type Dictionary } from './en';
import { es } from './es';

export type { Dictionary } from './en';
export { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale } from './config';

const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

/**
 * The active locale, hydration-safe.
 *
 * React islands here are server-rendered (confirmed: the login page's HTML
 * already contains its field labels), so the first client render has to
 * produce exactly what the server produced or React reports a hydration
 * mismatch and discards the server markup. `useSyncExternalStore`'s third
 * argument is precisely for this: it supplies the server snapshot, which
 * React also uses for the hydrating render, and only then switches to the
 * live store value. So an English visitor sees one frame of Spanish instead
 * of a console full of mismatch errors.
 */
export function useLocale(): Locale {
  return useSyncExternalStore(
    useLocaleStore.subscribe,
    () => useLocaleStore.getState().locale,
    () => SSR_LOCALE,
  );
}

/** The dictionary for the active locale. The main entry point for components. */
export function useTranslation(): Dictionary {
  return DICTIONARIES[useLocale()];
}

/**
 * Sets `document.title`. The `<title>` in `Layout.astro` is server-rendered
 * and therefore always in `SSR_LOCALE`; page islands call this to correct it
 * once the real locale is known, and again whenever it changes.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

/** Non-hook access, for the few places outside a component (e.g. event handlers). */
export function getTranslation(): Dictionary {
  return DICTIONARIES[useLocaleStore.getState().locale];
}
