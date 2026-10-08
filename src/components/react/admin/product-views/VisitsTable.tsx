import { Filter, Heart } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { ProductViewRecord } from '@/lib/types';
import { TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from '../list-styles';
import type { PersonFocus, ProductFocus } from './filters';

interface Props {
  items: ProductViewRecord[];
  /** What the page is already narrowed to, so a row doesn't offer it again. */
  product: ProductFocus | null;
  person: PersonFocus | null;
  onSelectProduct: (product: ProductFocus) => void;
  onSelectPerson: (person: PersonFocus) => void;
}

// Enough of the id to tell two browsers apart at a glance; the full value is
// in the cell's title for anyone who needs to match it exactly.
export const SHORT_ID_LENGTH = 8;

const FILTER_BUTTON_CLASS =
  'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover hover:text-content';

/** One row per visit: the raw history. */
export default function VisitsTable({ items, product, person, onSelectProduct, onSelectPerson }: Props) {
  const t = useTranslation();
  const format = useFormat();
  const labels = t.admin.analytics;

  return (
    <div className={TABLE_WRAPPER_CLASS}>
      <table className="w-full text-left text-sm">
        <thead className={TABLE_HEAD_CLASS}>
          <tr>
            <th className={TH_CLASS}>{labels.product}</th>
            <th className={TH_CLASS}>{labels.visitor}</th>
            <th className={TH_CLASS}>{labels.country}</th>
            <th className={TH_CLASS}>{labels.ipAddress}</th>
            <th className={TH_CLASS}>{labels.timeWatched}</th>
            <th className={TH_CLASS}>{labels.favorite}</th>
            <th className={TH_CLASS}>{labels.date}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((view) => {
            const productId = view.product.id;
            const shortId = view.visitorId.slice(0, SHORT_ID_LENGTH);
            const rowPerson: PersonFocus = view.user
              ? { kind: 'user', id: view.user.id, label: view.user.name }
              : { kind: 'visitor', id: view.visitorId, label: labels.visitorId(shortId) };

            return (
              <tr key={view.id} className="transition-colors hover:bg-surface-muted">
                <td className={TD_CLASS}>
                  <div className="flex items-center gap-2">
                    {view.product.slug ? (
                      <a href={`/catalog/${view.product.slug}`} className="font-semibold text-content hover:underline">
                        {view.product.name}
                      </a>
                    ) : (
                      // Deleted since the visit: the name is the snapshot the
                      // row kept, and there is nowhere left to link to.
                      <span>
                        <span className="font-semibold text-content">{view.product.name}</span>
                        <span className="block text-xs text-content-muted">{labels.deletedProduct}</span>
                      </span>
                    )}
                    {productId && product?.id !== productId && (
                      <button
                        type="button"
                        onClick={() => onSelectProduct({ id: productId, name: view.product.name })}
                        aria-label={labels.filterByProduct(view.product.name)}
                        title={labels.filterByProduct(view.product.name)}
                        className={FILTER_BUTTON_CLASS}
                      >
                        <Filter size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className={TD_CLASS}>
                  <div className="flex items-center gap-2">
                    <div>
                      {view.user ? (
                        <>
                          <p className="font-medium text-content">{view.user.name}</p>
                          <p className="text-content-muted">{view.user.email}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-content">{labels.anonymous}</p>
                          <p className="font-mono text-xs text-content-muted" title={view.visitorId}>
                            {labels.visitorId(shortId)}
                          </p>
                        </>
                      )}
                    </div>
                    {person?.id !== rowPerson.id && (
                      <button
                        type="button"
                        onClick={() => onSelectPerson(rowPerson)}
                        aria-label={labels.filterByVisitor(rowPerson.label)}
                        title={labels.filterByVisitor(rowPerson.label)}
                        className={FILTER_BUTTON_CLASS}
                      >
                        <Filter size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className={TD_CLASS}>
                  {view.country ? (
                    <span className="text-content" title={view.country}>
                      {format.country(view.country)}
                    </span>
                  ) : (
                    <span className="text-content-muted">{labels.unknownCountry}</span>
                  )}
                </td>
                <td className={`${TD_CLASS} font-mono text-xs text-content-muted`}>{view.ipAddress}</td>
                <td className={`${TD_CLASS} font-medium whitespace-nowrap tabular-nums text-content`}>
                  {format.duration(view.durationMs)}
                </td>
                <td className={TD_CLASS}>
                  {/* Icon and words together, so the state doesn't rest on
                      the heart being filled or its color. */}
                  <span
                    className={`flex items-center gap-1.5 whitespace-nowrap ${
                      view.favorited ? 'font-medium text-danger' : 'text-content-muted'
                    }`}
                  >
                    <Heart size={14} fill={view.favorited ? 'currentColor' : 'none'} />
                    {view.favorited ? labels.favorited : labels.notFavorited}
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
  );
}
