import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ApiError } from '@/lib/api-client';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { usePlaceOrder } from '@/lib/queries/orders';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore, useCartTotalCents } from '@/stores/cart-store';
import { DEFAULT_CURRENCY } from '@/lib/constants';
import DesignMockup from './customize/DesignMockup';

function CheckoutInner() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clear);
  const totalCents = useCartTotalCents();
  const currency = items[0]?.currency ?? DEFAULT_CURRENCY;
  const placeOrder = usePlaceOrder();
  const t = useTranslation();
  const format = useFormat();

  useDocumentTitle(t.checkout.title);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      window.location.href = '/login';
    }
  }, [hasHydrated, accessToken]);

  if (!hasHydrated || !accessToken) {
    return <p className="text-content-muted">{t.common.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-content">{t.checkout.heading}</h1>
        <div className="mt-8 rounded-md border border-border p-8 text-center">
          <p className="text-content-muted">{t.cart.empty}</p>
          <a href="/catalog" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            {t.common.browseCatalog}
          </a>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    placeOrder.mutate(
      items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        ...(item.customization && {
          customization: {
            designId: item.customization.designId,
            placement: item.customization.placement,
          },
        }),
      })),
      {
        onSuccess: (order) => {
          clearCart();
          window.location.href = `/orders/${order.id}`;
        },
      },
    );
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-content">{t.checkout.heading}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((item) => (
          <li key={item.lineId} className="flex items-center gap-4 px-4 py-4">
            {item.customization ? (
              <DesignMockup
                garmentImageUrl={item.imageUrl}
                designUrl={item.customization.thumbnailUrl}
                placement={item.customization.placement}
                className="w-20 shrink-0 rounded-md"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-muted">
                {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-content">{item.name}</p>
              <p className="text-xs text-content-muted">
                {item.size} / {item.color} · {format.money(item.priceCents, item.currency)} {t.checkout.each}
              </p>
              {item.customization && <p className="text-xs font-medium text-brand">{t.cart.customDesign}</p>}
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-content-muted" htmlFor={`qty-${item.lineId}`}>
                  {t.checkout.qty}
                </label>
                <input
                  id={`qty-${item.lineId}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    setQuantity(item.lineId, Number.parseInt(event.target.value, 10) || 1)
                  }
                  className="w-16 rounded border border-border bg-surface px-2 py-1 text-sm text-content"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="cursor-pointer text-xs text-content-muted hover:text-danger"
                >
                  {t.common.remove}
                </button>
              </div>
            </div>
            <p className="shrink-0 text-sm font-medium text-content">
              {format.money(item.priceCents * item.quantity, item.currency)}
            </p>
          </li>
        ))}
      </ul>

      <div className="h-fit rounded-md border border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-content-muted">{t.common.subtotal}</span>
          <span className="font-medium text-content">{format.money(totalCents, currency)}</span>
        </div>

        {placeOrder.isError && (
          <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {placeOrder.error instanceof ApiError ? placeOrder.error.message : t.checkout.error}
          </p>
        )}

        <button
          type="button"
          disabled={placeOrder.isPending}
          onClick={handlePlaceOrder}
          className="mt-4 w-full cursor-pointer rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {placeOrder.isPending ? t.checkout.placingOrder : t.checkout.placeOrder}
        </button>
        </div>
      </div>
    </>
  );
}

export default function CheckoutView() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <CheckoutInner />
    </QueryClientProvider>
  );
}
