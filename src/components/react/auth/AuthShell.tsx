import { Asterisk, Heart, PackageCheck, Ruler } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePointerEffect } from '@/hooks/usePointerEffect';
import { useTranslation } from '@/i18n';
import { riseIndex } from '@/lib/motion';

interface Props {
  heading: string;
  intro: string;
  // The large line on the brand panel. Login and sign-up share the panel but
  // say different things on it.
  panelHeading: string;
  children: ReactNode;
}

// The frame both auth pages sit in: the form on one side, a brand panel on
// the other. The panel is decoration plus reassurance, never something a
// visitor needs in order to sign in, so below `lg` it is dropped entirely and
// the form gets the whole screen.
export default function AuthShell({ heading, intro, panelHeading, children }: Props) {
  const t = useTranslation();
  const panelRef = usePointerEffect<HTMLDivElement>('spotlight');

  // The same three perks as the home page, reused word for word: each is a
  // thing an account actually gets you, which is the only pitch that belongs
  // next to a sign-in form.
  const perks = [
    { icon: Ruler, label: t.home.perks.variantsTitle },
    { icon: Heart, label: t.home.perks.favoritesTitle },
    { icon: PackageCheck, label: t.home.perks.ordersTitle },
  ];

  return (
    // Fills the screen below the 4rem navbar, so the two halves meet the
    // bottom of the viewport instead of floating above an empty gap.
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="animate-rise w-full max-w-sm">
          <h1 className="text-4xl font-extrabold tracking-tight text-content font-stretch-expanded">{heading}</h1>
          <p className="mt-3 text-content-muted">{intro}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div ref={panelRef} className="hidden p-4 lg:block">
        <div
          data-spotlight
          style={riseIndex(1)}
          className="animate-rise spotlight flex h-full flex-col justify-between gap-12 rounded-3xl bg-brand p-12 text-brand-content"
        >
          <div
            aria-hidden="true"
            className="animate-drift absolute -top-24 -right-20 -z-10 size-96 rounded-full bg-brand-content/20 blur-3xl"
          />

          <Asterisk aria-hidden="true" size={56} strokeWidth={1.5} />

          <div>
            {/* A <p>, not a heading: the page's one <h1> is the form's, and
                this line repeats copy that is a heading elsewhere. */}
            <p className="max-w-md text-balance text-5xl font-extrabold leading-[1.05] tracking-tight font-stretch-expanded">
              {panelHeading}
            </p>
            <ul className="mt-10 space-y-4">
              {perks.map((perk) => (
                <li key={perk.label} className="flex items-center gap-3 text-lg font-medium">
                  <perk.icon aria-hidden="true" size={22} strokeWidth={1.5} />
                  {perk.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
