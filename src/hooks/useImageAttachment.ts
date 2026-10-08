import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  compressImage,
} from '../lib/image-compress';
import { useFileDrop } from './useFileDrop';

export type ImageAttachmentError = 'type' | 'size';

interface Options {
  onError: (error: ImageAttachmentError) => void;
  /** More than one file was offered at once; only the first was taken. */
  onExtraIgnored: () => void;
}

/**
 * A single optional image attached to a form, set either by dropping a file
 * onto the element the `dropHandlers` are spread on or by passing a FileList
 * from an `<input type="file">` to `attach`.
 *
 * "At most one" is structural rather than checked: there is one slot, and
 * attaching again replaces what was in it.
 */
export function useImageAttachment({ onError, onExtraIgnored }: Options) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  // Identifies the latest attach() call, so a slow compression of an image
  // that has since been replaced or removed can't overwrite the newer state.
  const attachId = useRef(0);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clear = useCallback(() => {
    attachId.current += 1;
    setFile(null);
    setPreviewUrl(null);
    setIsPreparing(false);
  }, []);

  const attach = useCallback(
    async (files: FileList | File[] | null) => {
      const candidates = Array.from(files ?? []);
      if (candidates.length === 0) return;

      const picked = candidates[0];
      if (!ACCEPTED_IMAGE_TYPES.includes(picked.type)) {
        onError('type');
        return;
      }
      if (candidates.length > 1) {
        onExtraIgnored();
      }

      const id = (attachId.current += 1);
      // Preview straight away from the original; the optimized copy that is
      // actually uploaded replaces it in state once it is ready.
      setPreviewUrl(URL.createObjectURL(picked));
      setFile(null);
      setIsPreparing(true);

      const prepared = await compressImage(picked);
      if (id !== attachId.current) return;

      if (prepared.size > MAX_IMAGE_UPLOAD_BYTES) {
        onError('size');
        clear();
        return;
      }
      setFile(prepared);
      setIsPreparing(false);
    },
    [clear, onError, onExtraIgnored],
  );

  const { isDragging, dropHandlers } = useFileDrop((files) => void attach(files));

  return { file, previewUrl, isPreparing, isDragging, attach, clear, dropHandlers };
}
