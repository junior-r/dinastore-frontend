import { Star } from 'lucide-react';

interface Props {
  /** 0..5. Fractions are drawn as a partly filled star. */
  value: number;
  size?: number;
  /** What a screen reader announces. Leave out when the number is next to it. */
  label?: string;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

function Row({ size }: { size: number }) {
  return (
    <>
      {STARS.map((star) => (
        <Star key={star} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
      ))}
    </>
  );
}

/**
 * Read-only stars. Two identical rows are stacked: a muted one underneath,
 * and a filled one on top that is clipped to the value's share of the width.
 * That is what lets 4.3 show as four stars and a third without drawing each
 * star separately.
 */
export default function StarRating({ value, size = 16, label, className = '' }: Props) {
  const percent = Math.max(0, Math.min(100, (value / STARS.length) * 100));

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative inline-flex shrink-0 ${className}`}
    >
      <span className="flex text-content-muted/30">
        <Row size={size} />
      </span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-star" style={{ width: `${percent}%` }}>
        <Row size={size} />
      </span>
    </span>
  );
}
