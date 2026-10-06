import Modal from './Modal';
import { useTranslation } from '@/i18n';

interface ConfirmPromptProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

// Presentational body shared by the standalone ConfirmDialog below and by
// callers (e.g. AddToCartModal) that need a confirm step inside a dialog they
// already own, without stacking a second overlay on top of the first.
export function ConfirmPrompt({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
}: ConfirmPromptProps) {
  const t = useTranslation();

  return (
    <div>
      <p className="text-sm text-content-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-content hover:bg-surface-hover"
        >
          {cancelLabel ?? t.common.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
            danger
              ? 'bg-danger text-content-inverse hover:opacity-90'
              : 'bg-brand text-brand-content hover:bg-brand-hover'
          }`}
        >
          {confirmLabel ?? t.common.confirm}
        </button>
      </div>
    </div>
  );
}

interface Props extends ConfirmPromptProps {
  open: boolean;
  title: string;
}

export default function ConfirmDialog({ open, title, onCancel, ...prompt }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <ConfirmPrompt onCancel={onCancel} {...prompt} />
    </Modal>
  );
}
