import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  hasHydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
  setHasHydrated: (value: boolean) => void;
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? (prefersDark() ? 'dark' : 'light') : preference;
}

function applyTheme(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      hasHydrated: false,
      setPreference: (preference) => {
        set({ preference });
        applyTheme(preference);
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'dinastore-theme',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.setHasHydrated(true);
        applyTheme(state.preference);
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().preference === 'system') {
      applyTheme('system');
    }
  });

  // Astro's view transitions (ClientRouter) swap <html>'s attributes to match
  // the freshly-fetched (unexecuted) page on every soft navigation, which
  // wipes the `dark` class this store applied. Nothing else re-applies it —
  // this module is a singleton that survives soft navs, so `onRehydrateStorage`
  // only fires once. Re-apply the already-hydrated preference after each swap.
  document.addEventListener('astro:after-swap', () => {
    applyTheme(useThemeStore.getState().preference);
  });
}
