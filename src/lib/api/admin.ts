import { apiFetch, apiUpload } from '../api-client';
import type {
  AdminUserDetail,
  Category,
  PaginatedAdminProducts,
  PaginatedAdminUsers,
  PaginatedCustomOrderItems,
  Permission,
  Product,
  ProductStatus,
  Role,
  User,
} from '../types';

// -- Users --------------------------------------------------------------

export interface ListAdminUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function listAdminUsers(token: string, params: ListAdminUsersParams = {}): Promise<PaginatedAdminUsers> {
  return apiFetch<PaginatedAdminUsers>('/admin/users', { token, searchParams: { ...params } });
}

export function getAdminUserDetail(id: string, token: string): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`, { token });
}

export function updateUserRole(id: string, role: Role, token: string): Promise<User> {
  return apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    body: { role },
    token,
  });
}

export function updateUserPermissions(id: string, permissions: Permission[], token: string): Promise<User> {
  return apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/permissions`, {
    method: 'PATCH',
    body: { permissions },
    token,
  });
}

export function deactivateUser(id: string, token: string): Promise<User> {
  return apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/deactivate`, { method: 'PATCH', token });
}

export function activateUser(id: string, token: string): Promise<User> {
  return apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/activate`, { method: 'PATCH', token });
}

// -- Products -------------------------------------------------------------

export interface ListAdminProductsParams {
  categoryIds?: string[];
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProductVariantInput {
  // Present only in edit mode, for a variant that already exists in the DB
  // -- size/color/sku are then locked (see UpdateProductVariantEntry) and
  // only stock/priceCents can change. Absent means "create a new variant".
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceCents?: number;
}

export interface ProductImageInput {
  url: string;
  altText?: string;
  position?: number;
  // Indexes into this payload's own `variants` array -- the image applies
  // only to those variants. Omitted/empty means "all variants".
  variantIndexes?: number[];
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  description?: string;
  basePriceCents: number;
  currency: string;
  categoryIds: string[];
  variants?: ProductVariantInput[];
  images?: ProductImageInput[];
}

export interface UpdateProductPayload {
  name: string;
  description?: string;
  basePriceCents: number;
  currency: string;
  categoryIds: string[];
}

// Full-replace: this *is* the desired end-state list of variants -- any
// existing variant (by id) left out gets deleted. An entry with `id`
// updates only stock/priceCents (size/color/sku are locked once created);
// an entry without `id` creates a new variant and needs the full shape.
export type UpdateProductVariantEntry =
  | { id: string; stock: number; priceCents?: number }
  | { id?: undefined; size: string; color: string; sku: string; stock: number; priceCents?: number };

// Full-replace, same semantics as variants above. `id` present updates that
// image's position/altText/variant tags in place; absent creates a new
// image. variantIds are the variants' real ids (not create-mode's indexes),
// since editing a product means every variant already has a real id.
export interface UpdateProductImageEntry {
  id?: string;
  url: string;
  altText?: string;
  position: number;
  variantIds?: string[];
}

export function listAdminProducts(
  token: string,
  params: ListAdminProductsParams = {},
): Promise<PaginatedAdminProducts> {
  return apiFetch<PaginatedAdminProducts>('/admin/catalog/products', { token, searchParams: { ...params } });
}

// Deliberately hits the public /catalog/products endpoint (now guarded
// ADMIN/STAFF + products:manage) rather than duplicating a second create
// route under /admin — see backend catalog.controller.ts.
export function createProduct(payload: CreateProductPayload, token: string): Promise<Product> {
  return apiFetch<Product>('/catalog/products', { method: 'POST', body: payload, token });
}

export function updateProduct(id: string, payload: UpdateProductPayload, token: string): Promise<Product> {
  return apiFetch<Product>(`/admin/catalog/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function updateProductVariants(
  id: string,
  variants: UpdateProductVariantEntry[],
  token: string,
): Promise<Product> {
  return apiFetch<Product>(`/admin/catalog/products/${encodeURIComponent(id)}/variants`, {
    method: 'PATCH',
    body: { variants },
    token,
  });
}

export function updateProductImages(
  id: string,
  images: UpdateProductImageEntry[],
  token: string,
): Promise<Product> {
  return apiFetch<Product>(`/admin/catalog/products/${encodeURIComponent(id)}/images`, {
    method: 'PATCH',
    body: { images },
    token,
  });
}

export function updateProductStatus(id: string, status: ProductStatus, token: string): Promise<Product> {
  return apiFetch<Product>(`/admin/catalog/products/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  });
}

export function deleteProduct(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/admin/catalog/products/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}

export function uploadProductImages(files: File[], token: string): Promise<{ url: string }[]> {
  return apiUpload<{ url: string }[]>('/catalog/products/images', files, { token });
}

// -- Categories -------------------------------------------------------------

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
}

export function createCategory(payload: CreateCategoryPayload, token: string): Promise<Category> {
  return apiFetch<Category>('/admin/catalog/categories', { method: 'POST', body: payload, token });
}

export function updateCategory(id: string, payload: UpdateCategoryPayload, token: string): Promise<Category> {
  return apiFetch<Category>(`/admin/catalog/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function deleteCategory(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/admin/catalog/categories/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}

// -- Custom prints --------------------------------------------------------

export interface ListCustomOrderItemsParams {
  page?: number;
  pageSize?: number;
}

export function listCustomOrderItems(
  token: string,
  params: ListCustomOrderItemsParams = {},
): Promise<PaginatedCustomOrderItems> {
  return apiFetch<PaginatedCustomOrderItems>('/admin/orders/custom-items', {
    token,
    searchParams: { ...params },
  });
}
