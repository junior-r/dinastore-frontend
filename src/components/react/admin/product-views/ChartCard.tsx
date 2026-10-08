import { ImageDown, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '@/i18n';

interface Props {
  title: string;
  subtitle?: string;
  /** Omitted when there is nothing drawn to export. */
  onExport?: () => void;
  /** This card's own export is the one running. */
  exporting: boolean;
  /** Any export is running, this card's or another: the button is locked. */
  exportDisabled: boolean;
  className?: string;
  children: ReactNode;
}

/** The frame around one chart: its title, and the button that saves it as a PNG. */
export default function ChartCard({
  title,
  subtitle,
  onExport,
  exporting,
  exportDisabled,
  className = '',
  children,
}: Props) {
  const t = useTranslation();
  const labels = t.admin.analytics;

  return (
    <section className={`rounded-lg border border-border p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-content">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-content-muted">{subtitle}</p>}
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            aria-label={labels.exportPngOf(title)}
            aria-busy={exporting}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-content transition hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <LoaderCircle aria-hidden="true" size={14} className="motion-safe:animate-spin" />
            ) : (
              <ImageDown aria-hidden="true" size={14} />
            )}
            {exporting ? labels.exporting : 'PNG'}
          </button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
