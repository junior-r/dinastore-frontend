import { QueryClientProvider } from '@tanstack/react-query';
import { Eye, Filter, Heart, X } from 'lucide-react';
import { useState } from 'react';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { getQueryClient } from '@/lib/query-client';
import { useAdminProductViews } from '@/lib/queries/admin';
import Pagination from '../ui/Pagination';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import { TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from './list-styles';

// Enough of the id to tell two browsers apart at a glance; the full value is
// in the cell's title for anyone who needs to match it exactly.
const SHORT_ID_LENGTH = 8;

interface ProductFilter {
  id: string;
  name: string;
}

function AdminProductViewsInner() {
  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState<ProductFilter | null>(null);
  const t = useTranslation();
  const format = useFormat();

  const { data, isLoading } = useAdminProductViews({ page, productId: productFilter?.id });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // A different filter is a different list, so it starts from its first page.
  function applyFilter(filter: ProductFilter | null) {
    setProductFilter(filter);
    setPage(1);
  }

  return (
    <div>
      <AdminPageHeader title={t.admin.analytics.heading} count={data?.total} />
      <p className="mt-2 max-w-2xl text-sm text-content-muted">{t.admin.analytics.intro}</p>

      {productFilter && (
        <div className="mt-5 flex items-center gap-2">
          <span className="flex h-9 items-center gap-2 rounded-full bg-content pr-1.5 pl-4 text-sm font-medium text-content-inverse">
            {t.admin.analytics.filteredTo(productFilter.name)}
            <button
              type="button"
              onClick={() => applyFilter(null)}
              aria-label={t.admin.analytics.clearFilter}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full transition hover:bg-content-inverse/20"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      <div className="mt-6">
        {isLoading && <AdminListSkeleton />}

        {!isLoading && data && data.items.length === 0 && (
          <AdminEmptyState
            icon={Eye}
            message={productFilter ? t.admin.analytics.emptyFiltered : t.admin.analytics.empty}
          />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <>
            {/* `relative` so anything absolutely positioned inside is clipped
                by this scroll container (see the note in
                AdminProductsListView). */}
            <div className={TABLE_WRAPPER_CLASS}>
              <table className="w-full text-left text-sm">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={TH_CLASS}>{t.admin.analytics.product}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.visitor}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.country}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.ipAddress}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.timeWatched}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.favorite}</th>
                    <th className={TH_CLASS}>{t.admin.analytics.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((view) => {
                    const productId = view.product.id;
                    return (
                      <tr key={view.id} className="transition-colors hover:bg-surface-muted">
                        <td className={TD_CLASS}>
                          <div className="flex items-center gap-2">
                            {view.product.slug ? (
                              <a
                                href={`/catalog/${view.product.slug}`}
                                className="font-semibold text-content hover:underline"
                              >
                                {view.product.name}
                              </a>
                            ) : (
                              // Deleted since the visit: the name is the
                              // snapshot the row kept, and there is nowhere
                              // left to link to.
                              <span>
                                <span className="font-semibold text-content">{view.product.name}</span>
                                <span className="block text-xs text-content-muted">
                                  {t.admin.analytics.deletedProduct}
                                </span>
                              </span>
                            )}
                            {productId && productFilter?.id !== productId && (
                              <button
                                type="button"
                                onClick={() => applyFilter({ id: productId, name: view.product.name })}
                                aria-label={t.admin.analytics.filterByProduct(view.product.name)}
                                title={t.admin.analytics.filterByProduct(view.product.name)}
                                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover hover:text-content"
                              >
                                <Filter size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={TD_CLASS}>
                          {view.user ? (
                            <>
                              <p className="font-medium text-content">{view.user.name}</p>
                              <p className="text-content-muted">{view.user.email}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-content">{t.admin.analytics.anonymous}</p>
                              <p className="font-mono text-xs text-content-muted" title={view.visitorId}>
                                {t.admin.analytics.visitorId(view.visitorId.slice(0, SHORT_ID_LENGTH))}
                              </p>
                            </>
                          )}
                        </td>
                        <td className={TD_CLASS}>
                          {view.country ? (
                            <span className="text-content" title={view.country}>
                              {format.country(view.country)}
                            </span>
                          ) : (
                            <span className="text-content-muted">{t.admin.analytics.unknownCountry}</span>
                          )}
                        </td>
                        <td className={`${TD_CLASS} font-mono text-xs text-content-muted`}>{view.ipAddress}</td>
                        <td className={`${TD_CLASS} font-medium whitespace-nowrap tabular-nums text-content`}>
                          {format.duration(view.durationMs)}
                        </td>
                        <td className={TD_CLASS}>
                          {/* Icon and words together, so the state doesn't
                              rest on the heart being filled or its color. */}
                          <span
                            className={`flex items-center gap-1.5 whitespace-nowrap ${
                              view.favorited ? 'font-medium text-danger' : 'text-content-muted'
                            }`}
                          >
                            <Heart size={14} fill={view.favorited ? 'currentColor' : 'none'} />
                            {view.favorited ? t.admin.analytics.favorited : t.admin.analytics.notFavorited}
                          </span>
                        </td>
                        <td className={`${TD_CLASS} whitespace-nowrap tabular-nums text-content-muted`}>
                          {format.dateTime(view.startedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
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
