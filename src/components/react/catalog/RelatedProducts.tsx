import { useTranslation } from '@/i18n';
import { useProducts } from '@/lib/queries/products';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

interface Props {
  product: Product;
}

const RELATED_COUNT = 4;

// Other products sharing at least one category with the one being viewed.
// There is no recommendations endpoint; this reuses the catalog list's own
// category filter, which is also why it renders nothing rather than an empty
// heading when the product is the only one in its categories.
export default function RelatedProducts({ product }: Props) {
  const t = useTranslation();
  const { data } = useProducts({
    categoryIds: product.categoryIds.length > 0 ? product.categoryIds : undefined,
    // One extra, because the product itself is normally in its own result set
    // and gets filtered out below.
    pageSize: RELATED_COUNT + 1,
  });

  const related = (data?.items ?? []).filter((item) => item.id !== product.id).slice(0, RELATED_COUNT);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-extrabold tracking-tight text-content font-stretch-expanded sm:text-3xl">
        {t.catalog.relatedHeading}
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {related.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
