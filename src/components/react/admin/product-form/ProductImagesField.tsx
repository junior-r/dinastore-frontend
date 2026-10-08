import { ChevronRight, GripVertical, Images, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState, type Dispatch, type DragEvent, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { ProductVariantInput } from '@/lib/api/admin';
import { useUploadProductImages } from '@/lib/queries/admin';
import ImageVariantMatcher from '../ImageVariantMatcher';
import ImageVariantTagControl from './ImageVariantTagControl';
import { ACCEPTED_IMAGE_TYPES, type PendingImage } from './shared';

interface Props {
  images: PendingImage[];
  onChange: Dispatch<SetStateAction<PendingImage[]>>;
  variants: ProductVariantInput[];
}

// The product's photos: upload (click or drop), drag to reorder, delete, and
// say which variants each one is for.
export default function ProductImagesField({ images, onChange, variants }: Props) {
  const t = useTranslation();
  const uploadImages = useUploadProductImages();
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The matcher hands back an image's complete list (empty = every variant),
  // the same shape ImageVariantTagControl writes, so both edit one state.
  function setVariantLinks(imageId: string, variantIndexes: number[]) {
    onChange((current) => current.map((image) => (image.id === imageId ? { ...image, variantIndexes } : image)));
  }

  const uploadedImages = images.filter((image) => image.status === 'done');
  // Limited means "hidden for at least one variant". A list naming every
  // variant shows everywhere, so it doesn't count, however it is stored.
  const limitedCount = uploadedImages.filter(
    (image) => image.variantIndexes.length > 0 && image.variantIndexes.length < variants.length,
  ).length;

  function addFiles(fileList: FileList | File[]) {
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(t.admin.products.rejectedFile(file.name));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) {
      return;
    }

    const drafts = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading' as const,
      variantIndexes: [],
    }));
    onChange((current) => [...current, ...drafts]);

    for (const draft of drafts) {
      // Each file uploads independently and concurrently, so this awaits the
      // promise `mutateAsync` returns for THIS call specifically rather than
      // going through `.mutate()`'s shared onSuccess/onError — those live on
      // the single `uploadImages` observer and get overwritten by whichever
      // call is most recent, silently dropping earlier files' callbacks.
      uploadImages
        .mutateAsync([draft.file])
        .then(([result]) => {
          onChange((current) =>
            current.map((image) => (image.id === draft.id ? { ...image, status: 'done', url: result.url } : image)),
          );
        })
        .catch(() => {
          onChange((current) => current.map((image) => (image.id === draft.id ? { ...image, status: 'error' } : image)));
        });
    }
  }

  function removeImage(id: string) {
    onChange((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== id);
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleThumbDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleThumbDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === index) {
      return;
    }
    onChange((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  function handleThumbDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <span className="block text-sm font-medium text-content">{t.admin.products.images}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-1 flex scale-100 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-3 py-6 text-center transition-all ${
          isDragging ? 'scale-[1.02] border-brand bg-brand/10' : 'border-border hover:border-brand/50'
        }`}
      >
        <UploadCloud className={`size-6 ${isDragging ? 'text-brand' : 'text-content-muted'}`} />
        {isDragging ? (
          <p className="text-sm font-medium text-brand">{t.admin.products.dropToUpload}</p>
        ) : (
          <p className="text-sm text-content">
            <span className="font-medium text-brand">{t.admin.products.clickToBrowse}</span>{' '}
            {t.admin.products.orDragAndDrop}
          </p>
        )}
        <p className="text-xs text-content-muted">{t.admin.products.imageFormats}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }
            event.target.value = '';
          }}
        />
      </div>

      {images.length > 0 && (
        <>
          <p className="mt-3 text-xs text-content-muted">{t.admin.products.imagesHint}</p>
          {variants.length > 0 && uploadedImages.length > 0 && (
            // A full-width row, not a text link: it opens a whole dialog, and
            // the line under the label reports the current state so the form
            // shows whether any image is limited without opening it.
            <button
              type="button"
              onClick={() => setIsMatcherOpen(true)}
              className="group mt-3 flex w-full cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-left transition hover:border-content active:scale-[0.99]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-content">
                <Images size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-content">{t.admin.products.relateButton}</span>
                <span className="block text-xs text-content-muted">
                  {limitedCount === 0
                    ? t.admin.products.relateSummaryAll
                    : t.admin.products.relateSummary(limitedCount, uploadedImages.length)}
                </span>
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-content-muted transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
              />
            </button>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={(event) => handleThumbDragStart(event, index)}
                onDragOver={(event) => handleThumbDragOver(event, index)}
                onDrop={(event) => event.preventDefault()}
                onDragEnd={handleThumbDragEnd}
                className={`group relative aspect-square cursor-grab transition-opacity active:cursor-grabbing ${
                  dragIndex === index ? 'opacity-40' : ''
                }`}
              >
                {/* Clipped to the thumbnail's rounded corners -- kept separate from
                    the outer div so ImageVariantTagControl's popover (a sibling
                    below) isn't clipped by overflow-hidden too. */}
                <div className="absolute inset-0 overflow-hidden rounded-md border border-border">
                  <img
                    src={image.previewUrl}
                    alt=""
                    className="pointer-events-none h-full w-full object-cover"
                    draggable={false}
                  />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-scrim/60 px-1.5 py-0.5 text-[10px] font-medium text-scrim-content">
                      {t.admin.products.cover}
                    </span>
                  )}
                  <div className="pointer-events-none absolute right-1 top-1 rounded bg-scrim/60 p-0.5 text-scrim-content opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical size={14} />
                  </div>
                  {image.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-scrim/40">
                      <Loader2 className="size-5 animate-spin text-scrim-content" />
                    </div>
                  )}
                  {image.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-danger/80 px-1 text-center text-xs font-medium text-scrim-content">
                      {t.admin.products.failed}
                    </div>
                  )}
                  {image.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label={t.admin.products.deleteImage}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-scrim/60 text-scrim-content opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                {image.status === 'done' && (
                  <ImageVariantTagControl
                    variants={variants}
                    variantIndexes={image.variantIndexes}
                    onChange={(indexes) =>
                      onChange((current) =>
                        current.map((img) => (img.id === image.id ? { ...img, variantIndexes: indexes } : img)),
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ImageVariantMatcher
        open={isMatcherOpen}
        onClose={() => setIsMatcherOpen(false)}
        images={uploadedImages}
        variants={variants}
        onChange={setVariantLinks}
      />
    </div>
  );
}
