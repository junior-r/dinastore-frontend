import { Heart } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { useFavoritesStore } from '@/stores/favorites-store';

// The visitor's favorites, which until now were only reachable through the
// navbar dropdown. They are stored in this browser, not on the account (there
// is no favorites endpoint), so this reads the same local store the heart
// buttons write to, and a different device will show a different list.
export default function SavedItems() {
  const items = useFavoritesStore((state) => state.items);
  const remove = useFavoritesStore((state) => state.remove);
  const t = useTranslation();
  const format = useFormat();

  return (
    // scroll-mt clears the sticky navbar when the stats tile jumps here.
    <section id="favorites" className="scroll-mt-24">
      <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">{t.nav.favorites}</h2>

      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-lg bg-surface-muted px-6 py-10 text-center">
          <Heart aria-hidden="true" className="size-7 text-content-muted" strokeWidth={1.5} />
          <p className="mt-3 text-content-muted">{t.favorites.empty}</p>
          <a
            href="/catalog"
            className="mt-5 flex h-11 items-center rounded-md border border-border px-6 text-sm font-semibold text-content transition hover:border-content active:scale-[0.98]"
          >
            {t.common.browseCatalog}
          </a>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.productId} className="relative">
              <a href={`/catalog/${item.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-muted">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-content-muted">
                      {t.common.noImage}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-content">{item.name}</p>
                <p className="mt-1 text-sm text-content-muted">{format.money(item.priceCents, item.currency)}</p>
              </a>
              {/* A sibling of the link, not a child: a button inside an <a>
                  is invalid markup and makes one of the two unreachable for
                  some assistive tech. It is positioned over the image. */}
              <button
                type="button"
                onClick={() => remove(item.productId)}
                aria-label={t.favorites.removeItemLabel(item.name)}
                className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-danger shadow-sm transition hover:bg-surface active:scale-95"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
