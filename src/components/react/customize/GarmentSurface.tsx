import { Shirt } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  /** The garment photo, or null when the variant has none. */
  garmentImageUrl: string | null;
  alt?: string;
  className?: string;
  /** What goes on top of the garment, positioned by the caller. */
  children?: ReactNode;
  /** Ref to the box placements are measured against. */
  surfaceRef?: React.Ref<HTMLDivElement>;
}

/**
 * A garment photo with a layer on top for the design.
 *
 * Placements are fractions of the photo, so the layer has to be exactly the
 * photo's box. That is what the inner wrapper is: the photo sets its height
 * (`h-auto`), and anything absolutely positioned inside resolves its
 * percentages against it. The outer element only clips and rounds.
 */
export default function GarmentSurface({ garmentImageUrl, alt = '', className = '', children, surfaceRef }: Props) {
  return (
    <div className={`overflow-hidden bg-surface-muted ${className}`}>
      <div ref={surfaceRef} className="relative w-full">
        {garmentImageUrl ? (
          <img src={garmentImageUrl} alt={alt} draggable={false} className="block h-auto w-full select-none" />
        ) : (
          // No photo to place on: a neutral stand-in with the same role.
          <div className="flex aspect-[4/5] w-full items-center justify-center text-content-muted/40">
            <Shirt aria-hidden="true" className="size-1/3" strokeWidth={1} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
