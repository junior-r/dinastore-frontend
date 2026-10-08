import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n';
import type { ProductVariant } from '@/lib/types';
import { firstAvailableVariant } from '@/lib/variants';

interface Props {
  variants: ProductVariant[];
  // Kept for API compatibility with existing callers -- no longer read
  // internally. Size and color are managed as independent local state (see
  // below) and pushed out via onChange; deriving both from a single
  // incoming `value` meant clicking one axis could visibly change the
  // other whenever the previous pairing wasn't in stock.
  value: string | null;
  onChange: (variantId: string | null) => void;
}

function uniqueInOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

// Selected is ink-on-paper (bg-content), not the brand color: the brand color
// is reserved for the one primary action next to these, so the eye still has
// a single obvious place to land. Unavailable gets a dashed border as well as
// the strikethrough so it doesn't rely on the text decoration alone.
function buttonClass(selected: boolean, disabled: boolean): string {
  const base = 'flex h-11 min-w-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition';
  if (selected) {
    return `${base} cursor-pointer border-content bg-content text-content-inverse`;
  }
  if (disabled) {
    return `${base} cursor-not-allowed border-dashed border-border text-content-muted line-through`;
  }
  return `${base} cursor-pointer border-border text-content hover:border-content active:scale-[0.98]`;
}

// Size and color are independently selectable controls (rather than one
// combined "M / Red" button per variant) that together resolve to a single
// matching ProductVariant. Each axis tracks its own selection in local
// state: clicking a size only ever changes the size selection, never the
// color (and vice versa). If the resulting size+color pairing isn't a real
// variant (or isn't in stock), no variant resolves -- onChange(null) is
// called rather than silently substituting a different color/size than
// what's shown selected.
export default function VariantPicker({ variants, onChange }: Props) {
  const t = useTranslation();
  const sizes = uniqueInOrder(variants.map((variant) => variant.size));
  const colors = uniqueInOrder(variants.map((variant) => variant.color));

  const [selectedSize, setSelectedSize] = useState<string | null>(
    () => firstAvailableVariant(variants)?.size ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    () => firstAvailableVariant(variants)?.color ?? null,
  );

  // Reset when the variant list itself changes (i.e. a different product)
  // -- deliberately keyed only on `variants`/`onChange`, not on the
  // resolved selection, which would fight selectSize/selectColor below
  // every time they resolve to no match.
  useEffect(() => {
    const initial = firstAvailableVariant(variants);
    setSelectedSize(initial?.size ?? null);
    setSelectedColor(initial?.color ?? null);
    onChange(initial?.id ?? null);
  }, [variants, onChange]);

  function variantFor(size: string | null, color: string | null): ProductVariant | undefined {
    if (size === null || color === null) {
      return undefined;
    }
    return variants.find((variant) => variant.size === size && variant.color === color);
  }

  // Checked against all variants, not just ones matching the other axis's
  // current selection — otherwise stock that isn't a full size x color grid
  // (e.g. Red only in stock as S, Blue only as M/L) permanently disables
  // every option on both axes, since enabling either one depends on a
  // pairing that can never be reached while the other stays disabled.
  function sizeAvailable(size: string): boolean {
    return variants.some((variant) => variant.size === size && variant.stock > 0);
  }

  function colorAvailable(color: string): boolean {
    return variants.some((variant) => variant.color === color && variant.stock > 0);
  }

  function selectSize(size: string) {
    setSelectedSize(size);
    onChange(variantFor(size, selectedColor)?.id ?? null);
  }

  function selectColor(color: string) {
    setSelectedColor(color);
    onChange(variantFor(selectedSize, color)?.id ?? null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-content">
          {t.catalog.size}
          {selectedSize && <span className="ml-2 font-normal text-content-muted">{selectedSize}</span>}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.catalog.size}>
          {sizes.map((size) => {
            const isSelected = selectedSize === size;
            const disabled = !sizeAvailable(size);
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => selectSize(size)}
                className={buttonClass(isSelected, disabled)}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-content">
          {t.catalog.color}
          {selectedColor && <span className="ml-2 font-normal text-content-muted">{selectedColor}</span>}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.catalog.color}>
          {colors.map((color) => {
            const isSelected = selectedColor === color;
            const disabled = !colorAvailable(color);
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => selectColor(color)}
                className={buttonClass(isSelected, disabled)}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
