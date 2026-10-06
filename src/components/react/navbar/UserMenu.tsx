import { ChevronDown, LayoutDashboard, LogOut, Package, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import { toastOnNextLoad } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import Avatar from '../Avatar';
import { isStaff } from '@/lib/permissions';

export default function UserMenu() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const t = useTranslation();

  if (!hasHydrated) {
    return <div className="h-9 w-24" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="rounded-md px-3 py-1.5 text-sm text-content-muted hover:bg-surface-hover hover:text-content"
        >
          {t.nav.logIn}
        </a>
        <a
          href="/register"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-content hover:bg-brand-hover"
        >
          {t.nav.signUp}
        </a>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 rounded-md py-1.5 pr-2 pl-1.5 text-sm text-content hover:bg-surface-hover"
      >
        <Avatar name={user.name} avatarUrl={user.avatarUrl} />
        {user.name.split(' ')[0]}
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg">
          <a
            href="/account"
            className="flex items-center gap-2 px-3 py-2 text-sm text-content hover:bg-surface-hover"
            onClick={() => setOpen(false)}
          >
            <UserIcon size={16} />
            {t.nav.account}
          </a>
          <a
            href="/orders"
            className="flex items-center gap-2 px-3 py-2 text-sm text-content hover:bg-surface-hover"
            onClick={() => setOpen(false)}
          >
            <Package size={16} />
            {t.nav.orders}
          </a>
          {isStaff(user) && (
            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-content hover:bg-surface-hover"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={16} />
              {t.nav.adminPanel}
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              clearSession();
              toastOnNextLoad('success', t.nav.loggedOut);
              window.location.href = '/';
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-content hover:bg-surface-hover"
          >
            <LogOut size={16} />
            {t.nav.logOut}
          </button>
        </div>
      )}
    </div>
  );
}
