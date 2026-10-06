import { QueryClientProvider } from '@tanstack/react-query';
import { CloudOff, Search, SearchX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { useProducts } from '@/lib/queries/products';
import { ApiError } from '@/lib/api-client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle, useTranslation } from '@/i18n';
import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import Pagination from '../ui/Pagination';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4';
// The first row at the widest breakpoint: those images are on screen at first
// paint, so they load eagerly instead of waiting on `loading="lazy"`.
const EAGER_CARD_COUNT = 4;

function getInitialPage(): number {
  if (typeof window === 'undefined') {
    return 1;
  }
  const page = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getInitialSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

function getInitialCategoryIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = new URLSearchParams(window.location.search).get('categories');
  return raw ? raw.split(',').filter(Boolean) : [];
}

function ProductGridInner() {
  const [page, setPage] = useState(getInitialPage);
  const [searchInput, setSearchInput] = useState(getInitialSearch);
  const [categoryIds, setCategoryIds] = useState<string[]>(getInitialCategoryIds);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const isFirstFilterRun = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const t = useTranslation();

  useDocumentTitle(t.catalog.title);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useProducts({
    page,
    search: debouncedSearch || undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
  });

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, categoryIds]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (page === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(page));
    }
    if (debouncedSearch) {
      url.searchParams.set('q', debouncedSearch);
    } else {
      url.searchParams.delete('q');
    }
    if (categoryIds.length > 0) {
      url.searchParams.set('categories', categoryIds.join(','));
    } else {
      url.searchParams.delete('categories');
    }
    window.history.replaceState(window.history.state, '', url);
  }, [page, debouncedSearch, categoryIds]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasFilters = searchInput.trim().length > 0 || categoryIds.length > 0;

  function clearFilters() {
    setSearchInput('');
    setCategoryIds([]);
  }

  // Paging swaps the whole grid, so the reader is taken back to the top of it
  // rather than left at the bottom of a page of products they haven't seen.
  // Done here, not in an effect on `page`, so it never fires on first load or
  // when a filter change resets the page to 1.
  function goToPage(next: number) {
    setPage(next);
    headingRef.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        {/* scroll-mt clears the sticky navbar when goToPage scrolls here. */}
        <h1
          ref={headingRef}
          className="scroll-mt-24 text-4xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-5xl"
        >
          {t.catalog.heading}
        </h1>
        {data && <p className="text-sm text-content-muted">{t.catalog.resultCount(data.total)}</p>}
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full shrink-0 lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t.nav.searchProducts}
            aria-label={t.search.dialogLabel}
            className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-10 text-sm text-content placeholder:text-content-muted focus:border-brand focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label={t.search.clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-content-muted hover:bg-surface-hover hover:text-content"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <CategoryFilter selectedCategoryIds={categoryIds} onChange={setCategoryIds} />
      </div>

      {isLoading && (
        <div className={`mt-10 ${GRID_CLASS}`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="mt-10 flex flex-col items-center rounded-lg bg-surface-muted px-6 py-16 text-center">
          <CloudOff className="size-8 text-content-muted" />
          <p className="mt-4 text-content">{error instanceof ApiError ? error.message : t.catalog.serviceError}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 h-11 cursor-pointer rounded-md bg-brand px-6 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98]"
          >
            {t.common.retry}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-lg bg-surface-muted px-6 py-16 text-center">
          <SearchX className="size-8 text-content-muted" />
          <p className="mt-4 font-medium text-content">
            {debouncedSearch
              ? t.catalog.noMatches(debouncedSearch)
              : hasFilters
                ? t.catalog.noFilterMatches
                : t.catalog.noProducts}
          </p>
          {hasFilters && (
            <>
              <p className="mt-1 text-sm text-content-muted">{t.catalog.emptyHint}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 h-11 cursor-pointer rounded-md border border-border px-6 text-sm font-semibold text-content transition hover:border-content active:scale-[0.98]"
              >
                {t.catalog.clearFilters}
              </button>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          {/* While another page or search is loading, the previous results
              stay up (see useProducts) and are dimmed, so the grid neither
              collapses to skeletons nor looks finished when it isn't.
              aria-busy says the same thing to assistive tech. */}
          <div
            aria-busy={isPlaceholderData}
            className={`mt-10 transition-opacity duration-200 ${GRID_CLASS} ${isPlaceholderData ? 'opacity-50' : ''}`}
          >
            {data.items.map((product, index) => (
              <ProductCard key={product.id} product={product} eager={index < EAGER_CARD_COUNT} />
            ))}
          </div>

          <div className="mt-14">
            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
          </div>
        </>
      )}
    </>
  );
}

export default function ProductGrid() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ProductGridInner />
    </QueryClientProvider>
  );
}
