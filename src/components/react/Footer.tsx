import { useTranslation } from '@/i18n';

// A React island rather than an Astro component for the same reason HomeView
// is one: Astro-rendered text is stuck in the server's locale, and this has to
// follow the language switcher.
export default function Footer() {
  const t = useTranslation();

  const links = [
    { href: '/catalog', label: t.nav.catalog },
    { href: '/account', label: t.nav.account },
    { href: '/orders', label: t.nav.orders },
  ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="/" className="text-2xl font-extrabold tracking-tight text-content font-stretch-expanded">
            {t.nav.brand}
          </a>
          <p className="mt-2 max-w-xs text-sm text-content-muted">{t.home.heading}</p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-content-muted">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-content">
                {link.label}
              </a>
            ))}
          </nav>
          <p className="text-xs text-content-muted">{t.footer.rights(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}
