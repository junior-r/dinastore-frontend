import { Search, Shirt } from 'lucide-react';
import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTranslation } from '@/i18n';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { useFormat } from '@/lib/format';
import { useProducts } from '@/lib/queries/products';
import type { Product } from '@/lib/types';
import Pagination from '../ui/Pagination';

interface Props {
  onSelect: (product: Product) => void;
}

// Two rows of four on a wide screen; small enough to scan, and the search box
// is right there for anything not on the first page.
const PAGE_SIZE = 8;

/** Step one of the studio: a searchable grid of what can be printed on. */
export default function GarmentPicker({ onSelect }: Props) {
  const t = useTranslation();
  const format = useFormat();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  const { data, isLoading, isError, isPlaceholderData, refetch } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            // A different search is a different list, so it starts from page one.
            setPage(1);
          }}
          placeholder={t.customize.garment.searchPlaceholder}
          aria-label={t.customize.garment.searchLabel}
          className="h-11 w-full rounded-md border border-border bg-surface pr-4 pl-10 text-sm text-content transition placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none"
        />
      </div>

      {isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-4 rounded-lg border border-border p-5 text-sm">
          <p className="text-content-muted">{t.customize.garment.error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 cursor-pointer font-medium text-brand hover:underline"
          >
            {t.common.retry}
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-lg border border-border p-5 text-sm text-content-muted">
          {t.customize.garment.empty}
        </p>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul
            aria-busy={isPlaceholderData}
            className={`mt-4 grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 ${
              isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {data.items.map((product) => {
              const imageUrl = product.images[0]?.url;
              const soldOut = product.totalStock <= 0;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => onSelect(product)}
                    aria-label={t.customize.garment.select(product.name)}
                    className="group block w-full cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-surface-muted ring-content transition group-hover:ring-2 group-focus-visible:ring-2">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <Shirt aria-hidden="true" className="size-8 text-content-muted/50" strokeWidth={1.25} />
                      )}
                    </span>
                    <span className="mt-2 block truncate text-sm font-medium text-content">{product.name}</span>
                    <span className="block text-xs text-content-muted">
                      {soldOut ? t.cart.outOfStock : format.money(product.basePriceCents, product.currency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
