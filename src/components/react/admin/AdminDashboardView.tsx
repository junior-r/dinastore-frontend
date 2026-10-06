import { QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, Boxes, Tags, Users, type LucideIcon } from 'lucide-react';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { riseIndex } from '@/lib/motion';
import { getQueryClient } from '@/lib/query-client';
import { useAdminProducts, useAdminUsers } from '@/lib/queries/admin';
import { useCategories } from '@/lib/queries/products';
import type { Permission, ProductStatus } from '@/lib/types';
import Avatar from '../Avatar';
import { PILL_CLASS, PRODUCT_STATUSES, PRODUCT_STATUS_STYLES, ROLE_STYLES } from './status-styles';
import { can } from '@/lib/permissions';

const NEWEST_USER_COUNT = 5;

// Fill and ink per tile, by position, so whichever sections a person can see
// the first one leads and no two neighbors match.
const TILE_TONES = ['bg-brand text-brand-content', 'bg-content text-content-inverse', 'bg-surface-muted text-content'];

interface TileProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  // Undefined while its request is in flight.
  value: number | undefined;
  index: number;
}

function StatTile({ href, icon: Icon, label, description, value, index }: TileProps) {
  return (
    <a
      href={href}
      style={riseIndex(index)}
      className={`animate-rise group flex flex-col justify-between gap-8 rounded-2xl p-6 ${TILE_TONES[index % TILE_TONES.length]}`}
    >
      <div className="flex items-start justify-between">
        <Icon aria-hidden="true" size={26} strokeWidth={1.5} />
        <ArrowRight
          aria-hidden="true"
          size={18}
          className="opacity-60 transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
        />
      </div>
      <div>
        {/* The hyphen holds the number's height while it loads. */}
        <p className="text-5xl font-extrabold tracking-tight tabular-nums font-stretch-expanded">{value ?? '-'}</p>
        <p className="mt-2 font-semibold">{label}</p>
        <p className="mt-1 text-sm opacity-75">{description}</p>
      </div>
    </a>
  );
}

// Each tile below is its own component, and each is only rendered for someone
// allowed to see that section. That is what keeps a STAFF account without
// `users:view` from firing a users request it would get a 403 for: a hook
// can't be called conditionally, but a component can be left out.

function UsersTile({ index }: { index: number }) {
  const t = useTranslation();
  // Same params as NewestUsers below, so the two share one request.
  const { data } = useAdminUsers({ pageSize: NEWEST_USER_COUNT });
  return (
    <StatTile
      href="/admin/users"
      icon={Users}
      label={t.admin.nav.users}
      description={t.admin.dashboard.usersDescription}
      value={data?.total}
      index={index}
    />
  );
}

function ProductsTile({ index }: { index: number }) {
  const t = useTranslation();
  // Only the total is needed, so ask for a single row.
  const { data } = useAdminProducts({ pageSize: 1 });
  return (
    <StatTile
      href="/admin/products"
      icon={Boxes}
      label={t.admin.nav.products}
      description={t.admin.dashboard.productsDescription}
      value={data?.total}
      index={index}
    />
  );
}

function CategoriesTile({ index }: { index: number }) {
  const t = useTranslation();
  const { data } = useCategories();
  return (
    <StatTile
      href="/admin/categories"
      icon={Tags}
      label={t.admin.nav.categories}
      description={t.admin.dashboard.categoriesDescription}
      value={data?.length}
      index={index}
    />
  );
}

function NewestUsers() {
  const t = useTranslation();
  const format = useFormat();
  // The users endpoint returns newest first, which is what makes this list
  // "newest" without any sorting here.
  const { data } = useAdminUsers({ pageSize: NEWEST_USER_COUNT });

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
          {t.admin.dashboard.newestUsers}
        </h2>
        <a
          href="/admin/users"
          className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-content transition-colors hover:text-brand"
        >
          {t.home.viewAll}
          <ArrowRight size={16} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
        </a>
      </div>

      {!data ? (
        <div className="mt-4 animate-pulse space-y-2" aria-hidden="true">
          {Array.from({ length: NEWEST_USER_COUNT }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-surface-muted" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {data.items.map((user) => (
            <li key={user.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-content">{user.name}</p>
                <p className="truncate text-sm text-content-muted">{user.email}</p>
              </div>
              <span className={`${PILL_CLASS} hidden sm:inline ${ROLE_STYLES[user.role]}`}>{user.role}</span>
              <span className="shrink-0 text-sm tabular-nums text-content-muted">{format.date(user.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusCount({ status }: { status: ProductStatus }) {
  const t = useTranslation();
  const { data } = useAdminProducts({ status, pageSize: 1 });

  return (
    <li className="flex items-center justify-between px-4 py-3.5">
      <span className={`${PILL_CLASS} ${PRODUCT_STATUS_STYLES[status]}`}>{t.admin.products.statusLabels[status]}</span>
      <span className="text-lg font-semibold tabular-nums text-content">{data?.total ?? '-'}</span>
    </li>
  );
}

function ProductsByStatus() {
  const t = useTranslation();

  return (
    <section>
      <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
        {t.admin.dashboard.productsByStatus}
      </h2>
      <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
        {PRODUCT_STATUSES.map((status) => (
          <StatusCount key={status} status={status} />
        ))}
      </ul>
    </section>
  );
}

function AdminDashboardInner({ name, role, can }: { name: string; role: string; can: (p: Permission) => boolean }) {
  const t = useTranslation();

  const tiles = [
    { key: 'users', Tile: UsersTile, visible: can('users:view') },
    { key: 'products', Tile: ProductsTile, visible: can('products:view') },
    { key: 'categories', Tile: CategoriesTile, visible: can('categories:view') },
  ].filter((tile) => tile.visible);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-content font-stretch-expanded">
        {t.admin.dashboard.heading}
      </h1>
      <p className="mt-2 text-content-muted">{t.admin.dashboard.signedInAs(name, role)}</p>

      {tiles.length === 0 ? (
        <p className="mt-8 rounded-lg bg-surface-muted px-6 py-10 text-center text-content-muted">
          {t.admin.dashboard.noAccess}
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map(({ key, Tile }, index) => (
              <Tile key={key} index={index} />
            ))}
          </div>

          <div className="mt-10 grid gap-x-6 gap-y-10 lg:grid-cols-5">
            {can('users:view') && (
              <div className="lg:col-span-3">
                <NewestUsers />
              </div>
            )}
            {can('products:view') && (
              <div className="lg:col-span-2">
                <ProductsByStatus />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardView() {
  const { authorized, user } = useRequireAdminAccess();
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized || !user) {
    return (
      <div className="animate-pulse" aria-hidden="true">
        <div className="h-9 w-64 rounded bg-surface-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-52 rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminDashboardInner
        name={user.name}
        role={user.role}
        can={(permission) => can(user, permission)}
      />
    </QueryClientProvider>
  );
}
