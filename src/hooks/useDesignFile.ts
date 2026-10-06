import { useCallback, useEffect, useRef, useState } from 'react';
import { renderCropPreview } from '@/lib/design-crop';
import { useUploadDesign } from '@/lib/queries/customizations';
import type { Design, DesignCrop, StudioConfig } from '@/lib/types';

export type DesignFileError = 'type' | 'size' | 'tooSmall' | 'unreadable';

/** The artwork as the shopper's browser holds it, before and after upload. */
export interface LocalDesign {
  fileName: string;
  /** Object URL of what the stage draws: the file, or its cropped part. */
  previewUrl: string;
  /** Pixel size of that part, which is what the print file will have. */
  width: number;
  height: number;
  /** Set once the server has accepted and stored it. */
  uploaded: Design | null;
  /** The whole chosen file. The crop tool always starts from this. */
  original: { url: string; width: number; height: number };
  /** The part of the original in use. Null means all of it. */
  crop: DesignCrop | null;
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('unreadable'));
    image.src = url;
  });
}

/**
 * The one design being placed in the studio: checks a chosen file against the
 * server's own limits (so an obviously unusable file never leaves the
 * machine), shows it immediately from a local URL, and uploads it.
 */
export function useDesignFile(config: StudioConfig | undefined, onError: (error: DesignFileError) => void) {
  const [design, setDesign] = useState<LocalDesign | null>(null);
  const upload = useUploadDesign();
  const { mutateAsync } = upload;

  // The chosen file itself. Cropping uploads it again with a different crop,
  // so the server always cuts from the original, never from a preview.
  const file = useRef<File | null>(null);
  // Identifies the latest choose()/applyCrop() call, so a slow upload that
  // has since been superseded can't overwrite the newer state.
  const operationId = useRef(0);

  const originalUrl = design?.original.url;
  const previewUrl = design?.previewUrl;
  useEffect(() => {
    if (!originalUrl) return;
    return () => URL.revokeObjectURL(originalUrl);
  }, [originalUrl]);
  useEffect(() => {
    // An uncropped design previews straight from the original's URL, which
    // the effect above owns.
    if (!previewUrl || previewUrl === originalUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl, originalUrl]);

  const clear = useCallback(() => {
    operationId.current += 1;
    file.current = null;
    setDesign(null);
  }, []);

  const choose = useCallback(
    async (files: FileList | null) => {
      const chosen = files?.[0];
      if (!chosen || !config) return;

      if (!config.upload.acceptedTypes.includes(chosen.type)) {
        onError('type');
        return;
      }
      if (chosen.size > config.upload.maxBytes) {
        onError('size');
        return;
      }

      const id = (operationId.current += 1);
      const url = URL.createObjectURL(chosen);

      let size: { width: number; height: number };
      try {
        size = await readImageSize(url);
      } catch {
        URL.revokeObjectURL(url);
        if (id === operationId.current) onError('unreadable');
        return;
      }
      if (id !== operationId.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (Math.max(size.width, size.height) < config.upload.minEdgePx) {
        URL.revokeObjectURL(url);
        onError('tooSmall');
        return;
      }

      const local: LocalDesign = {
        fileName: chosen.name,
        previewUrl: url,
        ...size,
        uploaded: null,
        original: { url, ...size },
        crop: null,
      };
      file.current = chosen;
      setDesign(local);

      try {
        const uploaded = await mutateAsync({ file: chosen });
        if (id === operationId.current) setDesign({ ...local, uploaded });
      } catch {
        // The mutation already told the shopper why. Nothing usable is left,
        // so the slot empties rather than showing a design that can't be bought.
        if (id === operationId.current) setDesign(null);
      }
    },
    [config, mutateAsync, onError],
  );

  /**
   * Keeps only part of the chosen file (null: all of it again). The design on
   * screen stays as it was until the server has stored the new one, so a
   * failed upload leaves the previous, still valid, design in place.
   */
  const applyCrop = useCallback(
    async (crop: DesignCrop | null) => {
      const current = design;
      const chosen = file.current;
      if (!current || !chosen) return;

      const id = (operationId.current += 1);
      const preview = crop ? await renderCropPreview(current.original, crop) : current.original;
      const discard = () => {
        if (preview.url !== current.original.url) URL.revokeObjectURL(preview.url);
      };

      try {
        const uploaded = await mutateAsync({ file: chosen, crop });
        if (id !== operationId.current) {
          discard();
          return;
        }
        setDesign({
          ...current,
          previewUrl: preview.url,
          width: preview.width,
          height: preview.height,
          crop,
          uploaded,
        });
      } catch {
        discard();
      }
    },
    [design, mutateAsync],
  );

  return { design, isUploading: upload.isPending, choose, clear, applyCrop };
}
