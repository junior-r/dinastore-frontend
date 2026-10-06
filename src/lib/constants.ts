// Values more than one screen has to agree on.

/**
 * Currency assumed when there is nothing to read it from: an empty cart's
 * zero total, or a new product before the admin picks one. Every real price
 * carries its own currency from the API; this is never used to convert or to
 * override one.
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * How long a search box waits after the last keystroke before querying, in
 * milliseconds. Long enough not to fire on every letter, short enough to
 * still feel live.
 */
export const SEARCH_DEBOUNCE_MS = 300;
