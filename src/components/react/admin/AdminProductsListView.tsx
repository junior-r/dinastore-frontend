import { QueryClientProvider } from '@tanstack/react-query';
import { ImageOff, PackageSearch, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { useFormat } from '@/lib/format';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useAdminProducts, useDeleteProduct, useUpdateProductStatus } from '@/lib/queries/admin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import type { ProductStatus } from '@/lib/types';
import ConfirmDialog from '../ui/ConfirmDialog';
import Pagination from '../ui/Pagination';
import Sidebar from '../ui/Sidebar';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import AdminProductFormView from './AdminProductFormView';
import AdminSearchInput from './AdminSearchInput';
import { PILL_CLASS, PRODUCT_STATUSES, PRODUCT_STATUS_STYLES } from './status-styles';
import { can } from '@/lib/permissions';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { ROW_ACTION_CLASS, TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from './list-styles';

type SidebarState = { mode: 'create' } | { mode: 'edit'; slug: string } | null;


function ProductThumbnail({ image, name }: { image?: { url: string; altText: string | null }; name: string }) {
  if (image) {
    return (
      <img
        src={image.url}
        alt={image.altText ?? name}
        loading="lazy"
        decoding="async"
        className="h-12 w-12 shrink-0 rounded-md object-cover"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-muted text-content-muted">
      <ImageOff size={18} />
    </span>
  );
}

function AdminProductsListInner({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const isFirstFilterRun = useRef(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sidebarState, setSidebarState] = useState<SidebarState>(null);
  const t = useTranslation();
  const format = useFormat();

  const { data, isLoading } = useAdminProducts({
    page,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });
  const updateStatus = useUpdateProductStatus();
  const deleteProduct = useDeleteProduct();

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pendingDeleteProduct = data?.items.find((product) => product.id === pendingDeleteId) ?? null;

  const newProductButton = canManage && (
    <button
      type="button"
      onClick={() => setSidebarState({ mode: 'create' })}
      className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98]"
    >
      <Plus size={16} />
      {t.admin.products.newProduct}
    </button>
  );

  return (
    <div>
      <AdminPageHeader title={t.admin.products.heading} count={data?.total} action={newProductButton} />

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminSearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t.admin.products.searchPlaceholder}
          label={t.admin.products.searchLabel}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProductStatus | '')}
          aria-label={t.admin.products.status}
          className="h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-sm text-content transition focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none"
        >
          <option value="">{t.admin.products.allStatuses}</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t.admin.products.statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {isLoading && <AdminListSkeleton />}

        {!isLoading && data && data.items.length === 0 && (
          <AdminEmptyState icon={PackageSearch} message={t.admin.products.noMatches} />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <>
            {/* `relative` is load-bearing. The visually hidden "Actions"
                header is absolutely positioned, and a scroll container only
                clips absolute descendants it is the positioning ancestor of.
                Without it that 1px label sits outside the scroll area on a
                narrow screen and makes the whole page scroll sideways. */}
            <div className={TABLE_WRAPPER_CLASS}>
              <table className="w-full text-left text-sm">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={TH_CLASS}>{t.admin.products.name}</th>
                    <th className={TH_CLASS}>{t.admin.products.price}</th>
                    <th className={TH_CLASS}>{t.admin.products.stock}</th>
                    <th className={TH_CLASS}>{t.admin.products.status}</th>
                    {canManage && (
                      <th className={TH_CLASS}>
                        <span className="sr-only">{t.admin.products.actions}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-surface-muted">
                      <td className={TD_CLASS}>
                        <div className="flex items-center gap-3">
                          <ProductThumbnail image={product.images[0]} name={product.name} />
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => setSidebarState({ mode: 'edit', slug: product.slug })}
                              className="cursor-pointer text-left font-semibold text-content hover:underline"
                            >
                              {product.name}
                            </button>
                          ) : (
                            <span className="font-semibold text-content">{product.name}</span>
                          )}
                        </div>
                      </td>
                      <td className={`${TD_CLASS} tabular-nums text-content-muted`}>
                        {format.money(product.basePriceCents, product.currency)}
                      </td>
                      {/* Zero stock is called out in the danger color and
                          weight; the number itself still says it, so the
                          color is reinforcement rather than the only cue. */}
                      <td
                        className={`${TD_CLASS} tabular-nums ${
                          product.totalStock === 0 ? 'font-semibold text-danger' : 'text-content-muted'
                        }`}
                      >
                        {product.totalStock}
                      </td>
                      <td className={TD_CLASS}>
                        {canManage ? (
                          <select
                            value={product.status}
                            disabled={updateStatus.isPending}
                            onChange={(event) =>
                              updateStatus.mutate({ id: product.id, status: event.target.value as ProductStatus })
                            }
                            aria-label={t.admin.products.status}
                            className={`cursor-pointer border-0 ${PILL_CLASS} ${PRODUCT_STATUS_STYLES[product.status]}`}
                          >
                            {PRODUCT_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {t.admin.products.statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`${PILL_CLASS} ${PRODUCT_STATUS_STYLES[product.status]}`}>
                            {t.admin.products.statusLabels[product.status]}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className={TD_CLASS}>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSidebarState({ mode: 'edit', slug: product.slug })}
                              aria-label={t.admin.editItem(product.name)}
                              className={`${ROW_ACTION_CLASS} hover:text-content`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(product.id)}
                              aria-label={t.admin.deleteItem(product.name)}
                              className={`${ROW_ACTION_CLASS} hover:text-danger`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {canManage && (
        <Sidebar
          open={sidebarState !== null}
          onClose={() => setSidebarState(null)}
          title={sidebarState?.mode === 'edit' ? t.admin.products.editProduct : t.admin.products.newProduct}
          // The product form carries images, variants and a category picker;
          // at the default width its two-column rows were squeezed.
          size="lg"
        >
          {sidebarState !== null && (
            <AdminProductFormView
              key={sidebarState.mode === 'edit' ? sidebarState.slug : 'create'}
              {...sidebarState}
              onSaved={() => setSidebarState(null)}
            />
          )}
        </Sidebar>
      )}

      <ConfirmDialog
        open={pendingDeleteProduct !== null}
        title={t.admin.products.deleteTitle}
        message={t.admin.products.deleteMessage(pendingDeleteProduct?.name ?? '')}
        confirmLabel={t.common.delete}
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteProduct) {
            deleteProduct.mutate(pendingDeleteProduct.id);
          }
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export default function AdminProductsListView() {
  const { authorized, user } = useRequireAdminAccess('products:view');
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized || !user) {
    return <AdminListSkeleton />;
  }

  const canManage = can(user, 'products:manage');

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminProductsListInner canManage={canManage} />
    </QueryClientProvider>
  );
}
