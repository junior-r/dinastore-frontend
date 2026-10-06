import type { CSSProperties } from 'react';

/**
 * Inline style made of CSS custom properties.
 *
 * The cast is the reason this helper exists. React's `CSSProperties` has no
 * index signature for custom properties, so every call site would otherwise
 * need its own `as CSSProperties`.
 */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/**
 * Places an element in a stagger: index 0 plays immediately, each later index
 * a beat after the one before. Read by `animate-rise`, `animate-word`,
 * `reveal-group` children and (as a phase offset) `animate-float`; the delay
 * per step lives in `global.css`, next to each keyframe.
 */
export function riseIndex(index: number): CSSProperties {
  return cssVars({ '--rise-index': index });
}
