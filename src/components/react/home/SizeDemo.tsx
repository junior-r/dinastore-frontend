import { useEffect, useState } from 'react';

// Shown struck through, like an out-of-stock size in the real picker.
const UNAVAILABLE = 'XL';
const SIZES = ['S', 'M', 'L', UNAVAILABLE];
const SELECTABLE_COUNT = SIZES.length - 1;
const STEP_MS = 1800;

// A miniature of VariantPicker's size row, with the selection stepping from
// one size to the next. It illustrates the "pick your size" tile it sits in
// and does nothing else, so it is hidden from assistive tech and unreachable
// by keyboard. Sits on the brand color, hence the brand-content inks.
export default function SizeDemo() {
  const [selected, setSelected] = useState(1);

  useEffect(() => {
    // Under reduced motion it stays a still picture of the picker.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setSelected((current) => (current + 1) % SELECTABLE_COUNT);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true" className="flex gap-2">
      {SIZES.map((size, index) => {
        const base =
          'flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors duration-500';
        if (size === UNAVAILABLE) {
          return (
            <span key={size} className={`${base} border-dashed border-brand-content/35 text-brand-content/50 line-through`}>
              {size}
            </span>
          );
        }
        return (
          <span
            key={size}
            className={
              index === selected
                ? `${base} border-brand-content bg-brand-content text-brand`
                : `${base} border-brand-content/35 text-brand-content`
            }
          >
            {size}
          </span>
        );
      })}
    </div>
  );
}
