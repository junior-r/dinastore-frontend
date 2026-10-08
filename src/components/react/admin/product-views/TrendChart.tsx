import { useMemo, useState, type PointerEvent, type RefObject } from 'react';
import { useLocale, useTranslation } from '@/i18n';
import type { DailyViews, ForecastDay } from '@/lib/types';

interface Props {
  daily: DailyViews[];
  /** Days after the last recorded one. Empty when there is no forecast to draw. */
  forecast: ForecastDay[];
  /** `YYYY-MM-DD` of today, whose count is still growing. */
  today: string;
  svgRef: RefObject<SVGSVGElement | null>;
}

// The drawing is laid out in these units and scaled to its container, so the
// exported PNG has the same proportions whatever the screen width was.
const WIDTH = 760;
const HEIGHT = 280;
const MARGIN = { top: 34, right: 16, bottom: 30, left: 40 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = 4;
const MAX_X_LABELS = 7;

const INTL_LOCALES: Record<string, string> = { en: 'en-US', es: 'es-ES' };

/** The smallest "round" axis maximum that fits `value` in `Y_TICKS` equal steps. */
function niceMax(value: number): number {
  if (value <= Y_TICKS) {
    return Y_TICKS;
  }
  const rawStep = value / Y_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep)!;
  return step * Y_TICKS;
}

function path(points: [number, number][]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/**
 * Views per day as a line, with the forecast continuing it as a dashed line
 * inside a shaded "likely range". One y-axis, shared by both.
 */
export default function TrendChart({ daily, forecast, today, svgRef }: Props) {
  const t = useTranslation();
  const labels = t.admin.analytics;
  const locale = useLocale();
  const [hovered, setHovered] = useState<number | null>(null);

  const dayFormat = useMemo(
    () =>
      // The day strings are calendar days, so they are read back as UTC to
      // stop the formatter shifting them into the previous evening.
      new Intl.DateTimeFormat(INTL_LOCALES[locale] ?? 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    [locale],
  );
  const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));

  const total = daily.length + forecast.length;
  const yMax = niceMax(Math.max(0, ...daily.map((entry) => entry.views), ...forecast.map((entry) => entry.high)));
  const x = (index: number) => MARGIN.left + (total <= 1 ? PLOT_WIDTH / 2 : (index / (total - 1)) * PLOT_WIDTH);
  const y = (value: number) => MARGIN.top + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT;
  const baseline = y(0);

  const recorded = daily.map((entry, index): [number, number] => [x(index), y(entry.views)]);
  const expected = forecast.map((entry, index): [number, number] => [x(daily.length + index), y(entry.expected)]);
  const band =
    forecast.length > 0
      ? `${path(forecast.map((entry, index) => [x(daily.length + index), y(entry.high)]))} ${path(
          forecast.map((entry, index): [number, number] => [x(daily.length + index), y(entry.low)]).reverse(),
        ).replace('M', 'L')} Z`
      : null;

  const labelEvery = Math.max(1, Math.ceil(total / MAX_X_LABELS));
  const days = [...daily.map((entry) => entry.day), ...forecast.map((entry) => entry.day)];

  function handlePointer(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHovered(Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1)))));
  }

  const hoveredForecast = hovered !== null && hovered >= daily.length ? forecast[hovered - daily.length] : null;
  const hoveredRecorded = hovered !== null && hovered < daily.length ? daily[hovered] : null;
  const lastRecorded = recorded[recorded.length - 1];

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={labels.trendAlt(
          daily.reduce((sum, entry) => sum + entry.views, 0),
          daily.length,
        )}
        className="h-auto w-full font-sans"
      >
        {/* Legend: the dashed line and the band need naming, and it is drawn
            inside the SVG so it is still there in the exported image. */}
        <g className="text-[11px]">
          <line x1={MARGIN.left} x2={MARGIN.left + 18} y1={12} y2={12} className="stroke-brand" strokeWidth={2} />
          <text x={MARGIN.left + 24} y={12} dominantBaseline="middle" className="fill-content-muted">
            {labels.legendRecorded}
          </text>
          {forecast.length > 0 && (
            <>
              <line
                x1={MARGIN.left + 110}
                x2={MARGIN.left + 128}
                y1={12}
                y2={12}
                className="stroke-brand"
                strokeWidth={2}
                strokeDasharray="5 4"
              />
              <text x={MARGIN.left + 134} y={12} dominantBaseline="middle" className="fill-content-muted">
                {labels.legendForecast}
              </text>
              <rect x={MARGIN.left + 220} y={6} width={18} height={12} rx={2} className="fill-brand" fillOpacity={0.14} />
              <text x={MARGIN.left + 244} y={12} dominantBaseline="middle" className="fill-content-muted">
                {labels.legendRange}
              </text>
            </>
          )}
        </g>

        {Array.from({ length: Y_TICKS + 1 }, (_, tick) => {
          const value = (yMax / Y_TICKS) * tick;
          return (
            <g key={tick}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} className="stroke-border" />
              <text
                x={MARGIN.left - 8}
                y={y(value)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-content-muted text-[11px] tabular-nums"
              >
                {value}
              </text>
            </g>
          );
        })}

        {days.map((day, index) =>
          index % labelEvery === 0 ? (
            <text
              key={day}
              x={x(index)}
              y={HEIGHT - 8}
              // The first label would otherwise hang off the left edge.
              textAnchor={index === 0 ? 'start' : 'middle'}
              className="fill-content-muted text-[11px]"
            >
              {formatDay(day)}
            </text>
          ) : null,
        )}

        {band && <path d={band} className="fill-brand" fillOpacity={0.14} />}

        {recorded.length > 1 && (
          <path
            d={`${path(recorded)} L${lastRecorded[0].toFixed(1)},${baseline} L${recorded[0][0].toFixed(1)},${baseline} Z`}
            className="fill-brand"
            fillOpacity={0.1}
          />
        )}
        {recorded.length > 1 && (
          <path
            d={path(recorded)}
            fill="none"
            className="stroke-brand"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {expected.length > 0 && (
          <path
            d={path(expected)}
            fill="none"
            className="stroke-brand"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* The last recorded day gets a marker and its value: it is the one
            point the eye looks for. Every other value is in the tooltip. */}
        {lastRecorded && (
          <>
            <circle cx={lastRecorded[0]} cy={lastRecorded[1]} r={4} className="fill-brand stroke-surface" strokeWidth={2} />
            <text
              x={lastRecorded[0]}
              y={lastRecorded[1] - 10}
              textAnchor={forecast.length > 0 ? 'middle' : 'end'}
              className="fill-content text-[12px] font-semibold tabular-nums"
            >
              {daily[daily.length - 1].views}
            </text>
          </>
        )}

        <g data-export-ignore>
          {hovered !== null && (
            <>
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={MARGIN.top}
                y2={baseline}
                className="stroke-content-muted"
                strokeOpacity={0.5}
              />
              <circle
                cx={x(hovered)}
                cy={y(hoveredForecast ? hoveredForecast.expected : (hoveredRecorded?.views ?? 0))}
                r={4}
                className="fill-brand stroke-surface"
                strokeWidth={2}
              />
            </>
          )}
          {/* One wide hit area, so the pointer never has to find a 2px line. */}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="transparent"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setHovered(null)}
          />
        </g>
      </svg>

      {hovered !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-8 z-10 -translate-x-1/2 rounded-md border border-border bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-lg"
          // Kept inside the card at both ends of the chart.
          style={{ left: `${Math.min(88, Math.max(12, (x(hovered) / WIDTH) * 100))}%` }}
        >
          <p className="font-semibold text-content">
            {formatDay(days[hovered])}
            {days[hovered] === today && <span className="font-normal text-content-muted"> · {labels.todaySoFar}</span>}
          </p>
          {hoveredRecorded && (
            <p className="mt-0.5 text-content-muted">
              {labels.tooltipViews(hoveredRecorded.views, hoveredRecorded.visitors)}
            </p>
          )}
          {hoveredForecast && (
            <p className="mt-0.5 text-content-muted">
              {/* Whole numbers: a tenth of a view is precision the estimate doesn't have. */}
              {labels.tooltipForecast(
                Math.round(hoveredForecast.expected),
                Math.round(hoveredForecast.low),
                Math.round(hoveredForecast.high),
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
