import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useOrder, usePayOrder } from '@/lib/queries/orders';
import { useAuthStore } from '@/stores/auth-store';
import DesignMockup from './customize/DesignMockup';
import OrderStatusBadge from './OrderStatusBadge';

interface Props {
  orderId: string;
}

function OrderDetailInner({ orderId }: Props) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: order, isLoading, isError, error } = useOrder(orderId);
  const payOrder = usePayOrder();
  const t = useTranslation();
  const format = useFormat();

  useDocumentTitle(t.orders.detailTitle);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      window.location.href = '/login';
    }
  }, [hasHydrated, accessToken]);

  if (!hasHydrated || !accessToken || isLoading) {
    return <p className="text-content-muted">{t.common.loading}</p>;
  }

  if (isError || !order) {
    const message =
      error instanceof ApiError && error.statusCode === 404
        ? t.orders.notFound
        : t.orders.serviceError;
    return <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{message}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-content">{t.orders.number(order.id.slice(0, 8))}</h1>
          <p className="mt-1 text-sm text-content-muted">{format.dateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} size="md" />
      </div>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            {item.customization && (
              <DesignMockup
                garmentImageUrl={item.customization.garmentImageUrl}
                designUrl={item.customization.thumbnailUrl}
                placement={item.customization.placement}
                alt={item.productName}
                className="w-24 shrink-0 rounded-md"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-content">{item.productName}</p>
              <p className="text-content-muted">
                {item.variantSize} / {item.variantColor} · {item.quantity} × {format.money(item.unitPriceCents, order.currency)}
              </p>
              {item.customization && <p className="mt-0.5 text-xs font-medium text-brand">{t.cart.customDesign}</p>}
            </div>
            <p className="font-medium text-content">
              {format.money(item.unitPriceCents * item.quantity, order.currency)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-content-muted">{t.common.subtotal}</span>
        <span className="font-medium text-content">{format.money(order.subtotalCents, order.currency)}</span>
      </div>

      {order.status === 'PENDING' && (
        <div className="mt-6">
          {payOrder.isError && (
            <p className="mb-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {payOrder.error instanceof ApiError ? payOrder.error.message : t.orders.paymentError}
            </p>
          )}
          <p className="mb-3 text-xs text-content-muted">
            {t.orders.paymentStub}
          </p>
          <button
            type="button"
            disabled={payOrder.isPending}
            onClick={() => payOrder.mutate(order.id)}
            className="cursor-pointer rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {payOrder.isPending ? t.orders.confirming : t.orders.payNow}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailView({ orderId }: Props) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <OrderDetailInner orderId={orderId} />
    </QueryClientProvider>
  );
}
