import { useEffect, useState } from 'react';
import { me } from '../lib/api/auth';
import { useAuthStore } from '../stores/auth-store';
import type { Permission, User } from '../lib/types';
import { can, isStaff } from '@/lib/permissions';

interface AdminAccess {
  // False until hydration finished and every check passed — callers should
  // render a loading state (or nothing) until this flips true, same as
  // AccountView does with hasHydrated/loading.
  authorized: boolean;
  hasHydrated: boolean;
  user: User | null;
  accessToken: string | null;
}

// Shared gating logic for every /admin page: redirects to /login if signed
// out, or to / if signed in but not an ADMIN/STAFF, or (when a permission is
// passed) if STAFF but missing that specific grant. ADMIN always passes the
// permission check, mirroring the backend's PermissionsGuard.
export function useRequireAdminAccess(permission?: Permission): AdminAccess {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [authorized, setAuthorized] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  // Re-fetches the user from the DB on every admin page load. The JWT itself
  // is stateless (JwtStrategy doesn't hit the DB per request), so without
  // this a role/permission change or deactivation made by another admin
  // wouldn't show up here until this user's token was reissued via a fresh
  // login — the persisted `user` in auth-store would just be stale.
  useEffect(() => {
    // Wait for hydration itself before touching `refreshed` — otherwise this
    // early-returns on the pre-hydration render (accessToken not loaded from
    // localStorage yet), the authorization effect below sees refreshed=true
    // and fires immediately after hydration using the just-rehydrated STALE
    // user, one render before the real me() call below even starts.
    if (!hasHydrated) {
      return;
    }
    if (!accessToken) {
      setRefreshed(true);
      return;
    }
    let cancelled = false;
    me(accessToken)
      .then((freshUser) => {
        if (!cancelled) {
          setSession(accessToken, freshUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRefreshed(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // Deliberately only re-runs when the token itself changes (login/logout),
    // not on every `user` update — the setSession call above would otherwise
    // re-trigger this in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, accessToken]);

  useEffect(() => {
    if (!hasHydrated || !refreshed) {
      return;
    }
    if (!accessToken || !user) {
      window.location.href = '/login';
      return;
    }
    if (!user.isActive) {
      clearSession();
      window.location.href = '/login';
      return;
    }
    if (!isStaff(user)) {
      window.location.href = '/';
      return;
    }
    if (permission && !can(user, permission)) {
      window.location.href = '/';
      return;
    }
    setAuthorized(true);
  }, [hasHydrated, refreshed, accessToken, user, permission, clearSession]);

  return { authorized, hasHydrated, user, accessToken };
}
