import { ChartNoAxesCombined } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { ProductViewGroup, VisitorViewGroup } from '@/lib/types';
import { ROW_ACTION_CLASS, TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from '../list-styles';
import type { PersonFocus, ProductFocus } from './filters';
import { SHORT_ID_LENGTH } from './VisitsTable';

const NUMBER_CELL = `${TD_CLASS} whitespace-nowrap tabular-nums text-content`;
const MUTED_NUMBER_CELL = `${TD_CLASS} whitespace-nowrap tabular-nums text-content-muted`;

interface ProductTableProps {
  items: ProductViewGroup[];
  onSelect: (product: ProductFocus) => void;
}

/** The history summed up per product, most viewed first. */
export function ProductGroupsTable({ items, onSelect }: ProductTableProps) {
  const t = useTranslation();
  const format = useFormat();
  const labels = t.admin.analytics;

  return (
    <div className={TABLE_WRAPPER_CLASS}>
      <table className="w-full text-left text-sm">
        <thead className={TABLE_HEAD_CLASS}>
          <tr>
            <th className={TH_CLASS}>{labels.product}</th>
            <th className={TH_CLASS}>{labels.colViews}</th>
            <th className={TH_CLASS}>{labels.colVisitors}</th>
            <th className={TH_CLASS}>{labels.colAvgTime}</th>
            <th className={TH_CLASS}>{labels.colTotalTime}</th>
            <th className={TH_CLASS}>{labels.colSaved}</th>
            <th className={TH_CLASS}>{labels.colLastVisit}</th>
            <th className={TH_CLASS}>
              <span className="sr-only">{labels.colActions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((group) => {
            const { productId } = group;
            return (
              <tr key={productId ?? group.productName} className="transition-colors hover:bg-surface-muted">
                <td className={TD_CLASS}>
                  {group.productSlug ? (
                    <a href={`/catalog/${group.productSlug}`} className="font-semibold text-content hover:underline">
                      {group.productName}
                    </a>
                  ) : (
                    <span>
                      <span className="font-semibold text-content">{group.productName}</span>
                      <span className="block text-xs text-content-muted">{labels.deletedProduct}</span>
                    </span>
                  )}
                </td>
                <td className={`${NUMBER_CELL} font-semibold`}>{group.views}</td>
                <td className={NUMBER_CELL}>{group.visitors}</td>
                <td className={NUMBER_CELL}>{format.duration(group.totalDurationMs / group.views)}</td>
                <td className={MUTED_NUMBER_CELL}>{format.duration(group.totalDurationMs)}</td>
                <td className={NUMBER_CELL}>{group.favorites}</td>
                <td className={MUTED_NUMBER_CELL}>{format.dateTime(group.lastViewedAt)}</td>
                <td className={`${TD_CLASS} text-right`}>
                  {/* A deleted product has no id left to narrow the page by. */}
                  {productId && (
                    <button
                      type="button"
                      onClick={() => onSelect({ id: productId, name: group.productName })}
                      aria-label={labels.focusOn(group.productName)}
                      title={labels.focusOn(group.productName)}
                      className={`${ROW_ACTION_CLASS} ml-auto hover:text-content`}
                    >
                      <ChartNoAxesCombined size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface VisitorTableProps {
  items: VisitorViewGroup[];
  onSelect: (person: PersonFocus) => void;
}

/**
 * The history summed up per person, most views first. An account is one row
 * however many browsers it used; a browser that never signed in is its own.
 */
export function VisitorGroupsTable({ items, onSelect }: VisitorTableProps) {
  const t = useTranslation();
  const format = useFormat();
  const labels = t.admin.analytics;

  return (
    <div className={TABLE_WRAPPER_CLASS}>
      <table className="w-full text-left text-sm">
        <thead className={TABLE_HEAD_CLASS}>
          <tr>
            <th className={TH_CLASS}>{labels.visitor}</th>
            <th className={TH_CLASS}>{labels.colViews}</th>
            <th className={TH_CLASS}>{labels.colProducts}</th>
            <th className={TH_CLASS}>{labels.colAvgTime}</th>
            <th className={TH_CLASS}>{labels.colTotalTime}</th>
            <th className={TH_CLASS}>{labels.colSaved}</th>
            <th className={TH_CLASS}>{labels.colLastVisit}</th>
            <th className={TH_CLASS}>
              <span className="sr-only">{labels.colActions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((group) => {
            const shortId = (group.visitorId ?? '').slice(0, SHORT_ID_LENGTH);
            const person: PersonFocus | null = group.user
              ? { kind: 'user', id: group.user.id, label: group.user.name }
              : group.visitorId
                ? { kind: 'visitor', id: group.visitorId, label: labels.visitorId(shortId) }
                : null;

            return (
              <tr key={group.user?.id ?? group.visitorId} className="transition-colors hover:bg-surface-muted">
                <td className={TD_CLASS}>
                  {group.user ? (
                    <>
                      <p className="font-medium text-content">{group.user.name}</p>
                      <p className="text-content-muted">{group.user.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-content">{labels.anonymous}</p>
                      <p className="font-mono text-xs text-content-muted" title={group.visitorId ?? undefined}>
                        {labels.visitorId(shortId)}
                      </p>
                    </>
                  )}
                </td>
                <td className={`${NUMBER_CELL} font-semibold`}>{group.views}</td>
                <td className={NUMBER_CELL}>{group.products}</td>
                <td className={NUMBER_CELL}>{format.duration(group.totalDurationMs / group.views)}</td>
                <td className={MUTED_NUMBER_CELL}>{format.duration(group.totalDurationMs)}</td>
                <td className={NUMBER_CELL}>{group.favorites}</td>
                <td className={MUTED_NUMBER_CELL}>{format.dateTime(group.lastViewedAt)}</td>
                <td className={`${TD_CLASS} text-right`}>
                  {person && (
                    <button
                      type="button"
                      onClick={() => onSelect(person)}
                      aria-label={labels.focusOn(person.label)}
                      title={labels.focusOn(person.label)}
                      className={`${ROW_ACTION_CLASS} ml-auto hover:text-content`}
                    >
                      <ChartNoAxesCombined size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
