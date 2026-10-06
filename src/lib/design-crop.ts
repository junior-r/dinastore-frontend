import type { DesignCrop } from './types';

export interface Size {
  width: number;
  height: number;
}

/** Which sides of the crop box a drag moves. None means the whole box. */
export interface CropEdges {
  left?: boolean;
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
}

export const FULL_CROP: DesignCrop = { x: 0, y: 0, width: 1, height: 1 };

/** The box can't be dragged thinner than this share of the image. */
const MIN_CROP_SIDE = 0.05;

// The preview drawn in the browser is only looked at, never printed (the
// server crops the original itself), so it doesn't need full resolution.
const PREVIEW_MAX_EDGE_PX = 1600;

const EPSILON = 1e-4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function isFullCrop(crop: DesignCrop): boolean {
  return crop.x < EPSILON && crop.y < EPSILON && crop.width > 1 - EPSILON && crop.height > 1 - EPSILON;
}

/** Slides the box by a fraction of the image, stopping at its edges. */
export function moveCrop(crop: DesignCrop, dx: number, dy: number): DesignCrop {
  return {
    ...crop,
    x: clamp(crop.x + dx, 0, 1 - crop.width),
    y: clamp(crop.y + dy, 0, 1 - crop.height),
  };
}

/** Moves the given sides of the box, keeping it inside the image and at least the minimum size. */
export function resizeCrop(crop: DesignCrop, edges: CropEdges, dx: number, dy: number): DesignCrop {
  let left = crop.x;
  let top = crop.y;
  let right = crop.x + crop.width;
  let bottom = crop.y + crop.height;

  if (edges.left) left = clamp(left + dx, 0, right - MIN_CROP_SIDE);
  if (edges.right) right = clamp(right + dx, left + MIN_CROP_SIDE, 1);
  if (edges.top) top = clamp(top + dy, 0, bottom - MIN_CROP_SIDE);
  if (edges.bottom) bottom = clamp(bottom + dy, top + MIN_CROP_SIDE, 1);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** How many of the image's own pixels the crop keeps. */
export function cropPixelSize(image: Size, crop: DesignCrop): Size {
  return {
    width: Math.max(1, Math.round(crop.width * image.width)),
    height: Math.max(1, Math.round(crop.height * image.height)),
  };
}

/**
 * Draws the cropped part of an image and returns it as an object URL, for the
 * studio's stage. `width`/`height` in the result are the crop's true pixel
 * size (what the print file will have), not the preview's.
 *
 * The caller owns the URL and must revoke it.
 */
export async function renderCropPreview(
  image: Size & { url: string },
  crop: DesignCrop,
): Promise<Size & { url: string }> {
  const element = new Image();
  element.src = image.url;
  await element.decode();

  const pixels = cropPixelSize(image, crop);
  const scale = Math.min(1, PREVIEW_MAX_EDGE_PX / Math.max(pixels.width, pixels.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pixels.width * scale));
  canvas.height = Math.max(1, Math.round(pixels.height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.drawImage(
    element,
    crop.x * element.naturalWidth,
    crop.y * element.naturalHeight,
    crop.width * element.naturalWidth,
    crop.height * element.naturalHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // PNG, so artwork with a transparent background still previews as such.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The preview could not be drawn');
  return { url: URL.createObjectURL(blob), ...pixels };
}
