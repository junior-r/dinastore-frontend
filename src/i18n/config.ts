export const LOCALES = ['es', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * What the server renders, and therefore what React's first (hydrating)
 * client render must also produce — see `useLocale`. The server has no access
 * to localStorage or `navigator.language`, so it cannot know the visitor's
 * real preference; Spanish is the configured fallback, so it is also the
 * safest thing to put in the initial HTML.
 */
export const SSR_LOCALE: Locale = 'es';

export const STORAGE_KEY = 'dinastore-locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

/** Short label for the toggle button itself. */
export const LOCALE_SHORT: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * First-visit default: honour an English browser, otherwise fall back to
 * Spanish. Kept in sync with the inline no-FOUC script in `Layout.astro`,
 * which runs the same check before paint — change both together.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'en') return 'en';
    if (base === 'es') return 'es';
  }
  return 'es';
}
