import type { DesignPlacement, StudioConfig } from './types';

/**
 * Narrowest and widest a design may be, as a share of the garment photo.
 * The API refuses anything outside it (PLACEMENT_WIDTH in the backend's
 * orders/domain/design-placement.ts). Keep the two equal.
 */
export const PLACEMENT_WIDTH = { min: 0.1, max: 0.9 } as const;

/** Chest height, a comfortable print size: where a new design starts. */
export const DEFAULT_PLACEMENT: DesignPlacement = { x: 0.5, y: 0.4, width: 0.35 };

export interface Size {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Keeps a placement legal and the whole design on the garment photo.
 *
 * `design` and `stage` are pixel sizes (the artwork's own, and the photo as
 * displayed); only their proportions matter. A design too tall to fit at the
 * requested width is centred vertically rather than pushed off one edge.
 */
export function clampPlacement(placement: DesignPlacement, design: Size, stage: Size): DesignPlacement {
  const width = clamp(placement.width, PLACEMENT_WIDTH.min, PLACEMENT_WIDTH.max);
  // The design's height as a share of the stage's height.
  const height = (width * stage.width * (design.height / design.width)) / stage.height;

  return {
    width,
    x: clamp(placement.x, width / 2, 1 - width / 2),
    y: height >= 1 ? 0.5 : clamp(placement.y, height / 2, 1 - height / 2),
  };
}

/**
 * Where the store logo sits on a design, as CSS percentages of the design's
 * box. The same arithmetic the server uses to stamp the print file
 * (`logoBox` in the backend's design-policy), fed with the numbers it serves,
 * so the preview matches the print.
 */
export function logoOverlayStyle(design: Size, logo: StudioConfig['logo']) {
  const aspect = logo.width / logo.height;

  let width = design.width * logo.widthRatio;
  let height = width / aspect;
  const maxHeight = design.height * logo.maxHeightRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  const margin = Math.min(design.width, design.height) * logo.marginRatio;

  const percent = (value: number, of: number) => `${(value / of) * 100}%`;
  return {
    width: percent(width, design.width),
    height: percent(height, design.height),
    right: percent(margin, design.width),
    bottom: percent(margin, design.height),
  };
}

/** Inline style that puts a design on its garment photo. */
export function placementStyle(placement: DesignPlacement) {
  return {
    left: `${placement.x * 100}%`,
    top: `${placement.y * 100}%`,
    width: `${placement.width * 100}%`,
  };
}
