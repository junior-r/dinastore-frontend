import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { useTranslation } from '@/i18n';
import { riseIndex } from '@/lib/motion';
import type { Product } from '@/lib/types';
import ProductCard from '../catalog/ProductCard';
import ProductCardSkeleton from '../catalog/ProductCardSkeleton';

interface Props {
  products: Product[];
  isLoading: boolean;
}

// Widths leave the next card peeking in from the right edge at every
// breakpoint, which is what tells the reader the row scrolls.
const SLIDE_CLASS = 'w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23.4%]';
const ARROW_CLASS =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-content transition hover:border-content active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40';

// A horizontal, swipeable row rather than a second grid: the catalog page is
// already the grid, and this keeps the home page from being a shorter copy
// of it. Native scroll with snap points does the work, so touch, trackpad and
// keyboard all behave the way the platform already does.
export default function HomeArrivals({ products, isLoading }: Props) {
  const t = useTranslation();
  // The scroller doubles as the reveal group: its direct children (the
  // slides) are what stagger in.
  const scrollerRef = useReveal<HTMLDivElement>(!isLoading);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Which arrows are usable follows from whether the first and last slides
  // are fully in view. An observer rooted on the scroller reports exactly
  // that, and only when it changes, so there is no scroll handler doing math
  // on every frame.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const first = scroller?.firstElementChild;
    const last = scroller?.lastElementChild;
    if (isLoading || !scroller || !first || !last || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === first) {
            setAtStart(entry.isIntersecting);
          }
          if (entry.target === last) {
            setAtEnd(entry.isIntersecting);
          }
        }
      },
      { root: scroller, threshold: 0.95 },
    );
    observer.observe(first);
    observer.observe(last);

    return () => observer.disconnect();
  }, [scrollerRef, isLoading, products.length]);

  // Nothing to show and nothing on the way: leave the section out rather than
  // print a heading over an empty row. The catalog page owns the proper empty
  // and error states.
  if (!isLoading && products.length === 0) {
    return null;
  }

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.85,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex items-end justify-between gap-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-4xl">
          {t.home.arrivalsHeading}
        </h2>

        <div className="flex shrink-0 items-center gap-5">
          <a
            href="/catalog"
            className="group flex items-center gap-1.5 text-sm font-semibold text-content transition-colors hover:text-brand"
          >
            {t.home.viewAll}
            <ArrowRight size={16} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
          </a>
          {/* Arrows are for pointer users; on a phone the row is swiped. */}
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              disabled={atStart}
              onClick={() => scrollByPage(-1)}
              aria-label={t.common.previous}
              className={ARROW_CLASS}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={atEnd}
              onClick={() => scrollByPage(1)}
              aria-label={t.common.next}
              className={ARROW_CLASS}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="reveal-group scrollbar-none mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto sm:gap-6"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={SLIDE_CLASS}>
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((product, index) => (
              <div key={product.id} className={SLIDE_CLASS} style={riseIndex(index)}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}
