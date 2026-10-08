import { Crosshair, Minus, Move, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { LocalDesign } from '@/hooks/useDesignFile';
import { useTranslation } from '@/i18n';
import {
  DEFAULT_PLACEMENT,
  PLACEMENT_WIDTH,
  clampPlacement,
  logoOverlayStyle,
  placementStyle,
} from '@/lib/design-placement';
import type { DesignPlacement, StudioConfig } from '@/lib/types';
import GarmentSurface from './GarmentSurface';

interface Props {
  /** Null until a garment is chosen. */
  garment: { name: string; imageUrl: string | null } | null;
  design: LocalDesign | null;
  logo: StudioConfig['logo'] | undefined;
  placement: DesignPlacement;
  onChange: (placement: DesignPlacement) => void;
}

interface Drag {
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  start: DesignPlacement;
  stage: DOMRect;
}

// Keyboard steps, as fractions of the garment photo.
const NUDGE = 0.01;
const BIG_NUDGE = 0.05;
const RESIZE_STEP = 0.02;

const TOOL_BUTTON_CLASS =
  'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-content transition hover:bg-surface-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

const samePlacement = (a: DesignPlacement, b: DesignPlacement) =>
  a.x === b.x && a.y === b.y && a.width === b.width;

/**
 * The editable preview: the garment photo with the shopper's design on it,
 * movable by pointer or keyboard. The store logo is drawn over the design
 * here, in the browser, at the position the server will stamp it.
 */
export default function DesignStage({ garment, design, logo, placement, onChange }: Props) {
  const t = useTranslation();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  // The "drag to move" cue goes away for good once the design has been moved.
  const [hasMoved, setHasMoved] = useState(false);

  // Read by the resize observer below without re-subscribing on every move.
  const latest = useRef({ placement, design, onChange });
  latest.current = { placement, design, onChange };

  function commit(next: DesignPlacement) {
    const surface = surfaceRef.current;
    if (!surface || !design) return;
    onChange(clampPlacement(next, design, surface.getBoundingClientRect()));
  }

  // Brings the current placement back inside the garment if it isn't.
  function reclamp() {
    const surface = surfaceRef.current;
    const current = latest.current;
    if (!surface || !current.design) return;
    const rect = surface.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const clamped = clampPlacement(current.placement, current.design, rect);
    if (!samePlacement(clamped, current.placement)) current.onChange(clamped);
  }

  // The size slider and the "center" button live outside this component and
  // set a placement without knowing the stage's proportions.
  useEffect(reclamp, [placement, design]);

  // A different garment photo (or a rotated phone) changes the stage's
  // proportions, which can leave a placement that used to fit hanging off
  // the edge.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const observer = new ResizeObserver(reclamp);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [garment?.imageUrl]);

  function startDrag(mode: Drag['mode']) {
    return (event: PointerEvent<HTMLElement>) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      event.preventDefault();
      // The resize handle sits inside the movable element.
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setHasMoved(true);
      drag.current = {
        mode,
        startX: event.clientX,
        startY: event.clientY,
        start: placement,
        stage: surface.getBoundingClientRect(),
      };
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const active = drag.current;
    if (!active) return;
    const dx = (event.clientX - active.startX) / active.stage.width;
    const dy = (event.clientY - active.startY) / active.stage.height;

    commit(
      active.mode === 'move'
        ? { ...active.start, x: active.start.x + dx, y: active.start.y + dy }
        : // The design grows from its centre, so the corner travels half as
          // far as the width changes.
          { ...active.start, width: active.start.width + dx * 2 },
    );
  }

  function endDrag() {
    drag.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const step = event.shiftKey ? BIG_NUDGE : NUDGE;
    const moves: Record<string, DesignPlacement> = {
      ArrowLeft: { ...placement, x: placement.x - step },
      ArrowRight: { ...placement, x: placement.x + step },
      ArrowUp: { ...placement, y: placement.y - step },
      ArrowDown: { ...placement, y: placement.y + step },
      '+': { ...placement, width: placement.width + RESIZE_STEP },
      '=': { ...placement, width: placement.width + RESIZE_STEP },
      '-': { ...placement, width: placement.width - RESIZE_STEP },
    };
    const next = moves[event.key];
    if (!next) return;
    // Arrow keys would otherwise scroll the page.
    event.preventDefault();
    setHasMoved(true);
    commit(next);
  }

  if (!garment) {
    return (
      <div className="relative">
        <GarmentSurface garmentImageUrl={null} className="rounded-2xl" />
        <p className="absolute inset-x-0 bottom-8 text-center text-sm font-medium text-content-muted">
          {t.customize.stage.empty}
        </p>
      </div>
    );
  }

  const widthPercent = Math.round(placement.width * 100);

  return (
    <GarmentSurface
      garmentImageUrl={garment.imageUrl}
      alt={t.customize.stage.garmentAlt(garment.name)}
      surfaceRef={surfaceRef}
      className="rounded-2xl"
    >
      {design ? (
        <div
          role="group"
          tabIndex={0}
          aria-label={t.customize.stage.designLabel}
          style={placementStyle(placement)}
          onPointerDown={startDrag('move')}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none outline-1 outline-offset-2 outline-brand outline-dashed focus-visible:outline-2 focus-visible:outline-solid active:cursor-grabbing"
        >
          <img src={design.previewUrl} alt="" draggable={false} className="block h-auto w-full select-none" />
          {logo && (
            <img
              src={logo.url}
              alt=""
              draggable={false}
              style={logoOverlayStyle(design, logo)}
              className="pointer-events-none absolute select-none"
            />
          )}
          {/* Pointer-only: the keyboard resizes with plus and minus, and the
              slider next to the stage does the same for everyone. */}
          <span
            aria-hidden="true"
            onPointerDown={startDrag('resize')}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute -right-3 -bottom-3 size-6 cursor-nwse-resize touch-none rounded-full border-2 border-surface bg-brand shadow-sm"
          />
        </div>
      ) : null}

      {design && (
        // The position and size controls sit on the photo itself, next to
        // what they change. At the top edge: the collar is the one area
        // nobody prints on, so the bar covers the least there.
        <div className="absolute inset-x-3 top-3 flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-sm">
          <button
            type="button"
            aria-label={t.customize.place.smaller}
            title={t.customize.place.smaller}
            disabled={placement.width <= PLACEMENT_WIDTH.min}
            onClick={() => commit({ ...placement, width: placement.width - RESIZE_STEP })}
            className={TOOL_BUTTON_CLASS}
          >
            <Minus aria-hidden="true" size={16} />
          </button>
          <input
            type="range"
            aria-label={t.customize.place.size}
            min={PLACEMENT_WIDTH.min * 100}
            max={PLACEMENT_WIDTH.max * 100}
            value={widthPercent}
            onChange={(event) => commit({ ...placement, width: Number(event.target.value) / 100 })}
            className="min-w-0 flex-1 cursor-pointer accent-brand"
          />
          <button
            type="button"
            aria-label={t.customize.place.larger}
            title={t.customize.place.larger}
            disabled={placement.width >= PLACEMENT_WIDTH.max}
            onClick={() => commit({ ...placement, width: placement.width + RESIZE_STEP })}
            className={TOOL_BUTTON_CLASS}
          >
            <Plus aria-hidden="true" size={16} />
          </button>
          <span className="w-10 shrink-0 text-center text-xs font-semibold tabular-nums text-content">
            {widthPercent}%
          </span>
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
          <button
            type="button"
            aria-label={t.customize.place.center}
            title={t.customize.place.center}
            onClick={() => commit({ ...placement, x: 0.5, y: 0.5 })}
            className={TOOL_BUTTON_CLASS}
          >
            <Crosshair aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      {design && !hasMoved && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-scrim/80 px-3.5 py-2 text-xs font-medium text-scrim-content">
            <Move aria-hidden="true" size={14} />
            {t.customize.stage.dragHint}
          </span>
        </p>
      )}

      {!design && (
        <div
          style={placementStyle(DEFAULT_PLACEMENT)}
          className="absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-2 border-dashed border-scrim-content/70 bg-scrim/25 p-3 text-center text-xs font-medium text-scrim-content"
        >
          {t.customize.stage.placeholder}
        </div>
      )}
    </GarmentSurface>
  );
}
