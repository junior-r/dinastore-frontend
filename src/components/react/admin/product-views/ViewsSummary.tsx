import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { ViewInsights } from '@/lib/types';

interface Props {
  totals: ViewInsights['totals'];
}

/** The four headline numbers for the current filters. */
export default function ViewsSummary({ totals }: Props) {
  const t = useTranslation();
  const format = useFormat();
  const labels = t.admin.analytics;

  const tiles = [
    { label: labels.statViews, value: String(totals.views) },
    { label: labels.statVisitors, value: String(totals.visitors) },
    { label: labels.statAvgTime, value: format.duration(totals.avgDurationMs) },
    {
      label: labels.statSaved,
      value: `${Math.round(totals.favoriteRate * 100)}%`,
      hint: labels.statSavedHint(totals.favorites, totals.views),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg bg-surface-muted p-4">
          <dt className="text-sm text-content-muted">{tile.label}</dt>
          <dd className="mt-1 text-2xl font-extrabold tracking-tight text-content font-stretch-expanded">
            {tile.value}
          </dd>
          {tile.hint && <dd className="mt-0.5 text-xs text-content-muted">{tile.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
