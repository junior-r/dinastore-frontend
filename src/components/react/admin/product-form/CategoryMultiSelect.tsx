import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import type { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CategoryMultiSelect({ categories, selectedIds, onChange }: Props) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const selected = categories.filter((category) => selectedIds.includes(category.id));
  const filtered = categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase()));

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mt-1 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-left text-sm text-content focus:border-brand focus:outline-none"
      >
        {selected.length === 0 ? (
          <span className="text-content-muted">{t.admin.products.selectCategories}</span>
        ) : (
          t.admin.products.selectedCount(selected.length)
        )}
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((category) => (
            <span
              key={category.id}
              className="flex items-center gap-1 rounded-full border border-brand bg-brand px-3 py-1 text-sm text-brand-content"
            >
              {category.name}
              <button
                type="button"
                onClick={() => toggle(category.id)}
                aria-label={t.admin.products.removeCategory(category.name)}
                className="cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.admin.products.searchCategories}
              aria-label={t.admin.products.searchCategories}
              className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-2 text-sm text-content focus:border-brand focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-2 py-2 text-sm text-content-muted">{t.admin.products.noCategoryMatches}</p>}
            {filtered.map((category) => {
              const isSelected = selectedIds.includes(category.id);
              return (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-content hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(category.id)}
                    className="rounded border-border"
                  />
                  {category.name}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
