import { useLocale } from '../i18n';

const INTL_LOCALES: Record<string, string> = { en: 'en-US', es: 'es-ES' };

export function formatMoney(cents: number, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale] ?? 'en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Money and dates formatted for the active locale — Spanish renders
 * "25,00 US$" and "30/9/2026" where English renders "$25.00" and "9/30/2026".
 * Returned as a bundle so a component needs one hook rather than three.
 */
export function useFormat() {
  const locale = useLocale();
  const intlLocale = INTL_LOCALES[locale] ?? 'en-US';

  return {
    money: (cents: number, currency: string) => formatMoney(cents, currency, locale),
    date: (value: string | Date) => new Date(value).toLocaleDateString(intlLocale),
    dateTime: (value: string | Date) => new Date(value).toLocaleString(intlLocale),
    duration: formatDuration,
    // The country's name in the active language, from its ISO code ("VE" is
    // "Venezuela"). Falls back to the code itself if the browser has no name
    // for it, so an unusual code is still shown rather than dropped.
    country: (code: string) => {
      try {
        return new Intl.DisplayNames([intlLocale], { type: 'region' }).of(code) ?? code;
      } catch {
        return code;
      }
    },
  };
}

/**
 * A length of time as a person would say it, at the precision that is useful
 * for its size: "42 s", "3 min 05 s", "1 h 12 min". The unit symbols are the
 * international ones, which read the same in English and Spanish.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${String(seconds).padStart(2, '0')} s`;
  }
  return `${seconds} s`;
}
