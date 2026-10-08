import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { MomentumDirection, ProductMomentum, ViewForecast } from '@/lib/types';

interface Props {
  forecast: ViewForecast;
  movers: ProductMomentum[];
  /** Narrows the page to one product. Absent when it already is. */
  onSelectProduct?: (product: { id: string; name: string }) => void;
}

// Direction is never color alone: each one has its own arrow and its own word.
const DIRECTION_ICON: Record<MomentumDirection | 'up' | 'down' | 'flat', LucideIcon> = {
  new: Sparkles,
  rising: ArrowUpRight,
  up: ArrowUpRight,
  steady: ArrowRight,
  flat: ArrowRight,
  cooling: ArrowDownRight,
  down: ArrowDownRight,
};

function rounded(value: number): number {
  return Math.round(value);
}

/**
 * The forward-looking part of the page: how many views to expect next week,
 * and which products are gaining or losing attention. Both are estimates from
 * recent history and the copy says so.
 */
export default function ForecastPanel({ forecast, movers, onSelectProduct }: Props) {
  const t = useTranslation();
  const labels = t.admin.analytics;

  const moverLabels: Record<MomentumDirection, string> = {
    new: labels.moverNew,
    rising: labels.moverRising,
    steady: labels.moverSteady,
    cooling: labels.moverCooling,
  };

  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="font-semibold text-content">{labels.forecastTitle}</h2>

      {forecast.status === 'ok' ? (
        (() => {
          const TrendIcon = DIRECTION_ICON[forecast.direction];
          return (
            <div className="mt-3">
              <p className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-content font-stretch-expanded">
                  {rounded(forecast.expectedTotal)}
                </span>
                <span className="text-sm text-content-muted">{labels.forecastUnit}</span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-content">
                <TrendIcon aria-hidden="true" size={16} className="shrink-0 text-content-muted" />
                {labels.forecastDirection[forecast.direction](forecast.previousTotal)}
              </p>
              <p className="mt-1 text-sm text-content-muted">
                {labels.forecastRange(rounded(forecast.lowTotal), rounded(forecast.highTotal))}
              </p>
            </div>
          );
        })()
      ) : (
        <p className="mt-3 text-sm text-content-muted">
          {labels.forecastInsufficient(forecast.daysOfHistory, forecast.daysNeeded)}
        </p>
      )}

      <h3 className="mt-6 text-sm font-semibold text-content">{labels.moversTitle}</h3>
      {movers.length === 0 ? (
        <p className="mt-2 text-sm text-content-muted">{labels.noMovers}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {movers.map((mover) => {
            const Icon = DIRECTION_ICON[mover.direction];
            const { productId } = mover;
            return (
              <li key={productId ?? mover.productName} className="flex items-start gap-3 py-2.5">
                <Icon aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-content-muted" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    {productId && onSelectProduct ? (
                      <button
                        type="button"
                        onClick={() => onSelectProduct({ id: productId, name: mover.productName })}
                        title={labels.focusOn(mover.productName)}
                        className="cursor-pointer truncate text-left text-sm font-semibold text-content hover:underline"
                      >
                        {mover.productName}
                      </button>
                    ) : (
                      <span className="truncate text-sm font-semibold text-content">{mover.productName}</span>
                    )}
                    <span className="text-xs font-medium text-content-muted">{moverLabels[mover.direction]}</span>
                  </p>
                  <p className="text-xs text-content-muted">
                    {labels.moverLine(mover.recent, mover.previous, mover.projected)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-content-muted">{labels.forecastNote}</p>
    </section>
  );
}
