import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const BUTTON_CLASS =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-content transition hover:border-content active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40';

// Previous / "Page x of y" / next. Shared by the catalog and every admin list
// so paging looks and behaves the same everywhere. Renders nothing when there
// is only one page.
export default function Pagination({ page, totalPages, onChange }: Props) {
  const t = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-center gap-5 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t.common.previous}
        className={BUTTON_CLASS}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="tabular-nums text-content-muted">{t.common.pageOf(page, totalPages)}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label={t.common.next}
        className={BUTTON_CLASS}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
