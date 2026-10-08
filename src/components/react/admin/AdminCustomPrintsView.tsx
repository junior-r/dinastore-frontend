import { QueryClientProvider } from '@tanstack/react-query';
import { Download, Shirt } from 'lucide-react';
import { useState } from 'react';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import { getQueryClient } from '@/lib/query-client';
import { useAdminCustomOrderItems } from '@/lib/queries/admin';
import DesignMockup from '../customize/DesignMockup';
import OrderStatusBadge from '../OrderStatusBadge';
import Pagination from '../ui/Pagination';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import { TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from './list-styles';

// Enough of the order id to quote to a colleague; the same length the
// customer sees on their own order page.
const SHORT_ID_LENGTH = 8;

const percent = (fraction: number) => Math.round(fraction * 100);

function AdminCustomPrintsInner() {
  const [page, setPage] = useState(1);
  const t = useTranslation();
  const format = useFormat();

  const { data, isLoading } = useAdminCustomOrderItems({ page });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <AdminPageHeader title={t.admin.customPrints.heading} count={data?.total} />
      <p className="mt-2 max-w-2xl text-sm text-content-muted">{t.admin.customPrints.intro}</p>

      <div className="mt-6">
        {isLoading && <AdminListSkeleton />}

        {!isLoading && data && data.items.length === 0 && (
          <AdminEmptyState icon={Shirt} message={t.admin.customPrints.empty} />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <>
            <div className={TABLE_WRAPPER_CLASS}>
              <table className="w-full text-left text-sm">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={TH_CLASS}>{t.admin.customPrints.preview}</th>
                    <th className={TH_CLASS}>{t.admin.customPrints.item}</th>
                    <th className={TH_CLASS}>{t.admin.customPrints.placement}</th>
                    <th className={TH_CLASS}>{t.admin.customPrints.customer}</th>
                    <th className={TH_CLASS}>{t.admin.customPrints.order}</th>
                    <th className={TH_CLASS}>
                      <span className="sr-only">{t.admin.customPrints.printFile}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(({ item, customer, orderId, orderStatus, orderedAt, printUrl }) => {
                    const { customization } = item;
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-surface-muted">
                        <td className={TD_CLASS}>
                          <DesignMockup
                            garmentImageUrl={customization.garmentImageUrl}
                            designUrl={customization.thumbnailUrl}
                            placement={customization.placement}
                            alt={item.productName}
                            className="w-24 rounded-md"
                          />
                        </td>
                        <td className={TD_CLASS}>
                          <p className="font-semibold text-content">{item.productName}</p>
                          <p className="text-content-muted">
                            {item.variantSize} / {item.variantColor}
                          </p>
                          <p className="mt-1 font-medium whitespace-nowrap tabular-nums text-content">
                            {t.admin.customPrints.quantity(item.quantity)}
                          </p>
                        </td>
                        <td className={`${TD_CLASS} text-content-muted`}>
                          {t.admin.customPrints.placementValue(
                            percent(customization.placement.x),
                            percent(customization.placement.y),
                            percent(customization.placement.width),
                          )}
                        </td>
                        <td className={TD_CLASS}>
                          <p className="font-medium text-content">{customer.name}</p>
                          <p className="text-content-muted">{customer.email}</p>
                        </td>
                        <td className={TD_CLASS}>
                          <p className="font-mono text-xs text-content" title={orderId}>
                            {t.orders.number(orderId.slice(0, SHORT_ID_LENGTH))}
                          </p>
                          <p className="mt-1 whitespace-nowrap tabular-nums text-content-muted">
                            {format.dateTime(orderedAt)}
                          </p>
                          <div className="mt-1.5">
                            <OrderStatusBadge status={orderStatus} />
                          </div>
                        </td>
                        <td className={TD_CLASS}>
                          {/* A plain link to the stored file: `download` is
                              ignored across origins, so it opens in a new tab
                              and is saved from there. */}
                          <a
                            href={printUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t.admin.customPrints.printFileFor(item.productName)}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3.5 text-sm font-medium whitespace-nowrap text-content transition hover:border-content"
                          >
                            <Download aria-hidden="true" size={16} />
                            {t.admin.customPrints.printFile}
                          </a>
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

export default function AdminCustomPrintsView() {
  const { authorized } = useRequireAdminAccess('orders:view');
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized) {
    return <AdminListSkeleton />;
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminCustomPrintsInner />
    </QueryClientProvider>
  );
}
