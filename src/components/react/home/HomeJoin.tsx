import { usePointerEffect } from '@/hooks/usePointerEffect';
import { useReveal } from '@/hooks/useReveal';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';

// The panel itself. Split out from the gate below so its hooks only run once
// there is something to attach them to: mounted here, the element exists on
// the first effect pass, which is the one useReveal and usePointerEffect use.
function JoinPanel() {
  const t = useTranslation();
  const spotlightRef = usePointerEffect<HTMLElement>('spotlight');
  const panelRef = useReveal<HTMLDivElement>();

  return (
    <section ref={spotlightRef} className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
      {/* Ink on paper, inverted: the one full-contrast block on the page, kept
          for the one thing the page asks a visitor to do. */}
      <div
        ref={panelRef}
        data-spotlight
        className="reveal spotlight flex flex-col gap-10 rounded-3xl bg-content p-8 text-content-inverse sm:p-14 lg:flex-row lg:items-end lg:justify-between"
      >
        <div
          aria-hidden="true"
          className="animate-drift absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-brand/45 blur-3xl"
        />

        <div>
          <h2 className="max-w-2xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight font-stretch-expanded sm:text-5xl">
            {t.home.joinHeading}
          </h2>
          <p className="mt-4 max-w-md text-lg text-content-inverse/75">{t.home.joinBody}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href="/register"
            className="flex h-12 items-center rounded-md bg-brand px-7 text-sm font-semibold text-brand-content transition hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0 active:scale-[0.98]"
          >
            {t.nav.signUp}
          </a>
          <a
            href="/login"
            className="flex h-12 items-center rounded-md border border-content-inverse/30 px-7 text-sm font-semibold text-content-inverse transition hover:border-content-inverse hover:bg-content-inverse/10 active:scale-[0.98]"
          >
            {t.nav.logIn}
          </a>
        </div>
      </div>
    </section>
  );
}

// Shown to signed-out visitors only. It waits for the auth store to hydrate
// before rendering at all, rather than rendering and then hiding: the server
// can't know who is signed in, and a signed-in user should never see a flash
// of "create an account".
export default function HomeJoin() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!hasHydrated || accessToken) {
    return null;
  }

  return <JoinPanel />;
}
