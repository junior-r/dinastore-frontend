import { Asterisk } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { cssVars } from '@/lib/motion';
import { useCategories } from '@/lib/queries/products';

// Roughly how many names it takes to overfill a wide screen. A short category
// list is repeated up to this, or the strip would end before the viewport
// does and show a gap on every loop.
const MIN_LOOP_ITEMS = 10;
const SECONDS_PER_ITEM = 5;

// Categories carry no image of their own, so they are set as moving type
// rather than a row of tiles: borrowing product photos for them would just
// repeat the pictures already in the hero and the arrivals carousel.
export default function HomeCategories() {
  const { data: categories } = useCategories();
  const t = useTranslation();

  if (!categories || categories.length === 0) {
    return null;
  }

  // One copy of the list per <ul>. Half of them make up a loop long enough to
  // fill the screen; the other half is the identical run the track slides
  // into (see the `marquee` keyframe). Only the very first copy is real to a
  // screen reader or a keyboard: the rest are visual repeats.
  const copiesPerHalf = Math.max(1, Math.ceil(MIN_LOOP_ITEMS / categories.length));
  const copies = Array.from({ length: copiesPerHalf * 2 }, (_, index) => index);

  return (
    <section aria-labelledby="home-categories-heading" className="border-y border-border py-8 sm:py-10">
      <h2 id="home-categories-heading" className="sr-only">
        {t.home.categoriesHeading}
      </h2>

      <div className="marquee">
        <div
          className="marquee-track"
          style={cssVars({ '--marquee-duration': `${categories.length * copiesPerHalf * SECONDS_PER_ITEM}s` })}
        >
          {copies.map((copy) => {
            const isRepeat = copy > 0;
            return (
              // flex-wrap only matters under reduced motion, where the track
              // stops being max-content wide and this becomes a plain list.
              <ul key={copy} aria-hidden={isRepeat || undefined} className="flex shrink-0 flex-wrap items-center">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center">
                    <a
                      href={`/catalog?categories=${category.id}`}
                      tabIndex={isRepeat ? -1 : undefined}
                      className="px-5 text-3xl font-extrabold tracking-tight whitespace-nowrap text-content transition-colors font-stretch-expanded hover:text-brand sm:px-8 sm:text-5xl"
                    >
                      {category.name}
                    </a>
                    <Asterisk aria-hidden="true" className="size-6 shrink-0 text-brand sm:size-9" />
                  </li>
                ))}
              </ul>
            );
          })}
        </div>
      </div>
    </section>
  );
}
