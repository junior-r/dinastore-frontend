import { Heart, Package, ShoppingCart, type LucideIcon } from 'lucide-react';
import { usePointerEffect } from '@/hooks/usePointerEffect';
import { useTranslation } from '@/i18n';
import { riseIndex } from '@/lib/motion';
import { useCartCount } from '@/stores/cart-store';
import { useFavoritesCount } from '@/stores/favorites-store';

interface Props {
  // Undefined while the orders request is still in flight.
  ordersTotal: number | undefined;
}

interface Stat {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  // Fill and ink for the tile. Each stat gets a different one so the row has
  // a lead (orders, the only number that comes from the account itself).
  tone: string;
}

// Three real counts, each a link to the place that number lives.
export default function AccountStats({ ordersTotal }: Props) {
  const t = useTranslation();
  const favoritesCount = useFavoritesCount();
  const cartCount = useCartCount();
  const gridRef = usePointerEffect<HTMLDivElement>('spotlight');

  const stats: Stat[] = [
    { href: '/orders', icon: Package, label: t.nav.orders, value: ordersTotal, tone: 'bg-brand text-brand-content' },
    // Favorites have no page of their own; the list is further down this one.
    { href: '#favorites', icon: Heart, label: t.nav.favorites, value: favoritesCount, tone: 'bg-content text-content-inverse' },
    { href: '/checkout', icon: ShoppingCart, label: t.nav.cart, value: cartCount, tone: 'bg-surface-muted text-content' },
  ];

  return (
    // Three across at every width, phones included: stacked, three tiles
    // holding one number each fill a whole screen. The tiles tighten up and
    // drop their icon below `sm` to fit.
    <div ref={gridRef} className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <a
          key={stat.href}
          href={stat.href}
          data-spotlight
          style={riseIndex(index + 1)}
          // No hover transform here on purpose: `animate-rise` keeps its final
          // keyframe applied, and a held animation value outranks a hover
          // style, so a lift would silently never happen. The spotlight is
          // the hover feedback.
          className={`animate-rise spotlight flex items-end justify-between gap-4 rounded-2xl p-4 sm:p-6 ${stat.tone}`}
        >
          <div className="min-w-0">
            {/* The hyphen holds the number's height while orders load, so
                the tile doesn't jump when the count arrives. */}
            <p className="text-3xl font-extrabold tracking-tight tabular-nums font-stretch-expanded sm:text-5xl">
              {stat.value ?? '-'}
            </p>
            <p className="mt-1 truncate text-sm font-medium opacity-80">{stat.label}</p>
          </div>
          <stat.icon aria-hidden="true" size={28} strokeWidth={1.5} className="hidden shrink-0 sm:block" />
        </a>
      ))}
    </div>
  );
}
