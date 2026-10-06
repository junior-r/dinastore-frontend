import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { pushOverlay } from '@/hooks/overlay-stack';
import { useTranslation } from '@/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  // `lg` is for forms with side-by-side fields that don't fit the default.
  size?: 'md' | 'lg';
  children: ReactNode;
}

const TRANSITION_MS = 200;

// Whole class strings, not `max-w-${size}`: Tailwind only emits utilities it
// can find literally in the source.
const SIZE_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

// Slide-in panel for admin create/edit forms: backdrop fades in, panel slides
// in from the right. Stays mounted for TRANSITION_MS after `open` goes false
// so the closing animation can play instead of snapping shut.
export default function Sidebar({ open, onClose, title, size = 'md', children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(onClose);
  const t = useTranslation();

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const popOverlay = pushOverlay(onClose);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      popOverlay();
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <div data-overlay-root className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-scrim/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex w-full ${SIZE_CLASSES[size]} flex-col border-l border-border bg-surface shadow-xl transition-transform duration-200 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="text-lg font-extrabold tracking-tight text-content font-stretch-expanded">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover hover:text-content"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
