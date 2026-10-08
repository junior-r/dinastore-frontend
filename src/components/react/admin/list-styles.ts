// Class strings shared by the admin list pages, so their tables and row
// actions are the same size and spacing everywhere. Each page used to define
// its own copy.

// nowrap: two-word headers ("IP address", "Time watched") otherwise break
// onto two lines in a wide table and leave the header row uneven.
export const TH_CLASS = 'px-5 py-3 font-semibold whitespace-nowrap';
export const TD_CLASS = 'px-5 py-3.5';

/**
 * The wrapper around an admin table.
 *
 * `relative` is load-bearing. A visually hidden header cell (`sr-only`) is
 * absolutely positioned, and a scroll container only clips absolute
 * descendants it is the positioning ancestor of. Without it that 1px label
 * sits outside the scroll area on a narrow screen and makes the whole page
 * scroll sideways.
 */
export const TABLE_WRAPPER_CLASS = 'relative overflow-x-auto rounded-lg border border-border';
export const TABLE_HEAD_CLASS = 'border-b border-border bg-surface-muted text-xs text-content-muted';

/** An icon-only button in a row (edit, delete). Add the hover color per use. */
export const ROW_ACTION_CLASS =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover';
