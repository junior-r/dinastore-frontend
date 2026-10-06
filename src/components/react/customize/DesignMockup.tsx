import { placementStyle } from '@/lib/design-placement';
import type { DesignPlacement } from '@/lib/types';
import GarmentSurface from './GarmentSurface';

interface Props {
  garmentImageUrl: string | null;
  /** A preview that already carries the store logo (the API's thumbnail). */
  designUrl: string;
  placement: DesignPlacement;
  alt?: string;
  className?: string;
}

/**
 * A finished design on its garment, not editable. Used wherever a customized
 * item is shown after the studio: cart, checkout, orders, the admin list.
 */
export default function DesignMockup({ garmentImageUrl, designUrl, placement, alt, className }: Props) {
  return (
    <GarmentSurface garmentImageUrl={garmentImageUrl} alt={alt} className={className}>
      <img
        src={designUrl}
        alt=""
        loading="lazy"
        style={placementStyle(placement)}
        className="pointer-events-none absolute h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </GarmentSurface>
  );
}
