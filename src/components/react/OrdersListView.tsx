import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useMyOrders } from '@/lib/queries/orders';
import { useAuthStore } from '@/stores/auth-store';
import OrderStatusBadge from './OrderStatusBadge';

function OrdersListInner() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data, isLoading } = useMyOrders();
  const t = useTranslation();
  const format = useFormat();

  useDocumentTitle(t.orders.listTitle);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      window.location.href = '/login';
    }
  }, [hasHydrated, accessToken]);

  if (!hasHydrated || !accessToken || isLoading) {
    return <p className="text-content-muted">{t.common.loading}</p>;
  }

  if (!data || data.items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-content">{t.orders.listHeading}</h1>
        <div className="mt-8 rounded-md border border-border p-8 text-center">
          <p className="text-content-muted">{t.orders.empty}</p>
          <a href="/catalog" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            {t.common.browseCatalog}
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-content">{t.orders.listHeading}</h1>

      <ul className="mt-8 divide-y divide-border rounded-md border border-border">
      {data.items.map((order) => (
        <li key={order.id}>
          <a href={`/orders/${order.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-surface-hover">
            <div>
              <p className="text-sm font-medium text-content">{t.orders.number(order.id.slice(0, 8))}</p>
              <p className="text-xs text-content-muted">{format.date(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-content">
                {format.money(order.subtotalCents, order.currency)}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
          </a>
        </li>
        ))}
      </ul>
    </>
  );
}

export default function OrdersListView() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <OrdersListInner />
    </QueryClientProvider>
  );
}
