import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectLocale, STORAGE_KEY, type Locale } from '../i18n/config';

interface LocaleState {
  locale: Locale;
  /** True once the persisted choice has been read back from localStorage. */
  hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
  setHasHydrated: (value: boolean) => void;
}

/** Keeps `<html lang>` in step with the store, for screen readers and `:lang()`. */
function applyLang(locale: Locale) {
  document.documentElement.lang = locale;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      // Only used until persist rehydrates (and on a first visit, where
      // `onRehydrateStorage` below replaces it with the detected language).
      locale: 'es',
      hasHydrated: false,
      setLocale: (locale) => {
        set({ locale });
        applyLang(locale);
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: STORAGE_KEY,
      // Only the choice itself is worth persisting — `hasHydrated` is
      // per-page-load state, and writing it would make the stored value lie
      // on the next load.
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state, error) => {
        if (!state) {
          return;
        }
        // Nothing stored yet (first visit) → fall back to the browser's
        // languages, same rule the inline script in Layout.astro applies.
        const stored = !error && localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          state.locale = detectLocale(navigator.languages ?? [navigator.language]);
        }
        state.setHasHydrated(true);
        applyLang(state.locale);
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  // Astro's ClientRouter swaps <html>'s attributes to match the freshly
  // fetched page on every soft navigation, which resets `lang` to whatever
  // the server rendered. Same problem (and same fix) as theme-store's
  // `dark` class — see the note there.
  document.addEventListener('astro:after-swap', () => {
    applyLang(useLocaleStore.getState().locale);
  });
}
