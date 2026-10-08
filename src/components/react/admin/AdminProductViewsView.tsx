import { QueryClientProvider } from '@tanstack/react-query';
import { Eye, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useExportTask } from '@/hooks/useExportTask';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import { useDocumentTitle, useLocale, useTranslation } from '@/i18n';
import { exportProductViews } from '@/lib/api/analytics';
import { svgToPngBlob } from '@/lib/chart-export';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { downloadBlob, todayStamp } from '@/lib/download';
import { useFormat } from '@/lib/format';
import { getQueryClient } from '@/lib/query-client';
import {
  useAdminProductViewInsights,
  useAdminProductViews,
  useAdminProductViewsByProduct,
  useAdminProductViewsByVisitor,
} from '@/lib/queries/admin';
import { useAuthStore } from '@/stores/auth-store';
import Pagination from '../ui/Pagination';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import BarChart, { type BarDatum } from './product-views/BarChart';
import ChartCard from './product-views/ChartCard';
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  toParams,
  type PersonFocus,
  type ProductFocus,
  type ViewFilters,
} from './product-views/filters';
import ForecastPanel from './product-views/ForecastPanel';
import { ProductGroupsTable, VisitorGroupsTable } from './product-views/GroupTables';
import TrendChart from './product-views/TrendChart';
import ViewsSummary from './product-views/ViewsSummary';
import ViewsToolbar from './product-views/ViewsToolbar';
import VisitsTable from './product-views/VisitsTable';

/** How the same history is laid out in the table: per visit, or summed up. */
type Mode = 'visits' | 'products' | 'people';
const MODES: Mode[] = ['visits', 'products', 'people'];

// Past this many, the smallest countries are folded into one "Other" bar so
// the chart stays a ranking someone can read rather than a long list.
const MAX_COUNTRY_BARS = 6;

function ChartsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-lg bg-surface-muted" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-surface-muted" />
    </div>
  );
}

function AdminProductViewsInner() {
  const [filters, setFilters] = useState<ViewFilters>(DEFAULT_FILTERS);
  const [mode, setMode] = useState<Mode>('visits');
  const [page, setPage] = useState(1);
  const t = useTranslation();
  const format = useFormat();
  const locale = useLocale();
  const labels = t.admin.analytics;
  const accessToken = useAuthStore((state) => state.accessToken);
  const exportTask = useExportTask();

  const trendRef = useRef<SVGSVGElement>(null);
  const productsRef = useRef<SVGSVGElement>(null);
  const countriesRef = useRef<SVGSVGElement>(null);

  // Only the search box is debounced; every other control applies at once.
  const search = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const params = useMemo(() => toParams(filters, search), [filters, search]);

  const insights = useAdminProductViewInsights(params);
  const visits = useAdminProductViews({ ...params, page }, mode === 'visits');
  const byProduct = useAdminProductViewsByProduct({ ...params, page }, mode === 'products');
  const byVisitor = useAdminProductViewsByVisitor({ ...params, page }, mode === 'people');
  const list = { visits, products: byProduct, people: byVisitor }[mode];
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  // Any change to what is being looked at starts again from the first page.
  function patchFilters(patch: Partial<ViewFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function changeMode(next: Mode) {
    setMode(next);
    setPage(1);
  }

  // Narrowing to one product or person also switches to its visits: after
  // picking it from a summary, its individual visits are the next thing to see.
  function focusProduct(product: ProductFocus) {
    patchFilters({ product });
    changeMode('visits');
  }

  function focusPerson(person: PersonFocus) {
    patchFilters({ person });
    changeMode('visits');
  }

  const data = insights.data;
  const today = todayStamp();
  // The forecast continues from today, so it is only drawn when the chart
  // actually runs up to today (a custom range in the past has nothing to
  // continue).
  const forecastDays =
    data && data.forecast.status === 'ok' && data.daily[data.daily.length - 1]?.day === today
      ? data.forecast.days
      : [];

  const productBars: BarDatum[] = (data?.topProducts ?? []).map((group) => {
    const { productId } = group;
    return {
      key: productId ?? group.productName,
      label: group.productName,
      value: group.views,
      onSelect: productId ? () => focusProduct({ id: productId, name: group.productName }) : undefined,
      selectLabel: labels.focusOn(group.productName),
    };
  });

  const countryBars: BarDatum[] = useMemo(() => {
    const countries = data?.countries ?? [];
    const shown = countries.slice(0, MAX_COUNTRY_BARS).map((entry) => ({
      key: entry.country ?? 'unknown',
      label: entry.country ? format.country(entry.country) : labels.unknownCountry,
      value: entry.views,
    }));
    const rest = countries.slice(MAX_COUNTRY_BARS).reduce((sum, entry) => sum + entry.views, 0);
    return rest > 0 ? [...shown, { key: 'other', label: labels.otherCountries, value: rest }] : shown;
    // `format` and `labels` are fresh objects each render; the locale is the
    // thing both actually depend on.
  }, [data?.countries, locale]);

  // What the exported image says under its title, so a PNG found in a folder
  // a month later still says what it shows.
  const rangeLabel =
    filters.range === 'custom'
      ? [filters.customFrom, filters.customTo].filter(Boolean).join(' / ') || labels.rangeCustom
      : { '7d': labels.range7d, '30d': labels.range30d, '90d': labels.range90d, all: labels.rangeAll }[filters.range];
  const exportSubtitle = [
    rangeLabel,
    filters.product && labels.focusProduct(filters.product.name),
    filters.person && labels.focusPerson(filters.person.label),
  ]
    .filter(Boolean)
    .join(' · ');

  function exportChart(id: string, ref: RefObject<SVGSVGElement | null>, title: string) {
    void exportTask.run(
      id,
      async () => {
        if (!ref.current) {
          throw new Error(labels.pngError);
        }
        const blob = await svgToPngBlob(ref.current, { title, subtitle: exportSubtitle });
        downloadBlob(blob, `product-views-${id}-${today}.png`);
      },
      { pending: labels.pngPending, success: labels.pngDone, error: labels.pngError },
    );
  }

  function exportExcel() {
    void exportTask.run(
      'excel',
      async () => {
        const blob = await exportProductViews(accessToken as string, params, locale);
        downloadBlob(blob, `product-views-${today}.xlsx`);
      },
      { pending: labels.excelPending, success: labels.excelDone, error: labels.excelError },
    );
  }

  const chartExport = (id: string, ref: RefObject<SVGSVGElement | null>, title: string) => ({
    onExport: () => exportChart(id, ref, title),
    exporting: exportTask.running === id,
    exportDisabled: exportTask.busy,
  });

  const modeLabels: Record<Mode, string> = {
    visits: labels.modeVisits,
    products: labels.modeProducts,
    people: labels.modePeople,
  };
  const isEmpty = !list.isLoading && list.data?.items.length === 0;

  return (
    <div>
      <AdminPageHeader
        title={labels.heading}
        count={data?.totals.views}
        action={
          <button
            type="button"
            onClick={exportExcel}
            // Locked while any export runs, so a second click can't start the
            // same file again. Nothing else on the page is blocked.
            disabled={exportTask.busy || !data || data.totals.views === 0}
            aria-busy={exportTask.running === 'excel'}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportTask.running === 'excel' ? (
              <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" />
            ) : (
              <FileSpreadsheet aria-hidden="true" size={16} />
            )}
            {exportTask.running === 'excel' ? labels.exporting : labels.exportExcel}
          </button>
        }
      />
      <p className="mt-2 max-w-2xl text-sm text-content-muted">{labels.intro}</p>

      <div className="mt-6">
        <ViewsToolbar
          filters={filters}
          onChange={patchFilters}
          countries={(data?.countries ?? []).map((entry) => entry.country)}
        />
      </div>

      <div className="mt-6">
        {!data && <ChartsSkeleton />}

        {data && (
          // Dimmed while a changed filter loads: the numbers on screen are
          // the previous selection's until the new ones arrive.
          <div
            aria-busy={insights.isPlaceholderData}
            className={`space-y-4 transition-opacity ${insights.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <ViewsSummary totals={data.totals} />

            {/* items-start: the forecast panel is the taller of the two, and
                stretching the chart card to match it only adds empty space. */}
            <div className="grid items-start gap-4 xl:grid-cols-3">
              <ChartCard
                title={labels.trendTitle}
                subtitle={forecastDays.length > 0 ? labels.trendSubtitleForecast : labels.trendSubtitle}
                className="xl:col-span-2"
                {...chartExport('trend', trendRef, labels.trendTitle)}
              >
                <TrendChart daily={data.daily} forecast={forecastDays} today={today} svgRef={trendRef} />
              </ChartCard>

              <ForecastPanel
                forecast={data.forecast}
                movers={data.movers}
                onSelectProduct={filters.product ? undefined : focusProduct}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* With the page on one product this would be a single bar. */}
              {!filters.product && (
                <ChartCard
                  title={labels.topProductsTitle}
                  subtitle={labels.topProductsSubtitle}
                  {...chartExport('top-products', productsRef, labels.topProductsTitle)}
                  onExport={
                    productBars.length > 0
                      ? () => exportChart('top-products', productsRef, labels.topProductsTitle)
                      : undefined
                  }
                >
                  {productBars.length > 0 ? (
                    <BarChart data={productBars} label={labels.topProductsTitle} svgRef={productsRef} />
                  ) : (
                    <p className="text-sm text-content-muted">{labels.noChartData}</p>
                  )}
                </ChartCard>
              )}

              <ChartCard
                title={labels.countriesTitle}
                {...chartExport('countries', countriesRef, labels.countriesTitle)}
                onExport={
                  countryBars.length > 0
                    ? () => exportChart('countries', countriesRef, labels.countriesTitle)
                    : undefined
                }
              >
                {countryBars.length > 0 ? (
                  <BarChart data={countryBars} label={labels.countriesTitle} svgRef={countriesRef} />
                ) : (
                  <p className="text-sm text-content-muted">{labels.noChartData}</p>
                )}
              </ChartCard>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={labels.viewAs} className="flex rounded-full bg-surface-muted p-1">
          {MODES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeMode(option)}
              aria-pressed={mode === option}
              className={`h-9 cursor-pointer rounded-full px-4 text-sm font-medium transition ${
                mode === option ? 'bg-content text-content-inverse' : 'text-content-muted hover:text-content'
              }`}
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>
        {list.data && (
          <p className="text-sm tabular-nums text-content-muted">{labels.modeCount[mode](list.data.total)}</p>
        )}
      </div>

      <div className="mt-4">
        {list.isLoading && <AdminListSkeleton />}

        {isEmpty && (
          <AdminEmptyState icon={Eye} message={hasActiveFilters(filters) ? labels.emptyFiltered : labels.empty} />
        )}

        {!list.isLoading && !isEmpty && (
          <div
            aria-busy={list.isPlaceholderData}
            className={`transition-opacity ${list.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {mode === 'visits' && visits.data && (
              <VisitsTable
                items={visits.data.items}
                product={filters.product}
                person={filters.person}
                onSelectProduct={focusProduct}
                onSelectPerson={focusPerson}
              />
            )}
            {mode === 'products' && byProduct.data && (
              <ProductGroupsTable items={byProduct.data.items} onSelect={focusProduct} />
            )}
            {mode === 'people' && byVisitor.data && (
              <VisitorGroupsTable items={byVisitor.data.items} onSelect={focusPerson} />
            )}

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminProductViewsView() {
  const { authorized } = useRequireAdminAccess('analytics:view');
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized) {
    return <AdminListSkeleton />;
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminProductViewsInner />
    </QueryClientProvider>
  );
}
