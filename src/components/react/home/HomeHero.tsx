import { ArrowRight } from 'lucide-react';
import { usePointerEffect } from '@/hooks/usePointerEffect';
import { useTranslation } from '@/i18n';
import { riseIndex } from '@/lib/motion';
import { usePrefetchProduct } from '@/lib/queries/products';
import type { Product } from '@/lib/types';

interface Props {
  // Up to three products that have a cover image, newest first.
  featured: Product[];
  isLoading: boolean;
}

interface TileProps {
  product: Product;
  className: string;
  // Position in the collage: sets both the entrance stagger and where in its
  // cycle the idle float starts, so the tiles don't bob in unison.
  index: number;
  priority?: boolean;
}

function FeaturedTile({ product, className, index, priority = false }: TileProps) {
  const prefetchProduct = usePrefetchProduct();
  const image = product.images[0];

  return (
    // Two elements because two animations: the wrapper floats forever, the
    // link plays its entrance once. On one element the second `animation`
    // declaration would simply replace the first.
    <div className={`animate-float relative ${className}`} style={riseIndex(index)}>
      <a
        href={`/catalog/${product.slug}`}
        onMouseEnter={() => prefetchProduct(product.slug)}
        onFocus={() => prefetchProduct(product.slug)}
        style={riseIndex(index + 2)}
        className="animate-rise group absolute inset-0 block overflow-hidden rounded-2xl bg-surface-muted shadow-xl shadow-content/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {/* The product name is the image's alt text, which is also what names
            the link: there is deliberately no caption over the photo. */}
        <img
          src={image.url}
          alt={image.altText ?? product.name}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
        />
      </a>
    </div>
  );
}

// Same footprint as the real collage, so the text column doesn't jump
// sideways when the products arrive.
function CollageSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-5 gap-3 sm:gap-4 lg:col-span-5" aria-hidden="true">
      <div className="col-span-3 rounded-2xl bg-surface-muted" />
      <div className="col-span-2 flex flex-col gap-3 pt-10 sm:gap-4">
        <div className="aspect-square rounded-2xl bg-surface-muted" />
        <div className="aspect-[4/5] rounded-2xl bg-surface-muted" />
      </div>
    </div>
  );
}

interface CollageProps {
  lead: Product;
  rest: Product[];
  label: string;
}

// Its own component, not inline in HomeHero, because of the pointer hook: the
// collage only exists once the products have loaded, and usePointerEffect
// attaches its listeners on mount. Mounted here, the element is there when
// that happens. Inline, the hook would run while the ref was still empty and
// never attach.
function FeaturedCollage({ lead, rest, label }: CollageProps) {
  const collageRef = usePointerEffect<HTMLDivElement>('tilt');

  return (
    <div
      ref={collageRef}
      role="group"
      aria-label={label}
      // Leans a few degrees toward the pointer. --tilt-x/--tilt-y come from
      // usePointerEffect and default to 0 (flat), which is also what touch
      // devices and reduced-motion visitors always get.
      className="grid grid-cols-5 gap-3 transition-transform duration-500 ease-out-expo [transform:perspective(1200px)_rotateX(calc(var(--tilt-y,0)*-4deg))_rotateY(calc(var(--tilt-x,0)*5deg))] sm:gap-4 lg:col-span-5"
    >
      {rest.length === 0 ? (
        <FeaturedTile product={lead} className="col-span-5 aspect-[4/5]" index={0} priority />
      ) : (
        <>
          {/* No aspect ratio on the lead tile: it stretches to the height of
              the offset column beside it, so the two bottoms line up whatever
              the column adds up to. */}
          <FeaturedTile product={lead} className="col-span-3 min-h-80" index={0} priority />
          <div className="col-span-2 flex flex-col gap-3 pt-10 sm:gap-4">
            {rest.map((product, index) => (
              <FeaturedTile
                key={product.id}
                product={product}
                className={index === 0 ? 'aspect-square' : 'aspect-[4/5]'}
                index={index + 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomeHero({ featured, isLoading }: Props) {
  const t = useTranslation();
  const [lead, ...rest] = featured;
  const hasVisual = isLoading || Boolean(lead);
  const words = t.home.heading.split(' ');

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop: a dot grid and one slow-drifting wash of the brand color.
          Both are decoration, so both are hidden from assistive tech, and
          they sit behind everything via the section's own stacking context. */}
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="animate-drift absolute top-[8%] right-[4%] -z-10 size-[26rem] rounded-full bg-brand/15 blur-3xl dark:bg-brand/20"
      />

      <div
        // Fills the first screen (minus the 4rem navbar) only when there is a
        // visual to balance the text. With an empty or unreachable catalog
        // the hero is just its text, and a full-height block of it would
        // read as a broken page.
        className={`mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-14 ${
          hasVisual ? 'lg:min-h-[calc(100dvh-4rem)]' : 'lg:py-28'
        }`}
      >
        <div className="lg:col-span-7">
          {/* Sized against the Spanish heading, the longer of the two: at this
              scale "Ropa personalizada," still fits the column on one line,
              so the headline is two lines in both languages. The words are
              split only for the animation; the label keeps it one phrase for
              screen readers. */}
          <h1
            aria-label={t.home.heading}
            className="text-balance text-4xl font-extrabold leading-none tracking-tight text-content font-stretch-expanded sm:text-5xl lg:text-[3.25rem]"
          >
            {words.map((word, index) => (
              <span key={`${word}-${index}`} aria-hidden="true">
                <span className="word-mask">
                  <span className="animate-word" style={riseIndex(index)}>
                    {word}
                  </span>
                </span>
                {index < words.length - 1 && ' '}
              </span>
            ))}
          </h1>
          <p
            className="animate-rise mt-6 max-w-md text-lg leading-relaxed text-content-muted"
            style={riseIndex(words.length)}
          >
            {t.home.subheading}
          </p>
          <div className="animate-rise mt-8" style={riseIndex(words.length + 1)}>
            <a
              href="/catalog"
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-brand px-7 text-sm font-semibold text-brand-content shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-xl hover:shadow-brand/30 active:translate-y-0 active:scale-[0.98]"
            >
              {t.common.browseCatalog}
              <ArrowRight size={16} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {isLoading && <CollageSkeleton />}

        {!isLoading && lead && <FeaturedCollage lead={lead} rest={rest} label={t.home.featuredLabel} />}
      </div>
    </section>
  );
}
