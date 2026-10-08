import { QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { me } from '@/lib/api/auth';
import { riseIndex } from '@/lib/motion';
import { getQueryClient } from '@/lib/query-client';
import { useMyOrders } from '@/lib/queries/orders';
import { toastOnNextLoad } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/lib/types';
import AccountStats from './account/AccountStats';
import RecentOrders from './account/RecentOrders';
import SavedItems from './account/SavedItems';
import Avatar from './Avatar';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { isStaff } from '@/lib/permissions';

const RECENT_ORDER_COUNT = 3;

// Mirrors the loaded page's blocks (header, three stat tiles, two columns) so
// nothing jumps when the profile arrives.
function AccountSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-44 rounded-3xl bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-64 rounded-lg bg-surface-muted lg:col-span-3" />
        <div className="h-64 rounded-lg bg-surface-muted lg:col-span-2" />
      </div>
    </div>
  );
}

function AccountInner() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // One request serves both the orders count (its `total`) and the short
  // list. It is already gated on the auth store inside the hook.
  const { data: orders } = useMyOrders({ pageSize: RECENT_ORDER_COUNT });
  const t = useTranslation();
  const format = useFormat();

  useDocumentTitle(t.account.title);

  // Runs once, right after hydration — deliberately not re-triggered by later
  // accessToken changes (e.g. clicking "Log out"), which would otherwise race
  // that action's own navigation with a redirect from here.
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      window.location.href = '/login';
      return;
    }

    me(accessToken)
      .then(setProfile)
      .catch(() => {
        clearSession();
        window.location.href = '/login';
      })
      .finally(() => setLoading(false));
  }, [hasHydrated, clearSession]);

  if (!hasHydrated || loading) {
    return <AccountSkeleton />;
  }

  if (!profile) {
    return null;
  }

  const showAdminLink = isStaff(profile);

  // Same sequence as the navbar's UserMenu, so logging out behaves the same
  // from either place: the toast is queued for the next page because the hard
  // navigation tears this one down before it could show.
  function handleLogOut() {
    clearSession();
    toastOnNextLoad('success', t.nav.loggedOut);
    window.location.href = '/';
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise relative isolate overflow-hidden rounded-3xl bg-surface-muted p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="animate-drift absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-brand/20 blur-3xl"
        />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <Avatar
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              className="h-20 w-20 text-3xl ring-4 ring-surface"
            />
            <div className="min-w-0">
              {/* The person's name is the page's heading; "Your account" is
                  the tab title and doesn't need repeating above it. On a
                  phone it wraps rather than truncates: a name cut to its
                  first word isn't the person's name. */}
              <h1 className="text-2xl font-extrabold tracking-tight break-words text-content font-stretch-expanded sm:truncate sm:text-4xl">
                {profile.name}
              </h1>
              <p className="mt-1 truncate text-content-muted">{profile.email}</p>
              <p className="mt-1 text-sm text-content-muted">{t.account.memberSince(format.date(profile.createdAt))}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {showAdminLink && (
              <a
                href="/admin"
                className="flex h-11 items-center gap-2 rounded-md bg-content px-5 text-sm font-semibold text-content-inverse transition hover:opacity-90 active:scale-[0.98]"
              >
                <LayoutDashboard size={16} />
                {t.nav.adminPanel}
              </a>
            )}
            <button
              type="button"
              onClick={handleLogOut}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-semibold text-content transition hover:border-content active:scale-[0.98]"
            >
              <LogOut size={16} />
              {t.nav.logOut}
            </button>
          </div>
        </div>
      </header>

      <AccountStats ordersTotal={orders?.total} />

      <div className="animate-rise grid gap-x-6 gap-y-10 pt-4 lg:grid-cols-5" style={riseIndex(4)}>
        <div className="lg:col-span-3">
          <RecentOrders orders={orders?.items} hasMore={(orders?.total ?? 0) > RECENT_ORDER_COUNT} />
        </div>

        <section className="lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
            {t.account.details}
          </h2>
          <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
            <div className="flex justify-between gap-4 px-5 py-4 text-sm">
              <dt className="text-content-muted">{t.account.name}</dt>
              <dd className="truncate font-medium text-content">{profile.name}</dd>
            </div>
            <div className="flex justify-between gap-4 px-5 py-4 text-sm">
              <dt className="text-content-muted">{t.account.email}</dt>
              <dd className="truncate font-medium text-content">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4 px-5 py-4 text-sm">
              <dt className="text-content-muted">{t.account.role}</dt>
              <dd className="font-medium text-content">{profile.role}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="animate-rise pt-4" style={riseIndex(5)}>
        <SavedItems />
      </div>
    </div>
  );
}

export default function AccountView() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <AccountInner />
    </QueryClientProvider>
  );
}
