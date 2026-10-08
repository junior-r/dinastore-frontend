import type { ProductViewFilterParams } from '@/lib/api/analytics';

export type RangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export const RANGE_PRESETS: RangePreset[] = ['7d', '30d', '90d', 'all', 'custom'];

const PRESET_DAYS: Partial<Record<RangePreset, number>> = { '7d': 7, '30d': 30, '90d': 90 };

/** The one product the whole page is narrowed to, when there is one. */
export interface ProductFocus {
  id: string;
  name: string;
}

/**
 * The one person the page is narrowed to: an account (all of its browsers),
 * or a browser that never signed in.
 */
export interface PersonFocus {
  kind: 'user' | 'visitor';
  id: string;
  label: string;
}

export interface ViewFilters {
  search: string;
  range: RangePreset;
  /** `YYYY-MM-DD`, only used when `range` is "custom". */
  customFrom: string;
  customTo: string;
  /** '' for any, a two-letter code, or "unknown". */
  country: string;
  visitor: '' | 'signed-in' | 'anonymous';
  favorited: '' | 'true' | 'false';
  product: ProductFocus | null;
  person: PersonFocus | null;
}

export const DEFAULT_FILTERS: ViewFilters = {
  search: '',
  range: '30d',
  customFrom: '',
  customTo: '',
  country: '',
  visitor: '',
  favorited: '',
  product: null,
  person: null,
};

/** True when anything narrows the history beyond the default period. */
export function hasActiveFilters(filters: ViewFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.range !== DEFAULT_FILTERS.range ||
    filters.country !== '' ||
    filters.visitor !== '' ||
    filters.favorited !== '' ||
    filters.product !== null ||
    filters.person !== null
  );
}

// Midnight at the start of a `YYYY-MM-DD` day in the viewer's own time zone.
// Built from parts on purpose: `new Date('2026-10-07')` would be UTC midnight.
function localMidnight(day: string, addDays = 0): Date | null {
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) {
    return null;
  }
  return new Date(year, month - 1, date + addDays);
}

/**
 * The filters as the API takes them. `search` is passed in separately so the
 * caller can send a debounced copy of what is being typed.
 */
export function toParams(filters: ViewFilters, search: string): ProductViewFilterParams {
  const params: ProductViewFilterParams = {};

  const term = search.trim();
  if (term) params.search = term;
  if (filters.country) params.country = filters.country;
  if (filters.visitor) params.visitor = filters.visitor;
  if (filters.favorited) params.favorited = filters.favorited;
  if (filters.product) params.productId = filters.product.id;
  if (filters.person?.kind === 'user') params.userId = filters.person.id;
  if (filters.person?.kind === 'visitor') params.visitorId = filters.person.id;

  const presetDays = PRESET_DAYS[filters.range];
  if (presetDays) {
    // "Last 7 days" is today and the six days before it, from local midnight.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (presetDays - 1));
    params.from = start.toISOString();
  } else if (filters.range === 'custom') {
    const from = localMidnight(filters.customFrom);
    // The end date is inclusive for the person, exclusive for the API, so
    // the instant sent is the midnight that ends that day.
    const to = localMidnight(filters.customTo, 1);
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
  }

  return params;
}
