import { ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useCartCount, useCartStore, useCartTotalCents } from '@/stores/cart-store';
import { DEFAULT_CURRENCY } from '@/lib/constants';
import DesignMockup from '../customize/DesignMockup';

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = useCartCount();
  const totalCents = useCartTotalCents();
  const currency = items[0]?.currency ?? DEFAULT_CURRENCY;
  const t = useTranslation();
  const format = useFormat();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.nav.cart}
        aria-expanded={open}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <ShoppingCart size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-content">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-content-muted">{t.cart.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.lineId} className="flex items-center gap-3 px-4 py-3">
                    {item.customization ? (
                      <DesignMockup
                        garmentImageUrl={item.imageUrl}
                        designUrl={item.customization.thumbnailUrl}
                        placement={item.customization.placement}
                        className="h-12 w-12 shrink-0 rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-muted">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content">{item.name}</p>
                      <p className="text-xs text-content-muted">
                        {item.size} / {item.color} · {item.quantity} × {format.money(item.priceCents, item.currency)}
                      </p>
                      {item.customization && (
                        <p className="text-xs font-medium text-brand">{t.cart.customDesign}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={t.cart.removeItemLabel(item.name)}
                      onClick={() => removeItem(item.lineId)}
                      className="shrink-0 cursor-pointer text-content-muted hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-content-muted">{t.common.subtotal}</span>
                <span className="font-medium text-content">{format.money(totalCents, currency)}</span>
              </div>
              <a
                href="/checkout"
                className="mt-3 block rounded-md bg-brand px-4 py-2 text-center text-sm font-medium text-brand-content hover:bg-brand-hover"
              >
                {t.cart.checkout}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
