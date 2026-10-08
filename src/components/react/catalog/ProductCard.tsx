import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { usePrefetchProduct } from '@/lib/queries/products';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useIsFavorite, useFavoritesStore } from '@/stores/favorites-store';
import AddToCartModal from './AddToCartModal';

interface Props {
  product: Product;
  // Set for cards that are on screen at first paint (the top row of a grid),
  // so their image isn't deferred behind `loading="lazy"`.
  eager?: boolean;
}

export default function ProductCard({ product, eager = false }: Props) {
  const prefetchProduct = usePrefetchProduct();
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useIsFavorite(product.id);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const coverImage = product.images[0];
  const t = useTranslation();
  const format = useFormat();

  const soldOut = product.variants.length > 0 && product.totalStock === 0;
  const colorCount = new Set(product.variants.map((variant) => variant.color)).size;

  return (
    <>
      <a
        href={`/catalog/${product.slug}`}
        onMouseEnter={() => prefetchProduct(product.slug)}
        onFocus={() => prefetchProduct(product.slug)}
        className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {/* 4:5 rather than square: garments are taller than they are wide, and
            a portrait frame crops far less of them. */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-muted">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={coverImage.altText ?? product.name}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className={`h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105 ${
                soldOut ? 'opacity-60' : ''
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-content-muted">{t.common.noImage}</div>
          )}

          <button
            type="button"
            aria-label={isFavorite ? t.favorites.remove : t.favorites.save}
            aria-pressed={isFavorite}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleFavorite(product);
            }}
            className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-content-muted shadow-sm transition hover:text-danger active:scale-95"
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-danger' : ''} />
          </button>
        </div>

        <div className="flex items-start justify-between gap-3 pt-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-content">{product.name}</h3>
            {/* Each part is nowrap and the row wraps between them, so a narrow
                card drops "3 colors" to its own line instead of splitting it. */}
            <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-content-muted">
              <span className="whitespace-nowrap">{format.money(product.basePriceCents, product.currency)}</span>
              {soldOut ? (
                <span className="whitespace-nowrap font-medium text-danger">{t.cart.outOfStock}</span>
              ) : (
                colorCount > 1 && <span className="whitespace-nowrap">{t.catalog.colorCount(colorCount)}</span>
              )}
            </p>
          </div>

          <button
            type="button"
            aria-label={t.cart.addToCart}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setCartModalOpen(true);
            }}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-content transition hover:border-brand hover:bg-brand hover:text-brand-content active:scale-95"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </a>

      {/* Mounted only while open. Rendered unconditionally, every card on the
          page kept its own closed modal alive, each one subscribed to the
          whole cart, so adding one item re-rendered a hidden modal per card.
          Mounting on open also gives it fresh state each time for free. */}
      {cartModalOpen && <AddToCartModal product={product} open onClose={() => setCartModalOpen(false)} />}
    </>
  );
}
