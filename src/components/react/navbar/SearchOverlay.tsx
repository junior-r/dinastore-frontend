import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Search, SearchX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { getQueryClient } from '@/lib/query-client';
import { productsQueryOptions } from '@/lib/queries/products';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Full-viewport overlay (dimmed + blurred backdrop) rather than a small
// popover, so the search bar can take the full horizontal width and results
// have room to render as horizontal cards underneath it.
function SearchOverlayInner({ open, onClose }: Props) {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslation();
  const format = useFormat();

  const { data, isFetching, isError } = useQuery({
    ...productsQueryOptions({ search: debouncedTerm, pageSize: 8 }),
    enabled: open && debouncedTerm.length > 0,
  });

  useEffect(() => {
    if (open) {
      setTerm('');
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const showResults = debouncedTerm.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto mt-16 w-full max-w-2xl px-4">
        <div role="dialog" aria-modal="true" aria-label={t.search.dialogLabel} className="rounded-lg border border-border bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <Search className="ml-1 size-5 shrink-0 text-content-muted" />
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t.nav.searchProducts}
              aria-label={t.search.dialogLabel}
              className="w-full flex-1 bg-transparent py-2 text-base text-content placeholder:text-content-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t.search.closeSearch}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {!showResults && (
              <p className="px-2 py-10 text-center text-sm text-content-muted">{t.search.prompt}</p>
            )}

            {showResults && isFetching && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-md bg-surface-muted" />
                ))}
              </div>
            )}

            {showResults && !isFetching && isError && (
              <p className="px-2 py-10 text-center text-sm text-danger">{t.search.serviceError}</p>
            )}

            {showResults && !isFetching && !isError && data && data.items.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-content-muted">
                <SearchX size={32} />
                <p className="text-sm">{t.search.noMatches(debouncedTerm)}</p>
              </div>
            )}

            {showResults && !isFetching && !isError && data && data.items.length > 0 && (
              <ul className="space-y-2">
                {data.items.map((product) => (
                  <li key={product.id}>
                    <a
                      href={`/catalog/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 rounded-md p-2 hover:bg-surface-hover"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-muted">
                        {product.images[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].altText ?? product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content">{product.name}</p>
                        <p className="mt-1 text-sm text-content-muted">
                          {format.money(product.basePriceCents, product.currency)}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchOverlay(props: Props) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <SearchOverlayInner {...props} />
    </QueryClientProvider>
  );
}
