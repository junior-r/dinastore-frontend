import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@/hooks/useClickOutside';
import { pushOverlay } from '@/hooks/overlay-stack';
import { useTranslation } from '@/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

// Generic centered dialog: dimmed + blurred backdrop, closes on Escape or a
// click outside the dialog box, and locks page scroll while open.
export default function Modal({ open, onClose, title, children, className }: Props) {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  const t = useTranslation();

  useEffect(() => {
    if (!open) {
      return;
    }
    const popOverlay = pushOverlay(onClose);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      popOverlay();
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  // Portaled to <body> rather than rendered in place: a `fixed` element
  // nested inside an ancestor with an active `translate`/`transform` (e.g.
  // Sidebar's sliding panel) is contained by that ancestor instead of the
  // viewport, per the CSS Transforms spec — see Sidebar.tsx.
  return createPortal(
    <div
      data-overlay-root
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-4 backdrop-blur-sm"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl ${className ?? ''}`}
      >
        <div className="flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-content">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="ml-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
