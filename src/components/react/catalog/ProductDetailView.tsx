import { QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, Ban, Check, CloudOff, Heart, Paintbrush, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { useCategories, useProduct } from '@/lib/queries/products';
import { ApiError } from '@/lib/api-client';
import { useProductViewTracking } from '@/hooks/useProductViewTracking';
import { useDocumentTitle, useTranslation, type Dictionary } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { ProductVariant } from '@/lib/types';
import { useCartStore } from '@/stores/cart-store';
import { useFavoritesStore, useIsFavorite } from '@/stores/favorites-store';
import ConfirmDialog from '../ui/ConfirmDialog';
import QuantityStepper from '../ui/QuantityStepper';
import CommentsSection from './CommentsSection';
import RelatedProducts from './RelatedProducts';
import VariantPicker from './VariantPicker';
import { firstAvailableVariant, imagesForVariant } from '@/lib/variants';

interface Props {
  slug: string;
}

// At or below this many units, the stock line switches from "In stock" to
// "Only N left".
const LOW_STOCK_THRESHOLD = 5;

interface StockStatusProps {
  // Null when the chosen size and color don't exist as a pairing.
  variant: ProductVariant | null;
  t: Dictionary;
}

// Each state pairs its color with a different icon and wording, so the line
// still reads correctly without color.
function StockStatus({ variant, t }: StockStatusProps) {
  if (!variant) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-content-muted">
        <Ban size={15} />
        {t.catalog.unavailableCombination}
      </p>
    );
  }
  if (variant.stock === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
        <Ban size={15} />
        {t.cart.outOfStock}
      </p>
    );
  }
  if (variant.stock <= LOW_STOCK_THRESHOLD) {
    return <p className="text-sm font-medium text-warning">{t.catalog.lowStock(variant.stock)}</p>;
  }
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-success">
      <Check size={15} />
      {t.catalog.inStock}
    </p>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-5 w-36 rounded bg-surface-muted" />
      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="aspect-[4/5] rounded-2xl bg-surface-muted lg:col-span-7" />
        <div className="space-y-5 lg:col-span-5">
          <div className="h-10 w-4/5 rounded bg-surface-muted" />
          <div className="h-7 w-1/4 rounded bg-surface-muted" />
          <div className="h-20 rounded bg-surface-muted" />
          <div className="h-11 w-2/3 rounded bg-surface-muted" />
          <div className="h-12 rounded-md bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

function ProductDetailInner({ slug }: Props) {
  const { data: product, isLoading, isError, error } = useProduct(slug);
  const { data: categories } = useCategories();
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useIsFavorite(product?.id ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const t = useTranslation();
  const format = useFormat();

  // Falls back to the plain brand name until the product resolves.
  useDocumentTitle(product ? `${product.name} | DinaStore` : t.catalog.productTitle);

  // Feeds the admin's product-view history. Starts once the product has
  // loaded (there is nothing to attribute the time to before that) and
  // restarts as a new visit if the product changes.
  useProductViewTracking(product?.id, isFavorite);

  useEffect(() => {
    setSelectedVariantId(product ? (firstAvailableVariant(product.variants)?.id ?? null) : null);
    setQuantity(1);
  }, [product]);

  // Jump back to the cover image of whatever gallery the newly-selected
  // variant resolves to, rather than keeping an index that may now point at
  // an unrelated photo (or be out of range) for the new filtered set.
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id, selectedVariantId]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    const message =
      error instanceof ApiError && error.statusCode === 404
        ? t.catalog.notFound
        : error instanceof ApiError
          ? error.message
          : t.catalog.serviceError;
    return (
      <div className="flex flex-col items-center rounded-lg bg-surface-muted px-6 py-20 text-center">
        <CloudOff className="size-8 text-content-muted" />
        <p className="mt-4 text-content">{message}</p>
        <a
          href="/catalog"
          className="mt-6 flex h-11 items-center rounded-md bg-brand px-6 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98]"
        >
          {t.catalog.backToCatalog}
        </a>
      </div>
    );
  }

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const isInCart = Boolean(
    selectedVariant && items.some((item) => item.lineId === selectedVariant.id),
  );
  const canBuy = Boolean(selectedVariant && selectedVariant.stock > 0);
  const galleryImages = imagesForVariant(product, selectedVariantId);
  const activeImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null;
  // The same rule the cart applies when the item is added (see cart-store), so
  // the price shown is the price charged.
  const priceCents = selectedVariant?.priceCents ?? product.basePriceCents;
  const productCategories = (categories ?? []).filter((category) => product.categoryIds.includes(category.id));

  return (
    <>
      <a
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content"
      >
        <ArrowLeft size={16} />
        {t.catalog.backToCatalog}
      </a>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Thumbnails follow the main image in the DOM (so that is the reading
            and tab order) and are moved to its left on wide screens. */}
        <div className="flex flex-col gap-3 lg:col-span-7 lg:flex-row lg:gap-4">
          <div className="aspect-[4/5] flex-1 overflow-hidden rounded-2xl bg-surface-muted lg:order-2">
            {activeImage ? (
              <img
                // Keyed so switching image replays the fade instead of
                // swapping the pixels in place.
                key={activeImage.id}
                src={activeImage.url}
                alt={activeImage.altText ?? product.name}
                className="animate-rise h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-content-muted">{t.common.noImage}</div>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto lg:order-1 lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-visible">
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={t.catalog.showImage(index + 1)}
                  aria-current={index === selectedImageIndex}
                  className={`aspect-[4/5] w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition lg:w-full ${
                    index === selectedImageIndex ? 'border-content' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sticky on wide screens: the gallery is taller than the buying
            controls, and this keeps them in reach while it scrolls. */}
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          {productCategories.length > 0 && (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-content-muted">
              {productCategories.map((category) => (
                <a
                  key={category.id}
                  href={`/catalog?categories=${category.id}`}
                  className="transition-colors hover:text-content"
                >
                  {category.name}
                </a>
              ))}
            </p>
          )}

          <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-2xl font-medium tabular-nums text-content">
            {format.money(priceCents, product.currency)}
          </p>

          {product.description && (
            <p className="mt-5 max-w-[60ch] leading-relaxed text-content-muted">{product.description}</p>
          )}

          {product.variants.length === 0 ? (
            <p className="mt-8 text-sm text-content-muted">{t.catalog.noOptions}</p>
          ) : (
            <>
              <div className="mt-8">
                <VariantPicker variants={product.variants} value={selectedVariantId} onChange={setSelectedVariantId} />
              </div>
              <div className="mt-5">
                <StockStatus variant={selectedVariant} t={t} />
              </div>
            </>
          )}

          <div className="mt-8 flex items-center gap-3">
            {canBuy && !isInCart && selectedVariant && (
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={selectedVariant.stock} size="lg" />
            )}

            {isInCart ? (
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(true)}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-danger px-5 text-sm font-semibold text-danger transition hover:bg-danger-soft active:scale-[0.98]"
              >
                <Trash2 size={16} />
                {t.cart.removeFromCart}
              </button>
            ) : (
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => selectedVariant && addItem(product, selectedVariant, quantity)}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={16} />
                {selectedVariant && selectedVariant.stock === 0 ? t.cart.outOfStock : t.cart.addToCart}
              </button>
            )}

            <button
              type="button"
              aria-label={isFavorite ? t.favorites.remove : t.favorites.save}
              aria-pressed={isFavorite}
              onClick={() => toggleFavorite(product)}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-content-muted transition hover:border-content hover:text-danger active:scale-95"
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-danger' : ''} />
            </button>
          </div>

          {product.totalStock > 0 && (
            <a
              href={`/customize?product=${encodeURIComponent(product.slug)}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-content-muted transition-colors hover:text-content"
            >
              <Paintbrush aria-hidden="true" size={16} />
              {t.catalog.customizeThis}
            </a>
          )}

          <ConfirmDialog
            open={confirmRemoveOpen}
            title={t.cart.removeFromCart}
            message={
              selectedVariant
                ? t.cart.confirmRemoveVariant(product.name, selectedVariant.size, selectedVariant.color)
                : t.cart.confirmRemove(product.name)
            }
            confirmLabel={t.common.remove}
            danger
            onCancel={() => setConfirmRemoveOpen(false)}
            onConfirm={() => {
              if (selectedVariant) {
                removeItem(selectedVariant.id);
              }
              setConfirmRemoveOpen(false);
            }}
          />
        </div>
      </div>

      {/* Capped so comment lines stay a readable length on a wide page. */}
      <div className="max-w-3xl">
        <CommentsSection productId={product.id} />
      </div>

      <RelatedProducts product={product} />
    </>
  );
}

export default function ProductDetailView({ slug }: Props) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ProductDetailInner slug={slug} />
    </QueryClientProvider>
  );
}
