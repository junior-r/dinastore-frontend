import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useCategories } from '@/lib/queries/products';

interface Props {
  selectedCategoryIds: string[];
  onChange: (categoryIds: string[]) => void;
}

export default function CategoryFilter({ selectedCategoryIds, onChange }: Props) {
  const { data: categories, isLoading, isError } = useCategories();
  const t = useTranslation();

  if (isLoading || isError || !categories || categories.length === 0) {
    return null;
  }

  function toggle(categoryId: string) {
    onChange(
      selectedCategoryIds.includes(categoryId)
        ? selectedCategoryIds.filter((id) => id !== categoryId)
        : [...selectedCategoryIds, categoryId],
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t.catalog.filterByCategory}>
      {categories.map((category) => {
        const selected = selectedCategoryIds.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(category.id)}
            className={
              selected
                ? 'flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-content bg-content px-4 text-sm font-medium text-content-inverse transition active:scale-[0.98]'
                : 'flex h-9 cursor-pointer items-center rounded-full border border-border px-4 text-sm font-medium text-content transition hover:border-content active:scale-[0.98]'
            }
          >
            {selected && <Check size={14} />}
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
