import { Search } from 'lucide-react';
import { useState } from 'react';
import SearchOverlay from './SearchOverlay';
import { useTranslation } from '@/i18n';

// Inline: an always-visible search trigger, used in the mobile menu where
// there's no room constraint. Icon: a search button in the desktop icon
// cluster alongside FavoritesButton/CartButton. Both open the same full-screen
// SearchOverlay.
export default function NavSearch({ variant = 'icon' }: { variant?: 'icon' | 'inline' }) {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  if (variant === 'inline') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-content-muted hover:bg-surface-hover"
        >
          <Search size={16} />
          {t.nav.searchProducts}
        </button>
        <SearchOverlay open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.search}
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <Search size={18} />
      </button>
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
