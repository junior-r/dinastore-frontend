import { Minus, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  // `lg` matches the height of a full-size call-to-action, for when the
  // stepper sits in the same row as one (the product page).
  size?: 'md' | 'lg';
}

// Whole class strings per size, not `h-${n}`: Tailwind only emits utilities
// it can find literally in the source.
const SIZE_CLASSES = {
  md: { button: 'h-9 w-9', input: 'h-9 w-12' },
  lg: { button: 'h-12 w-11', input: 'h-12 w-12' },
};

export default function QuantityStepper({ value, onChange, min = 1, max, size = 'md' }: Props) {
  const t = useTranslation();
  const sizeClasses = SIZE_CLASSES[size];

  function clamp(next: number): number {
    const floored = Math.max(min, next);
    return typeof max === 'number' ? Math.min(max, floored) : floored;
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={t.common.decreaseQuantity}
        className={`flex ${sizeClasses.button} cursor-pointer items-center justify-center text-content-muted hover:bg-surface-hover hover:text-content disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          onChange(clamp(Number.isNaN(parsed) ? min : parsed));
        }}
        aria-label={t.common.quantity}
        className={`${sizeClasses.input} border-x border-border bg-transparent text-center text-sm text-content focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={typeof max === 'number' && value >= max}
        aria-label={t.common.increaseQuantity}
        className={`flex ${sizeClasses.button} cursor-pointer items-center justify-center text-content-muted hover:bg-surface-hover hover:text-content disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
