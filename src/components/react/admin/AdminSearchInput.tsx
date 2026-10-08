import { Search, X } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  // The accessible name. The placeholder disappears as soon as someone types,
  // so it can't be the only thing naming the field.
  label: string;
}

export default function AdminSearchInput({ value, onChange, placeholder, label }: Props) {
  const t = useTranslation();

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-muted" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-md border border-border bg-surface pr-10 pl-10 text-sm text-content transition placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t.search.clearSearch}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-content-muted hover:bg-surface-hover hover:text-content"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
