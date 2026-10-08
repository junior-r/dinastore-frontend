import { Tags } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import type { ProductVariantInput } from '@/lib/api/admin';

interface Props {
  variants: ProductVariantInput[];
  variantIndexes: number[];
  onChange: (indexes: number[]) => void;
}

// A single image's "which variants does this apply to" control -- e.g.
// tagging a photo to only the black-colored variants when physical stock
// differs by color (some colors/sizes never got a dedicated photo).
export default function ImageVariantTagControl({ variants, variantIndexes, onChange }: Props) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const appliesToAll = variantIndexes.length === 0;

  function toggleVariant(index: number) {
    onChange(
      variantIndexes.includes(index)
        ? variantIndexes.filter((value) => value !== index)
        : [...variantIndexes, index],
    );
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        title={t.admin.products.tagImageTitle}
        className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-scrim-content transition-opacity ${
          appliesToAll ? 'bg-scrim/60 opacity-0 group-hover:opacity-100' : 'bg-brand opacity-100'
        }`}
      >
        <Tags size={11} />
        {appliesToAll ? t.admin.products.allShort : variantIndexes.length}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-20 mb-1 w-40 -translate-x-1/2 rounded-md border border-border bg-surface p-2 text-left shadow-lg">
          {variants.length === 0 ? (
            <p className="text-xs text-content-muted">{t.admin.products.addVariantToTag}</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onChange([])}
                className={`w-full cursor-pointer rounded px-1.5 py-1 text-left text-xs ${
                  appliesToAll ? 'bg-brand text-brand-content' : 'text-content hover:bg-surface-hover'
                }`}
              >
                {t.admin.products.allVariants}
              </button>
              <div className="mt-1 max-h-32 space-y-0.5 overflow-y-auto border-t border-border pt-1">
                {variants.map((variant, index) => (
                  <label
                    key={index}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs text-content hover:bg-surface-hover"
                  >
                    <input
                      type="checkbox"
                      checked={variantIndexes.includes(index)}
                      onChange={() => toggleVariant(index)}
                      className="rounded border-border"
                    />
                    {variant.size} / {variant.color}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
