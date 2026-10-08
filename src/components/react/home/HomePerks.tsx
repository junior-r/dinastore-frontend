import { ArrowUpRight, Heart, PackageCheck, Ruler } from 'lucide-react';
import { usePointerEffect } from '@/hooks/usePointerEffect';
import { useReveal } from '@/hooks/useReveal';
import { useTranslation } from '@/i18n';
import { riseIndex } from '@/lib/motion';
import SizeDemo from './SizeDemo';

const TITLE_CLASS = 'font-extrabold tracking-tight font-stretch-expanded';

// Three cells for three perks, each on a different fill (brand, ink, muted)
// so the grid has a clear lead and doesn't read as three copies of one card.
export default function HomePerks() {
  const t = useTranslation();
  // Two refs, so two elements: the outer one listens for the pointer and
  // feeds every tile's spotlight, the grid inside it is the reveal group.
  const spotlightRef = usePointerEffect<HTMLDivElement>('spotlight');
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
      <h2 className="max-w-xl text-balance text-3xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-4xl">
        {t.home.perksHeading}
      </h2>

      <div ref={spotlightRef} className="mt-8">
        {/* One column on phones; from `lg` the lead cell takes three of five
            columns and both rows, with the other two stacked beside it. */}
        <div ref={gridRef} className="reveal-group grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
          <article
            data-spotlight
            style={riseIndex(0)}
            className="spotlight flex min-h-72 flex-col justify-between gap-10 rounded-2xl bg-brand p-8 text-brand-content sm:p-10 lg:col-span-3 lg:row-span-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <Ruler size={40} strokeWidth={1.5} />
              <SizeDemo />
            </div>
            <div>
              <h3 className={`text-3xl sm:text-5xl ${TITLE_CLASS}`}>{t.home.perks.variantsTitle}</h3>
              <p className="mt-4 max-w-sm text-brand-content/85">{t.home.perks.variantsBody}</p>
            </div>
          </article>

          <article
            data-spotlight
            style={riseIndex(1)}
            className="spotlight group flex flex-col justify-between gap-8 rounded-2xl bg-content p-8 text-content-inverse lg:col-span-2"
          >
            {/* Fills and pops on hover: the same gesture as saving a product. */}
            <Heart
              size={28}
              strokeWidth={1.5}
              className="transition-colors group-hover:animate-heart-pop group-hover:fill-current"
            />
            <div>
              <h3 className={`text-2xl ${TITLE_CLASS}`}>{t.home.perks.favoritesTitle}</h3>
              <p className="mt-2 text-content-inverse/75">{t.home.perks.favoritesBody}</p>
            </div>
          </article>

          {/* The only cell that leads somewhere, so the only one that is a link. */}
          <a
            href="/orders"
            data-spotlight
            style={riseIndex(2)}
            className="spotlight group flex flex-col justify-between gap-8 rounded-2xl bg-surface-muted p-8 text-content transition-colors hover:bg-surface-hover lg:col-span-2"
          >
            <div className="flex items-start justify-between">
              <PackageCheck size={28} strokeWidth={1.5} />
              <ArrowUpRight
                size={20}
                className="text-content-muted transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
            <div>
              <h3 className={`text-2xl ${TITLE_CLASS}`}>{t.home.perks.ordersTitle}</h3>
              <p className="mt-2 text-content-muted">{t.home.perks.ordersBody}</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
