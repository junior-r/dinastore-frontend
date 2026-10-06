import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/i18n';
import { resolveTheme, useThemeStore, type ThemePreference } from '@/stores/theme-store';

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

export default function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const t = useTranslation();

  useEffect(() => {
    setResolved(resolveTheme(preference));
  }, [preference]);

  const CurrentIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.theme.label}
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <CurrentIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg">
          {OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreference(value);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover ${
                preference === value ? 'text-brand' : 'text-content'
              }`}
            >
              <Icon size={16} />
              {t.theme[value]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
