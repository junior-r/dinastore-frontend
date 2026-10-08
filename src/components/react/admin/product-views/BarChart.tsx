import type { KeyboardEvent, RefObject } from 'react';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** When set, the row is a button that runs this (e.g. focus that product). */
  onSelect?: () => void;
  /** Accessible name for that button. */
  selectLabel?: string;
}

interface Props {
  data: BarDatum[];
  /** Describes the whole chart to assistive tech. */
  label: string;
  svgRef: RefObject<SVGSVGElement | null>;
}

const WIDTH = 380;
const ROW_HEIGHT = 30;
const BAR_HEIGHT = 14;
const LABEL_WIDTH = 132;
const VALUE_WIDTH = 44;
const PADDING_Y = 6;
const BAR_SPACE = WIDTH - LABEL_WIDTH - VALUE_WIDTH;
const RADIUS = 4;
// Roughly what fits in LABEL_WIDTH at 12px; longer names are cut with an
// ellipsis and kept whole in the row's tooltip.
const MAX_LABEL_CHARS = 20;

function shorten(text: string): string {
  return text.length > MAX_LABEL_CHARS ? `${text.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…` : text;
}

/** A bar that is square where it meets the baseline and rounded at its end. */
function barPath(x: number, y: number, width: number): string {
  const radius = Math.min(RADIUS, width);
  return `M${x},${y} H${x + width - radius} Q${x + width},${y} ${x + width},${y + radius} V${
    y + BAR_HEIGHT - radius
  } Q${x + width},${y + BAR_HEIGHT} ${x + width - radius},${y + BAR_HEIGHT} H${x} Z`;
}

/**
 * Horizontal bars for a ranking (most viewed products, views by country).
 * One hue throughout: the bars are compared by length, and each one is named
 * by the label beside it, so color has no second job to do.
 */
export default function BarChart({ data, label, svgRef }: Props) {
  const max = Math.max(1, ...data.map((datum) => datum.value));
  const height = data.length * ROW_HEIGHT + PADDING_Y * 2;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={label} className="h-auto w-full font-sans">
      {data.map((datum, index) => {
        const rowY = PADDING_Y + index * ROW_HEIGHT;
        const barY = rowY + (ROW_HEIGHT - BAR_HEIGHT) / 2;
        const barWidth = Math.max(2, (datum.value / max) * BAR_SPACE);
        const interactive = Boolean(datum.onSelect);

        const handleKey = (event: KeyboardEvent<SVGGElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            datum.onSelect?.();
          }
        };

        return (
          <g
            key={datum.key}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? datum.selectLabel : undefined}
            onClick={datum.onSelect}
            onKeyDown={interactive ? handleKey : undefined}
            className={`group outline-none ${interactive ? 'cursor-pointer' : ''}`}
          >
            <title>{`${datum.label}: ${datum.value}`}</title>
            {/* Full-row hit area and hover wash; not part of the exported image. */}
            <rect
              data-export-ignore
              x={0}
              y={rowY}
              width={WIDTH}
              height={ROW_HEIGHT}
              rx={6}
              className="fill-transparent transition-colors group-hover:fill-surface-muted group-focus-visible:fill-surface-muted"
            />
            <text
              x={LABEL_WIDTH - 10}
              y={rowY + ROW_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-content text-[12px]"
            >
              {shorten(datum.label)}
            </text>
            <path d={barPath(LABEL_WIDTH, barY, barWidth)} className="fill-brand" />
            <text
              x={LABEL_WIDTH + barWidth + 8}
              y={rowY + ROW_HEIGHT / 2}
              dominantBaseline="middle"
              className="fill-content text-[12px] font-semibold tabular-nums"
            >
              {datum.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
