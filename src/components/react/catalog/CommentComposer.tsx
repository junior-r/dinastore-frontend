import { ImagePlus, X } from 'lucide-react';
import { useRef, useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { useImageAttachment } from '@/hooks/useImageAttachment';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/image-compress';
import { useTranslation } from '@/i18n';

export interface CommentDraft {
  body: string;
  image: File | null;
}

interface Props {
  placeholder: string;
  label: string;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  /** The reply form is the same composer, just tighter and cancellable. */
  compact?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  /** Call `reset` once the comment is saved to empty the form. */
  onSubmit: (draft: CommentDraft, reset: () => void) => void;
}

/**
 * Text box plus one optional image, shared by the new-comment form and every
 * reply form. The whole form is the drop target, so an image can be dragged
 * anywhere onto it; the button next to Submit is the same action for keyboard
 * and touch users, who can't drag.
 */
export default function CommentComposer({
  placeholder,
  label,
  submitLabel,
  pendingLabel,
  pending,
  compact = false,
  autoFocus = false,
  onCancel,
  onSubmit,
}: Props) {
  const t = useTranslation();
  const [body, setBody] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const image = useImageAttachment({
    onError: (error) =>
      toast.error(error === 'type' ? t.comments.imageInvalidType : t.comments.imageTooLarge),
    onExtraIgnored: () => toast.info(t.comments.imageOnlyOne),
  });

  const canSubmit = Boolean(body.trim()) && !pending && !image.isPreparing;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || image.isPreparing) return;
    onSubmit({ body: trimmed, image: image.file }, () => {
      setBody('');
      image.clear();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      {...image.dropHandlers}
      className={`relative ${compact ? 'mt-3' : 'mt-6'}`}
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={1000}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        className={`w-full resize-none rounded-md border border-border bg-surface text-sm text-content focus:border-brand focus:outline-none ${compact ? 'p-2' : 'p-3'}`}
      />

      {image.previewUrl && (
        <div className="relative mt-2 w-fit">
          <img
            src={image.previewUrl}
            alt={t.comments.imagePreviewAlt}
            className={`h-24 w-auto max-w-full rounded-md border border-border object-cover ${image.isPreparing ? 'opacity-50' : ''}`}
          />
          <button
            type="button"
            aria-label={t.comments.removeImage}
            onClick={image.clear}
            className="absolute -top-2 -right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-content-muted hover:text-danger"
          >
            <X size={14} />
          </button>
          {image.isPreparing && (
            <span role="status" className="mt-1 block text-xs text-content-muted">
              {t.comments.imagePreparing}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`cursor-pointer rounded-md bg-brand font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {pending ? pendingLabel : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-content-muted hover:text-content"
          >
            {t.common.cancel}
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-content-muted hover:bg-surface-muted hover:text-content"
        >
          <ImagePlus size={16} />
          {image.previewUrl ? t.comments.replaceImage : t.comments.attachImage}
        </button>
        {!image.previewUrl && !compact && (
          <span className="hidden text-xs text-content-muted sm:inline">
            {t.comments.dragHint}
          </span>
        )}

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void image.attach(event.target.files);
            // Reset so picking the same file again after removing it still
            // fires a change event.
            event.target.value = '';
          }}
        />
      </div>

      {image.isDragging && (
        // pointer-events-none: the overlay must not become the drag target
        // itself, or entering it would count as leaving the form.
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-brand bg-surface/90 text-sm font-medium text-brand">
          {t.comments.dropHint}
        </div>
      )}
    </form>
  );
}
