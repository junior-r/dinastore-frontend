import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/i18n';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import CartButton from './CartButton';
import FavoritesButton from './FavoritesButton';
import NavSearch from './NavSearch';
import UserMenu from './UserMenu';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-border">
      {/* The frosted background is its own layer rather than a class on the
          <header>. `backdrop-filter` makes an element the containing block
          for its `position: fixed` descendants, and SearchOverlay (rendered
          inside this header, not portaled) is exactly that: on the header
          itself, the blur would trap the full-screen overlay in a 64px strip. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-surface/85 backdrop-blur-md" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="/" className="text-xl font-extrabold tracking-tight text-content font-stretch-expanded">
            {t.nav.brand}
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-content-muted sm:flex">
            <a href="/catalog" className="transition-colors hover:text-content">
              {t.nav.catalog}
            </a>
            <a href="/customize" className="transition-colors hover:text-content">
              {t.nav.customize}
            </a>
          </nav>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <NavSearch />
          <LanguageToggle />
          <ThemeToggle />
          <FavoritesButton />
          <CartButton />
          <div className="ml-2">
            <UserMenu />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <CartButton />
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={t.nav.menu}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        // Opaque, unlike the bar above: page content scrolling behind a
        // translucent menu makes its links hard to read.
        <div className="border-t border-border bg-surface px-4 py-4 sm:hidden">
          <NavSearch variant="inline" />

          <nav className="mt-4 flex flex-col gap-3 text-sm font-medium">
            <a href="/catalog" className="text-content" onClick={() => setMobileOpen(false)}>
              {t.nav.catalog}
            </a>
            <a href="/customize" className="text-content" onClick={() => setMobileOpen(false)}>
              {t.nav.customize}
            </a>
          </nav>

          <div className="mt-4 flex items-center gap-1 border-t border-border pt-4">
            <LanguageToggle />
            <ThemeToggle />
            <FavoritesButton />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <UserMenu />
          </div>
        </div>
      )}
    </header>
  );
}
