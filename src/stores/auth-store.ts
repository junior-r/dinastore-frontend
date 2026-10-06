import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../lib/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  /**
   * `persist` restores accessToken/user from localStorage asynchronously, so a
   * fresh page load briefly has `accessToken: null` before hydration finishes.
   * Consumers must gate on this (via the store itself, not a separate React
   * state) so it always updates atomically with accessToken/user.
   */
  hasHydrated: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'dinastore-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
