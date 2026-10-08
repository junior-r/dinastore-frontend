import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import AdminSearchInput from '../AdminSearchInput';
import { DEFAULT_FILTERS, RANGE_PRESETS, hasActiveFilters, type RangePreset, type ViewFilters } from './filters';

interface Props {
  filters: ViewFilters;
  onChange: (patch: Partial<ViewFilters>) => void;
  /** Country codes to offer; `null` stands for visits that couldn't be placed. */
  countries: (string | null)[];
}

const CONTROL_CLASS =
  'h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-sm text-content transition focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none';

const UNKNOWN_COUNTRY = 'unknown';

/**
 * Search and filters, in one row above everything they affect. Each control
 * narrows the charts, the forecast, the table and the export alike.
 */
export default function ViewsToolbar({ filters, onChange, countries }: Props) {
  const t = useTranslation();
  const format = useFormat();
  const labels = t.admin.analytics;

  const rangeLabels: Record<RangePreset, string> = {
    '7d': labels.range7d,
    '30d': labels.range30d,
    '90d': labels.range90d,
    all: labels.rangeAll,
    custom: labels.rangeCustom,
  };

  // The selected country stays in the list even when the current result no
  // longer contains it, so the control never shows a blank value.
  const countryValues = countries.map((country) => country ?? UNKNOWN_COUNTRY);
  if (filters.country && !countryValues.includes(filters.country)) {
    countryValues.push(filters.country);
  }

  const chips = [
    filters.product && {
      key: 'product',
      label: labels.focusProduct(filters.product.name),
      clear: () => onChange({ product: null }),
    },
    filters.person && {
      key: 'person',
      label: labels.focusPerson(filters.person.label),
      clear: () => onChange({ person: null }),
    },
  ].filter((chip) => chip !== null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchInput
          value={filters.search}
          onChange={(search) => onChange({ search })}
          placeholder={labels.searchPlaceholder}
          label={labels.searchLabel}
        />

        <select
          value={filters.range}
          onChange={(event) => onChange({ range: event.target.value as RangePreset })}
          aria-label={labels.range}
          className={CONTROL_CLASS}
        >
          {RANGE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {rangeLabels[preset]}
            </option>
          ))}
        </select>

        {filters.range === 'custom' && (
          <>
            <label className="flex items-center gap-2 text-sm text-content-muted">
              {labels.fromDate}
              <input
                type="date"
                value={filters.customFrom}
                max={filters.customTo || undefined}
                onChange={(event) => onChange({ customFrom: event.target.value })}
                className={CONTROL_CLASS}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-content-muted">
              {labels.toDate}
              <input
                type="date"
                value={filters.customTo}
                min={filters.customFrom || undefined}
                onChange={(event) => onChange({ customTo: event.target.value })}
                className={CONTROL_CLASS}
              />
            </label>
          </>
        )}

        <select
          value={filters.country}
          onChange={(event) => onChange({ country: event.target.value })}
          aria-label={labels.country}
          className={CONTROL_CLASS}
        >
          <option value="">{labels.allCountries}</option>
          {countryValues.map((country) => (
            <option key={country} value={country}>
              {country === UNKNOWN_COUNTRY ? labels.unknownCountry : format.country(country)}
            </option>
          ))}
        </select>

        <select
          value={filters.visitor}
          onChange={(event) => onChange({ visitor: event.target.value as ViewFilters['visitor'] })}
          aria-label={labels.visitorFilter}
          className={CONTROL_CLASS}
        >
          <option value="">{labels.allVisitors}</option>
          <option value="signed-in">{labels.signedIn}</option>
          <option value="anonymous">{labels.anonymous}</option>
        </select>

        <select
          value={filters.favorited}
          onChange={(event) => onChange({ favorited: event.target.value as ViewFilters['favorited'] })}
          aria-label={labels.favoriteFilter}
          className={CONTROL_CLASS}
        >
          <option value="">{labels.anyFavorite}</option>
          <option value="true">{labels.favorited}</option>
          <option value="false">{labels.notFavorited}</option>
        </select>

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="h-11 cursor-pointer rounded-md px-3 text-sm font-medium text-content-muted transition hover:bg-surface-hover hover:text-content"
          >
            {labels.clearFilters}
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="flex h-9 items-center gap-2 rounded-full bg-content pr-1.5 pl-4 text-sm font-medium text-content-inverse"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.clear}
                aria-label={labels.clearFocus(chip.label)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full transition hover:bg-content-inverse/20"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
