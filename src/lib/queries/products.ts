import { keepPreviousData, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductBySlug, listCategories, listProducts, type ListProductsParams } from '../api/catalog';

export function productsQueryOptions(params: ListProductsParams) {
  return queryOptions({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  });
}

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery(categoriesQueryOptions());
}

export function productQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
    staleTime: 60_000,
  });
}

/**
 * A page of products.
 *
 * `keepPreviousData` holds the last result on screen while a different page,
 * search or filter loads. Without it every change of `params` is a brand-new
 * query with no data, so the grid was torn down to skeletons and rebuilt on
 * each click of "next". Callers can read `isPlaceholderData` to show that
 * what is on screen is about to be replaced.
 */
export function useProducts(params: ListProductsParams) {
  return useQuery({ ...productsQueryOptions(params), placeholderData: keepPreviousData });
}

export function useProduct(slug: string) {
  return useQuery(productQueryOptions(slug));
}

/**
 * Returns a function that warms the cache for a product's detail query.
 * Wired to a product card's onMouseEnter so the click-through to /catalog/[slug]
 * usually resolves from cache instead of waiting on a network round trip.
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  return (slug: string) => {
    void queryClient.prefetchQuery(productQueryOptions(slug));
  };
}
