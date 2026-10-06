import { apiFetch } from '../api-client';
import type { Category, PaginatedProducts, Product } from '../types';

export interface ListProductsParams {
  categoryIds?: string[];
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export function listProducts(params: ListProductsParams = {}): Promise<PaginatedProducts> {
  return apiFetch<PaginatedProducts>('/catalog/products', { searchParams: { ...params } });
}

export function getProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/catalog/products/${encodeURIComponent(slug)}`);
}

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/catalog/categories');
}
