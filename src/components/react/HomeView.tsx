import { QueryClientProvider } from '@tanstack/react-query';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { getQueryClient } from '@/lib/query-client';
import { useProducts } from '@/lib/queries/products';
import HomeArrivals from './home/HomeArrivals';
import HomeCategories from './home/HomeCategories';
import HomeHero from './home/HomeHero';
import HomeJoin from './home/HomeJoin';
import HomePerks from './home/HomePerks';

const FEATURED_COUNT = 3;
const ARRIVALS_COUNT = 8;

// The home page is otherwise pure Astro, so its copy would be stuck in the
// server-rendered locale. Rendering it from an island is what lets it react
// to the language switcher like every other screen.
function HomeInner() {
  const t = useTranslation();
  // One request feeds both the hero and the arrivals grid. The list endpoint
  // returns newest first, which is what makes "new arrivals" an honest label.
  const { data, isLoading } = useProducts({ pageSize: FEATURED_COUNT + ARRIVALS_COUNT });

  useDocumentTitle(t.home.title);

  const products = data?.items ?? [];
  const featured = products.filter((product) => product.images.length > 0).slice(0, FEATURED_COUNT);
  const featuredIds = new Set(featured.map((product) => product.id));
  // The grid normally skips what the hero already shows. With a catalog too
  // small for that to leave a full row, it shows everything instead: a
  // repeated product is better than a section with one lonely card.
  const remaining = products.filter((product) => !featuredIds.has(product.id));
  const arrivals = (remaining.length >= 4 ? remaining : products).slice(0, ARRIVALS_COUNT);

  return (
    <>
      <HomeHero featured={featured} isLoading={isLoading} />
      <HomeCategories />
      <HomeArrivals products={arrivals} isLoading={isLoading} />
      <HomePerks />
      <HomeJoin />
    </>
  );
}

export default function HomeView() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <HomeInner />
    </QueryClientProvider>
  );
}
