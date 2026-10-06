import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/i18n';
import { pushOverlay } from '@/hooks/overlay-stack';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { ProductVariantInput } from '@/lib/api/admin';

interface MatcherImage {
  id: string;
  previewUrl: string;
  // Indexes into `variants`. Empty means "every variant".
  variantIndexes: number[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  images: MatcherImage[];
  variants: ProductVariantInput[];
  // Replaces the full list of variants an image is limited to. An empty list
  // means "every variant", which is how the form and the API already store it.
  onChange: (imageId: string, variantIndexes: number[]) => void;
}

type Mode = 'image' | 'variant';

interface ColorGroup {
  color: string;
  // Positions in `variants` of every size that comes in this color.
  indexes: number[];
}

const CHIP_CLASS =
  'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition';
const CHIP_ON = 'border-content bg-content text-content-inverse';
const CHIP_OFF = 'border-border text-content hover:border-content';

function isShownFor(image: MatcherImage, variantIndex: number): boolean {
  return image.variantIndexes.length === 0 || image.variantIndexes.includes(variantIndex);
}

function groupByColor(variants: ProductVariantInput[]): ColorGroup[] {
  const groups = new Map<string, number[]>();
  variants.forEach((variant, index) => {
    groups.set(variant.color, [...(groups.get(variant.color) ?? []), index]);
  });
  return Array.from(groups, ([color, indexes]) => ({ color, indexes }));
}

// Decides which product photos appear for which variant.
//
// The whole dialog is one grid of yes/no answers to "does a shopper who picks
// this variant see this image?", reachable from either side: pick an image
// and tick its variants, or pick a variant and tick its images. Both modes
// edit the same data, so switching between them is always safe.
//
// It replaced a click-two-nodes-to-draw-a-line diagram. That showed the links
// but not what they meant, and gave no way to ask "what will someone buying
// the black one in M actually see?".
export default function ImageVariantMatcher({ open, onClose, images, variants, onChange }: Props) {
  const t = useTranslation();
  const panelRef = useClickOutside<HTMLDivElement>(onClose);
  const [mode, setMode] = useState<Mode>('image');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Start from the same place each time the dialog opens. Kept apart from the
  // effect below on purpose: that one depends on `onClose`, which the form
  // passes as a fresh function on every render, so it re-runs after every
  // tick. With the reset in there, ticking an image in "By variant" mode
  // bounced the dialog back to "By image".
  useEffect(() => {
    if (open) {
      setMode('image');
      setSelectedVariantIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const popOverlay = pushOverlay(onClose);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      popOverlay();
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const total = variants.length;
  const groups = groupByColor(variants);
  // Falls back to the first image, so there is always something selected even
  // right after opening, or if the selected image was deleted from the form.
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0] ?? null;
  const selectedVariant = variants[selectedVariantIndex] ?? variants[0] ?? null;
  const activeVariantIndex = variants[selectedVariantIndex] ? selectedVariantIndex : 0;

  // Sets whether `image` shows for each of `indexes`. Every change in the
  // dialog goes through here, which is what keeps the two rules in one place:
  //  - covering every variant is stored as an empty list, the existing
  //    meaning of "applies to all", so a variant added later is included too;
  //  - an image can't end up showing for none. An empty list already means
  //    "all", so "none" has no representation and would silently flip to
  //    showing everywhere. The change is refused instead (see minOneVariant).
  function setShown(image: MatcherImage, indexes: number[], shown: boolean) {
    const next = new Set(image.variantIndexes.length === 0 ? variants.map((_, index) => index) : image.variantIndexes);
    for (const index of indexes) {
      if (shown) {
        next.add(index);
      } else {
        next.delete(index);
      }
    }
    if (next.size === 0) {
      return;
    }
    onChange(image.id, next.size === total ? [] : Array.from(next).sort((a, b) => a - b));
  }

  function shownCount(image: MatcherImage): number {
    return image.variantIndexes.length === 0 ? total : image.variantIndexes.length;
  }

  // "All" is judged by what the shopper gets, not by how the list is stored.
  // Products saved before this dialog can hold every index spelled out
  // instead of an empty list; both show for every variant, so both read as
  // "all" here rather than as "2 of 2".
  function coversAll(image: MatcherImage): boolean {
    return shownCount(image) === total;
  }

  function coverage(image: MatcherImage): string {
    return coversAll(image)
      ? t.admin.products.appliesToAll
      : t.admin.products.shownForCount(image.variantIndexes.length, total);
  }

  const imagesForVariant = images.filter((image) => isShownFor(image, activeVariantIndex));

  return createPortal(
    <div data-overlay-root className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.admin.products.relateHeading}
        className="animate-rise flex max-h-[90dvh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
              {t.admin.products.relateHeading}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-content-muted">{t.admin.products.relateHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover hover:text-content"
          >
            <X size={18} />
          </button>
        </div>

        {images.length === 0 || total === 0 ? (
          <p className="px-6 py-14 text-center text-content-muted">
            {images.length === 0 ? t.admin.products.relateEmptyImages : t.admin.products.relateEmptyVariants}
          </p>
        ) : (
          <>
            <div className="px-6 pt-5">
              {/* The two ways into the same data. */}
              <div className="inline-flex rounded-full border border-border p-1">
                {(['image', 'variant'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition ${
                      mode === value ? 'bg-content text-content-inverse' : 'text-content-muted hover:text-content'
                    }`}
                  >
                    {value === 'image' ? t.admin.products.modeByImage : t.admin.products.modeByVariant}
                  </button>
                ))}
              </div>
            </div>

            {/* Two panes side by side from `md`; stacked, and scrolling as one
                column, on a phone. */}
            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 py-5 md:grid-cols-2">
              {mode === 'image' && selectedImage && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-content">{t.admin.products.images}</h3>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {images.map((image, position) => {
                        const selected = image.id === selectedImage.id;
                        return (
                          <button
                            key={image.id}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${t.admin.products.imageNumber(position + 1)}. ${coverage(image)}`}
                            onClick={() => setSelectedImageId(image.id)}
                            className="group cursor-pointer text-left"
                          >
                            <span
                              className={`block aspect-[4/5] overflow-hidden rounded-lg border-2 transition ${
                                selected ? 'border-content' : 'border-transparent opacity-70 group-hover:opacity-100'
                              }`}
                            >
                              <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                            </span>
                            <span className="mt-1.5 block text-xs tabular-nums text-content-muted">
                              {coversAll(image)
                                ? t.admin.products.allVariants
                                : `${image.variantIndexes.length} / ${total}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Announced as it changes, so ticking a variant reports
                          the new total to a screen reader too. */}
                      <p aria-live="polite" className="text-sm font-semibold text-content">
                        {coverage(selectedImage)}
                      </p>
                      <button
                        type="button"
                        disabled={coversAll(selectedImage)}
                        onClick={() => onChange(selectedImage.id, [])}
                        className="h-9 cursor-pointer rounded-md border border-border px-3 text-sm font-medium text-content transition hover:border-content disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t.admin.products.showForAll}
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {groups.map((group) => {
                        const onCount = group.indexes.filter((index) => isShownFor(selectedImage, index)).length;
                        const allOn = onCount === group.indexes.length;
                        return (
                          <div key={group.color} className="rounded-lg border border-border p-4">
                            {/* The color's own switch: the usual job is "this
                                photo is the black one", which is every size of
                                a color at once. */}
                            <button
                              type="button"
                              aria-pressed={allOn}
                              aria-label={t.admin.products.toggleColor(group.color)}
                              onClick={() => setShown(selectedImage, group.indexes, !allOn)}
                              className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-content"
                            >
                              <span
                                className={`flex size-5 items-center justify-center rounded border transition ${
                                  allOn
                                    ? 'border-content bg-content text-content-inverse'
                                    : onCount > 0
                                      ? 'border-content text-content'
                                      : 'border-border text-transparent'
                                }`}
                              >
                                {/* A tick for all, a bar for some, empty for
                                    none: the state reads without color. */}
                                {allOn ? <Check size={14} strokeWidth={3} /> : <span className="h-0.5 w-2.5 bg-current" />}
                              </span>
                              {group.color}
                            </button>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {group.indexes.map((index) => {
                                const on = isShownFor(selectedImage, index);
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`${variants[index].size} / ${group.color}`}
                                    onClick={() => setShown(selectedImage, [index], !on)}
                                    className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF} active:scale-[0.97]`}
                                  >
                                    {variants[index].size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shown exactly when the rule can bite: one variant left,
                        and clicking it would do nothing without this. */}
                    {shownCount(selectedImage) === 1 && (
                      <p className="mt-4 text-sm text-content-muted">{t.admin.products.minOneVariant}</p>
                    )}
                  </div>
                </>
              )}

              {mode === 'variant' && selectedVariant && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-content">{t.admin.products.variants}</h3>
                    <div className="mt-3 space-y-4">
                      {groups.map((group) => (
                        <div key={group.color}>
                          <p className="text-sm text-content-muted">{group.color}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.indexes.map((index) => (
                              <button
                                key={index}
                                type="button"
                                aria-pressed={index === activeVariantIndex}
                                aria-label={`${variants[index].size} / ${group.color}`}
                                onClick={() => setSelectedVariantIndex(index)}
                                className={`${CHIP_CLASS} ${index === activeVariantIndex ? CHIP_ON : CHIP_OFF}`}
                              >
                                {variants[index].size}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-content">
                      {t.admin.products.shopperSees(selectedVariant.size, selectedVariant.color)}
                    </p>
                    <p aria-live="polite" className="mt-1 text-sm text-content-muted">
                      {imagesForVariant.length === 0
                        ? t.admin.products.noImagesForVariant
                        : t.admin.products.imagesShown(imagesForVariant.length)}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {images.map((image, position) => {
                        const on = isShownFor(image, activeVariantIndex);
                        // The last variant an image shows for can't be
                        // unticked (see setShown), so say so up front rather
                        // than have the click do nothing.
                        const locked = on && shownCount(image) === 1;
                        return (
                          <button
                            key={image.id}
                            type="button"
                            aria-pressed={on}
                            aria-label={t.admin.products.imageNumber(position + 1)}
                            title={locked ? t.admin.products.minOneVariant : undefined}
                            onClick={() => setShown(image, [activeVariantIndex], !on)}
                            className={`relative aspect-[4/5] overflow-hidden rounded-lg border-2 transition active:scale-[0.98] ${
                              locked ? 'cursor-not-allowed' : 'cursor-pointer'
                            } ${on ? 'border-content' : 'border-transparent opacity-45 hover:opacity-80'}`}
                          >
                            <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                            <span
                              className={`absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border transition ${
                                on
                                  ? 'border-content bg-content text-content-inverse'
                                  : 'border-border bg-surface/80 text-transparent'
                              }`}
                            >
                              <Check size={14} strokeWidth={3} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
