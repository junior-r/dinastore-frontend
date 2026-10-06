import { ArrowRight, Package } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { Order } from '@/lib/types';
import OrderStatusBadge from '../OrderStatusBadge';

interface Props {
  // The newest few orders, newest first (the API's own order). Undefined
  // while loading.
  orders: Order[] | undefined;
  // Whether the account has more orders than are shown here.
  hasMore: boolean;
}

export default function RecentOrders({ orders, hasMore }: Props) {
  const t = useTranslation();
  const format = useFormat();

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
          {t.account.recentOrders}
        </h2>
        {hasMore && (
          <a
            href="/orders"
            className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-content transition-colors hover:text-brand"
          >
            {t.home.viewAll}
            <ArrowRight size={16} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
          </a>
        )}
      </div>

      {!orders && (
        <div className="mt-4 animate-pulse space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[4.5rem] rounded-lg bg-surface-muted" />
          ))}
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-4 flex flex-col items-center rounded-lg bg-surface-muted px-6 py-10 text-center">
          <Package aria-hidden="true" className="size-7 text-content-muted" strokeWidth={1.5} />
          <p className="mt-3 text-content-muted">{t.orders.empty}</p>
          <a
            href="/catalog"
            className="mt-5 flex h-11 items-center rounded-md bg-brand px-6 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98]"
          >
            {t.common.browseCatalog}
          </a>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-4 space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <a
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-5 py-4 transition hover:border-content"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-content">{t.orders.number(order.id.slice(0, 8))}</p>
                  <p className="mt-0.5 text-sm text-content-muted">{format.date(order.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-medium tabular-nums text-content">
                    {format.money(order.subtotalCents, order.currency)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
