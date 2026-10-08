import { Boxes, Eye, LayoutDashboard, Shirt, Tags, Users, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import type { Permission } from '@/lib/types';
import { useTranslation } from '@/i18n';
import { can } from '@/lib/permissions';

interface NavItem {
  href: string;
  // Key into the admin.nav dictionary section rather than a literal label.
  labelKey: 'dashboard' | 'users' | 'products' | 'categories' | 'customPrints' | 'analytics';
  icon: LucideIcon;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'users', icon: Users, permission: 'users:view' },
  { href: '/admin/products', labelKey: 'products', icon: Boxes, permission: 'products:view' },
  { href: '/admin/categories', labelKey: 'categories', icon: Tags, permission: 'categories:view' },
  { href: '/admin/custom-prints', labelKey: 'customPrints', icon: Shirt, permission: 'orders:view' },
  { href: '/admin/analytics', labelKey: 'analytics', icon: Eye, permission: 'analytics:view' },
];

interface Props {
  currentPath: string;
}

function isActive(currentPath: string, href: string): boolean {
  return href === '/admin' ? currentPath === '/admin' : currentPath.startsWith(href);
}

// Only lists sections the signed-in user actually has access to -- ADMIN
// sees everything, STAFF only the modules covered by their granted
// permissions. Hides gated items until auth-store hydrates rather than
// flashing them and immediately hiding them again.
export default function AdminNav({ currentPath }: Props) {
  const user = useAuthStore((state) => state.user);
  const t = useTranslation();

  const items = NAV_ITEMS.filter((item) => {
    if (!item.permission) {
      return true;
    }
    if (!user) {
      return false;
    }
    return can(user, item.permission);
  });

  return (
    // A row of tabs that scrolls sideways on a phone, a sticky column from
    // `md` up. top-24 is the 4rem navbar plus breathing room: the old top-10
    // sat underneath it now that the navbar is sticky.
    <nav className="scrollbar-none flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col md:overflow-visible">
      {items.map((item) => {
        const active = isActive(currentPath, item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-content text-content-inverse'
                : 'text-content-muted hover:bg-surface-hover hover:text-content'
            }`}
          >
            <item.icon aria-hidden="true" size={18} strokeWidth={1.75} />
            {t.admin.nav[item.labelKey]}
          </a>
        );
      })}
    </nav>
  );
}
