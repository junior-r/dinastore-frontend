import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Check, Shirt } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useDesignFile, type DesignFileError } from '@/hooks/useDesignFile';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { DEFAULT_PLACEMENT } from '@/lib/design-placement';
import { useFormat } from '@/lib/format';
import { useStudioConfig } from '@/lib/queries/customizations';
import { productQueryOptions } from '@/lib/queries/products';
import { getQueryClient } from '@/lib/query-client';
import type { DesignPlacement, Product } from '@/lib/types';
import { imagesForVariant } from '@/lib/variants';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import VariantPicker from '../catalog/VariantPicker';
import QuantityStepper from '../ui/QuantityStepper';
import DesignCropDialog from './DesignCropDialog';
import DesignStage from './DesignStage';
import DesignUploader from './DesignUploader';
import GarmentPicker from './GarmentPicker';

const BYTES_PER_MB = 1024 * 1024;

// `/customize?product=<slug>` opens the studio on that garment. It is how the
// product page links here.
const PRODUCT_PARAM = 'product';

interface StepProps {
  number: number;
  title: string;
  done: boolean;
  children: ReactNode;
}

function Step({ number, title, done, children }: StepProps) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-base font-bold text-content">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors ${
            done ? 'bg-content text-content-inverse' : 'border border-border text-content-muted'
          }`}
        >
          {done ? <Check aria-hidden="true" size={14} strokeWidth={3} /> : number}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CustomizeInner() {
  const t = useTranslation();
  const format = useFormat();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const addCustomItem = useCartStore((state) => state.addCustomItem);
  const { data: config } = useStudioConfig();

  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<DesignPlacement>(DEFAULT_PLACEMENT);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  useDocumentTitle(t.customize.title);

  // Read after mount: the query string doesn't exist during server rendering.
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);
  useEffect(() => {
    setRequestedSlug(new URLSearchParams(window.location.search).get(PRODUCT_PARAM));
  }, []);
  const { data: requestedProduct } = useQuery({
    ...productQueryOptions(requestedSlug ?? ''),
    enabled: Boolean(requestedSlug),
  });
  useEffect(() => {
    // Only fills an empty studio: it must not undo a garment picked by hand
    // while the linked one was still loading.
    if (requestedProduct) setProduct((current) => current ?? requestedProduct);
  }, [requestedProduct]);

  const onDesignError = useCallback(
    (error: DesignFileError) => {
      if (!config) return;
      const messages: Record<DesignFileError, string> = {
        type: t.customize.errors.type,
        size: t.customize.errors.size(Math.floor(config.upload.maxBytes / BYTES_PER_MB)),
        tooSmall: t.customize.errors.tooSmall(config.upload.minEdgePx),
        unreadable: t.customize.errors.unreadable,
      };
      toast.error(messages[error]);
    },
    [config, t],
  );
  const { design, isUploading, choose, clear, applyCrop } = useDesignFile(config, onDesignError);

  function selectProduct(next: Product | null) {
    setProduct(next);
    setVariantId(null);
    setQuantity(1);
    setJustAdded(false);
  }

  function chooseDesign(files: FileList | null) {
    // A new design starts from the default spot rather than inheriting the
    // position tuned for artwork of a different shape.
    setPlacement(DEFAULT_PLACEMENT);
    setJustAdded(false);
    void choose(files);
  }

  const variant = product?.variants.find((candidate) => candidate.id === variantId) ?? null;
  const garmentImageUrl = product ? (imagesForVariant(product, variantId)[0]?.url ?? null) : null;
  const priceCents = product ? (variant?.priceCents ?? product.basePriceCents) : 0;
  const uploaded = design?.uploaded ?? null;
  const inStock = Boolean(variant && variant.stock > 0);
  // A crop being uploaded leaves the previous design on screen meanwhile; it
  // must not be bought in that window.
  const canAdd = Boolean(product && variant && inStock && uploaded && !isUploading);

  // The first thing still missing, in the order the steps appear.
  function blocker(): string | null {
    if (!product) return t.customize.cta.needGarment;
    if (!variant) return t.catalog.unavailableCombination;
    if (!inStock) return t.cart.outOfStock;
    if (!design) return t.customize.cta.needDesign;
    if (!uploaded || isUploading) return t.customize.cta.waitUpload;
    return null;
  }

  function addToCart() {
    if (!product || !variant || !uploaded) return;
    addCustomItem(
      product,
      variant,
      { designId: uploaded.id, thumbnailUrl: uploaded.thumbnailUrl, placement },
      quantity,
    );
    setJustAdded(true);
  }

  const hint = blocker();

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-brand">{t.customize.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-5xl">
          {t.customize.heading}
        </h1>
        <p className="mt-4 text-base text-content-muted">{t.customize.intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-24">
            <DesignStage
              garment={product ? { name: product.name, imageUrl: garmentImageUrl } : null}
              design={design}
              logo={config?.logo}
              placement={placement}
              onChange={setPlacement}
            />
            {design && <p className="mt-3 text-xs text-content-muted">{t.customize.upload.logoNote}</p>}
          </div>
        </div>

        <div className="space-y-10 lg:col-span-6">
          <Step number={1} title={t.customize.steps.garment} done={Boolean(product && variant)}>
            {product ? (
              <div>
                <div className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
                    {product.images[0] ? (
                      <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Shirt aria-hidden="true" className="size-6 text-content-muted/50" strokeWidth={1.25} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{product.name}</p>
                    <p className="text-sm text-content-muted">{format.money(priceCents, product.currency)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectProduct(null)}
                    className="shrink-0 cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-content transition hover:bg-surface-hover"
                  >
                    {t.customize.garment.change}
                  </button>
                </div>

                {product.variants.length > 0 && (
                  <div className="mt-5">
                    {/* Keyed so a different garment starts from its own
                        first available size and color. */}
                    <VariantPicker
                      key={product.id}
                      variants={product.variants}
                      value={variantId}
                      onChange={setVariantId}
                    />
                  </div>
                )}
              </div>
            ) : (
              <GarmentPicker onSelect={selectProduct} />
            )}
          </Step>

          <Step number={2} title={t.customize.steps.design} done={Boolean(uploaded)}>
            {!config || !hasHydrated ? (
              <div className="h-40 animate-pulse rounded-lg bg-surface-muted" />
            ) : accessToken ? (
              <DesignUploader
                config={config}
                design={design}
                isUploading={isUploading}
                onChoose={chooseDesign}
                onClear={clear}
                onCrop={() => setCropOpen(true)}
              />
            ) : (
              <div className="rounded-lg border border-border p-6">
                <p className="text-sm text-content-muted">{t.customize.upload.loginPrompt}</p>
                <a
                  href="/login"
                  className="mt-4 inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover"
                >
                  {t.nav.logIn}
                </a>
              </div>
            )}
          </Step>

          <Step number={3} title={t.customize.steps.place} done={justAdded}>
            <p className="text-sm text-content-muted">{t.customize.place.hint}</p>

            <div className="mt-5 flex items-center gap-3">
              {variant && inStock && (
                <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={variant.stock} size="lg" />
              )}
              <button
                type="button"
                disabled={!canAdd}
                onClick={addToCart}
                className="h-12 flex-1 cursor-pointer rounded-md bg-brand px-6 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.cart.addToCart}
                {product && ` · ${format.money(priceCents * quantity, product.currency)}`}
              </button>
            </div>

            <p aria-live="polite" className="mt-3 min-h-5 text-sm">
              {justAdded ? (
                <span className="text-content">
                  {t.customize.cta.added}{' '}
                  <a href="/checkout" className="font-semibold text-brand hover:underline">
                    {t.cart.checkout}
                  </a>
                </span>
              ) : (
                hint && <span className="text-content-muted">{hint}</span>
              )}
            </p>
          </Step>
        </div>
      </div>

      {design && config && (
        <DesignCropDialog
          open={cropOpen}
          image={design.original}
          initial={design.crop}
          minEdgePx={config.upload.minEdgePx}
          onCancel={() => setCropOpen(false)}
          onApply={(crop) => {
            setCropOpen(false);
            setJustAdded(false);
            void applyCrop(crop);
          }}
        />
      )}
    </>
  );
}

export default function CustomizeView() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <CustomizeInner />
    </QueryClientProvider>
  );
}
