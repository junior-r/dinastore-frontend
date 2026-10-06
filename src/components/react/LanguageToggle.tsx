import { Languages } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useLocale, useTranslation, LOCALES, LOCALE_LABELS, LOCALE_SHORT } from '@/i18n';
import { useLocaleStore } from '@/stores/locale-store';

export default function LanguageToggle() {
  const locale = useLocale();
  const setLocale = useLocaleStore((state) => state.setLocale);
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.language.label}
        aria-expanded={open}
        className="flex h-9 cursor-pointer items-center gap-1 rounded-md px-2 text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <Languages size={18} />
        <span className="text-xs font-medium">{LOCALE_SHORT[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg">
          {LOCALES.map((value) => (
            <button
              key={value}
              type="button"
              lang={value}
              onClick={() => {
                setLocale(value);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover ${
                locale === value ? 'text-brand' : 'text-content'
              }`}
            >
              <span className="w-6 text-xs font-medium">{LOCALE_SHORT[value]}</span>
              {LOCALE_LABELS[value]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
