import { Check, Crop, ImageUp, LoaderCircle, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import type { LocalDesign } from '@/hooks/useDesignFile';
import { useFileDrop } from '@/hooks/useFileDrop';
import { useTranslation } from '@/i18n';
import type { StudioConfig } from '@/lib/types';

interface Props {
  config: StudioConfig;
  design: LocalDesign | null;
  isUploading: boolean;
  onChoose: (files: FileList | null) => void;
  onClear: () => void;
  /** Opens the crop tool for the current design. */
  onCrop: () => void;
}

const BYTES_PER_MB = 1024 * 1024;

/** Step two of the studio: the drop zone, then the chosen file and its state. */
export default function DesignUploader({ config, design, isUploading, onChoose, onClear, onCrop }: Props) {
  const t = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDragging, dropHandlers } = useFileDrop(onChoose);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={config.upload.acceptedTypes.join(',')}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        onChoose(event.target.files);
        // Lets the same file be picked again after it was removed.
        event.target.value = '';
      }}
    />
  );

  if (design) {
    return (
      <div {...dropHandlers} className="flex items-center gap-4 rounded-lg border border-border p-3">
        {input}
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
          <img src={design.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-content">{design.fileName}</p>
          <p className="text-xs text-content-muted">{t.customize.upload.dimensions(design.width, design.height)}</p>
          {/* aria-live so the switch from uploading to ready is announced. */}
          <p aria-live="polite" className="mt-1 flex items-center gap-1.5 text-xs font-medium">
            {isUploading || !design.uploaded ? (
              <span className="flex items-center gap-1.5 text-content-muted">
                <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
                {t.customize.upload.uploading}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-success">
                <Check aria-hidden="true" size={14} />
                {t.customize.upload.ready}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          <button
            type="button"
            // Not while an upload is running: the crop would race it.
            disabled={isUploading || !design.uploaded}
            onClick={onCrop}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-content transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Crop aria-hidden="true" size={15} />
            {t.customize.crop.button}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-content transition hover:bg-surface-hover"
          >
            {t.customize.upload.replace}
          </button>
          <button
            type="button"
            onClick={onClear}
            aria-label={t.customize.upload.remove}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div {...dropHandlers}>
      {input}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-6 py-9 text-center transition ${
          isDragging ? 'border-brand bg-surface-muted' : 'border-border hover:border-content'
        }`}
      >
        <ImageUp aria-hidden="true" size={28} strokeWidth={1.5} className="text-content-muted" />
        <span className="mt-3 text-sm font-semibold text-content">
          {isDragging ? t.customize.upload.dropActive : t.customize.upload.dropTitle}
        </span>
        <span className="mt-1 text-sm text-content-muted">{t.customize.upload.dropHint}</span>
        <span className="mt-4 text-xs text-content-muted">
          {t.customize.upload.formats(Math.floor(config.upload.maxBytes / BYTES_PER_MB), config.upload.minEdgePx)}
        </span>
      </button>
      <p className="mt-2 text-xs text-content-muted">{t.customize.upload.transparentTip}</p>
    </div>
  );
}
