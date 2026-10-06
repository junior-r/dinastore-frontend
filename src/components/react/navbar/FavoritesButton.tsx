import { Heart, X } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useFavoritesCount, useFavoritesStore } from '@/stores/favorites-store';

export default function FavoritesButton() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const items = useFavoritesStore((state) => state.items);
  const remove = useFavoritesStore((state) => state.remove);
  const count = useFavoritesCount();
  const t = useTranslation();
  const format = useFormat();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.nav.favorites}
        aria-expanded={open}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <Heart size={18} />
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
              <p className="px-4 py-6 text-center text-sm text-content-muted">{t.favorites.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                    <a href={`/catalog/${item.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-muted">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content">{item.name}</p>
                        <p className="text-xs text-content-muted">{format.money(item.priceCents, item.currency)}</p>
                      </div>
                    </a>
                    <button
                      type="button"
                      aria-label={t.favorites.removeItemLabel(item.name)}
                      onClick={() => remove(item.productId)}
                      className="shrink-0 cursor-pointer text-content-muted hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
