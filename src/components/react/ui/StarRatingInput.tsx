import { Star } from 'lucide-react';
import { useState } from 'react';

interface Props {
  /** 1..5, or 0 while nothing is picked yet. */
  value: number;
  onChange: (value: number) => void;
  /** Names the group for assistive tech, e.g. "Your rating". */
  legend: string;
  /** Names one choice, e.g. "4 stars". */
  optionLabel: (stars: number) => string;
  /** Radio group name. Must be unique on the page. */
  name: string;
  disabled?: boolean;
  size?: number;
}

const STARS = [1, 2, 3, 4, 5];

/**
 * Pick 1 to 5 stars. Built on real radio inputs, hidden visually, so the
 * keyboard behaviour (Tab into the group, arrows to move, the group announced
 * with its legend) comes from the browser instead of being reimplemented.
 */
export default function StarRatingInput({
  value,
  onChange,
  legend,
  optionLabel,
  name,
  disabled = false,
  size = 28,
}: Props) {
  // The star under the pointer, so the row previews a choice before the click.
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset disabled={disabled} className="m-0 min-w-0 border-0 p-0 disabled:opacity-60">
      <legend className="sr-only">{legend}</legend>
      <div className="flex" onMouseLeave={() => setHovered(0)}>
        {STARS.map((stars) => (
          // `relative` keeps the visually hidden input positioned inside its
          // own label rather than against some distant ancestor.
          <label
            key={stars}
            onMouseEnter={() => setHovered(stars)}
            className={`relative p-0.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name={name}
              value={stars}
              checked={value === stars}
              onChange={() => onChange(stars)}
              className="peer sr-only"
            />
            <Star
              aria-hidden="true"
              size={size}
              fill="currentColor"
              strokeWidth={0}
              className={`rounded-sm transition-[color,transform] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring active:scale-90 ${
                stars <= shown ? 'text-star' : 'text-content-muted/30'
              }`}
            />
            <span className="sr-only">{optionLabel(stars)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
