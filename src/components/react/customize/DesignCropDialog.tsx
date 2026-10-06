import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from '@/i18n';
import {
  FULL_CROP,
  cropPixelSize,
  isFullCrop,
  moveCrop,
  resizeCrop,
  type CropEdges,
} from '@/lib/design-crop';
import type { DesignCrop } from '@/lib/types';
import Modal from '../ui/Modal';

interface Props {
  open: boolean;
  /** The whole chosen file. */
  image: { url: string; width: number; height: number };
  /** The crop currently in use, to start from. Null for none. */
  initial: DesignCrop | null;
  /** The longest side, in pixels, the kept part must still have. */
  minEdgePx: number;
  onCancel: () => void;
  /** Null when the whole image was kept. */
  onApply: (crop: DesignCrop | null) => void;
}

interface Drag {
  /** Null drags the whole box. */
  edges: CropEdges | null;
  startX: number;
  startY: number;
  start: DesignCrop;
  frame: DOMRect;
}

// Keyboard steps, as fractions of the image.
const STEP = 0.01;
const BIG_STEP = 0.05;

// Everything outside the box is dimmed by one oversized shadow, on a layer of
// its own that is clipped to the image. The box itself must not be clipped:
// its handles hang over the image's edge when the crop touches it.
const DIM_OUTSIDE = '0 0 0 9999px color-mix(in srgb, var(--color-scrim) 65%, transparent)';

// An edge can be grabbed anywhere along its length: each is an invisible
// strip straddling the outline. Corners come after the edges so they sit on
// top where the two overlap. Whole class strings, because Tailwind only emits
// what it can read literally.
const EDGES: { key: string; edges: CropEdges; className: string }[] = [
  { key: 'n', edges: { top: true }, className: 'inset-x-0 -top-2 h-4 cursor-ns-resize' },
  { key: 's', edges: { bottom: true }, className: 'inset-x-0 -bottom-2 h-4 cursor-ns-resize' },
  { key: 'w', edges: { left: true }, className: 'inset-y-0 -left-2 w-4 cursor-ew-resize' },
  { key: 'e', edges: { right: true }, className: 'inset-y-0 -right-2 w-4 cursor-ew-resize' },
];

const CORNERS: { key: string; edges: CropEdges; className: string }[] = [
  { key: 'nw', edges: { left: true, top: true }, className: '-top-2.5 -left-2.5 cursor-nwse-resize' },
  { key: 'ne', edges: { right: true, top: true }, className: '-top-2.5 -right-2.5 cursor-nesw-resize' },
  { key: 'se', edges: { right: true, bottom: true }, className: '-right-2.5 -bottom-2.5 cursor-nwse-resize' },
  { key: 'sw', edges: { left: true, bottom: true }, className: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
];

const percent = (fraction: number) => `${fraction * 100}%`;

/** Lets the shopper keep only part of the artwork they uploaded. */
export default function DesignCropDialog({ open, image, initial, minEdgePx, onCancel, onApply }: Props) {
  const t = useTranslation();
  const [crop, setCrop] = useState<DesignCrop>(initial ?? FULL_CROP);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  // Start from the crop in use each time the dialog opens. Keyed on `open`
  // alone: sharing an effect with anything that changes while the dialog is
  // open would throw away the shopper's adjustments mid-edit.
  useEffect(() => {
    if (open) setCrop(initial ?? FULL_CROP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function startDrag(edges: CropEdges | null) {
    return (event: PointerEvent<HTMLElement>) => {
      const frame = frameRef.current;
      if (!frame) return;
      event.preventDefault();
      // The handles sit inside the box, which is itself draggable.
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        edges,
        startX: event.clientX,
        startY: event.clientY,
        start: crop,
        frame: frame.getBoundingClientRect(),
      };
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const active = drag.current;
    if (!active) return;
    const dx = (event.clientX - active.startX) / active.frame.width;
    const dy = (event.clientY - active.startY) / active.frame.height;
    setCrop(active.edges ? resizeCrop(active.start, active.edges, dx, dy) : moveCrop(active.start, dx, dy));
  }

  function endDrag() {
    drag.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    // Arrow keys would otherwise scroll the dialog.
    event.preventDefault();

    const step = event.altKey ? BIG_STEP : STEP;
    const [dx, dy] = [direction[0] * step, direction[1] * step];
    // Shift resizes from the bottom-right corner; without it the box moves.
    setCrop((current) =>
      event.shiftKey ? resizeCrop(current, { right: true, bottom: true }, dx, dy) : moveCrop(current, dx, dy),
    );
  }

  const pixels = cropPixelSize(image, crop);
  const tooSmall = Math.max(pixels.width, pixels.height) < minEdgePx;
  const full = isFullCrop(crop);

  return (
    <Modal open={open} onClose={onCancel} title={t.customize.crop.title} className="max-w-2xl!">
      <p className="text-sm text-content-muted">{t.customize.crop.hint}</p>

      <div className="mt-4 flex justify-center rounded-lg bg-surface-muted p-4">
        <div ref={frameRef} className="relative inline-block touch-none select-none">
          <img src={image.url} alt="" draggable={false} className="block max-h-[50dvh] max-w-full" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute"
              style={{
                left: percent(crop.x),
                top: percent(crop.y),
                width: percent(crop.width),
                height: percent(crop.height),
                boxShadow: DIM_OUTSIDE,
              }}
            />
          </div>
          <div
            role="group"
            tabIndex={0}
            aria-label={t.customize.crop.boxLabel}
            style={{
              left: percent(crop.x),
              top: percent(crop.y),
              width: percent(crop.width),
              height: percent(crop.height),
            }}
            onPointerDown={startDrag(null)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            className="absolute cursor-move outline-2 outline-scrim-content focus-visible:outline-brand"
          >
            {EDGES.map((edge) => (
              <span
                key={edge.key}
                aria-hidden="true"
                onPointerDown={startDrag(edge.edges)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`absolute ${edge.className}`}
              />
            ))}
            {CORNERS.map((corner) => (
              <span
                key={corner.key}
                aria-hidden="true"
                onPointerDown={startDrag(corner.edges)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`absolute size-5 rounded-full border-2 border-scrim bg-scrim-content ${corner.className}`}
              />
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-3 min-h-10 text-sm">
        <span className="font-medium tabular-nums text-content">
          {t.customize.upload.dimensions(pixels.width, pixels.height)}
        </span>
        {tooSmall && <span className="mt-0.5 block text-danger">{t.customize.crop.tooSmall(minEdgePx)}</span>}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={full}
          onClick={() => setCrop(FULL_CROP)}
          className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-content transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.customize.crop.reset}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 cursor-pointer rounded-md border border-border px-4 text-sm font-medium text-content transition hover:border-content"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={tooSmall}
            onClick={() => onApply(full ? null : crop)}
            className="h-10 cursor-pointer rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.customize.crop.apply}
          </button>
        </div>
      </div>
    </Modal>
  );
}
