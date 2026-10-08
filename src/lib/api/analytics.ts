import { apiFetch, apiFetchBlob } from '../api-client';
import type {
  PaginatedGroups,
  PaginatedProductViews,
  ProductViewGroup,
  ViewInsights,
  VisitorViewGroup,
} from '../types';

export interface ProductViewReport {
  /** One per page visit; every report from the same visit reuses it. */
  viewId: string;
  productId: string;
  visitorId: string;
  /** Milliseconds the page has been visible so far in this visit. */
  durationMs: number;
  favorited: boolean;
}

// There is deliberately no IP or country in the report: the server reads
// those from the connection itself, so the page couldn't lie about them if it
// tried. The token is optional because most visits are anonymous.
export function reportProductView(report: ProductViewReport, token?: string): Promise<void> {
  return apiFetch<void>('/analytics/product-views', {
    method: 'POST',
    body: report,
    token,
    keepalive: true,
  });
}

/**
 * The filters every admin product-view request accepts. The table, the
 * charts and the export all send the same ones, which is what keeps them
 * describing the same visits.
 */
export interface ProductViewFilterParams {
  productId?: string;
  userId?: string;
  visitorId?: string;
  search?: string;
  /** ISO instant, inclusive. */
  from?: string;
  /** ISO instant, exclusive. */
  to?: string;
  /** Two-letter code, or "unknown". */
  country?: string;
  visitor?: 'signed-in' | 'anonymous';
  favorited?: 'true' | 'false';
}

export interface ListProductViewsParams extends ProductViewFilterParams {
  page?: number;
  pageSize?: number;
}

export function listProductViews(token: string, params: ListProductViewsParams = {}): Promise<PaginatedProductViews> {
  return apiFetch<PaginatedProductViews>('/admin/analytics/product-views', {
    token,
    searchParams: { ...params },
  });
}

export function listProductViewsByProduct(
  token: string,
  params: ListProductViewsParams = {},
): Promise<PaginatedGroups<ProductViewGroup>> {
  return apiFetch('/admin/analytics/product-views/by-product', { token, searchParams: { ...params } });
}

export function listProductViewsByVisitor(
  token: string,
  params: ListProductViewsParams = {},
): Promise<PaginatedGroups<VisitorViewGroup>> {
  return apiFetch('/admin/analytics/product-views/by-visitor', { token, searchParams: { ...params } });
}

// The browser's own offset goes along so "a day" on the charts is the
// viewer's calendar day rather than a UTC one.
function tzOffset(): number {
  return new Date().getTimezoneOffset();
}

export function getProductViewInsights(token: string, params: ProductViewFilterParams = {}): Promise<ViewInsights> {
  return apiFetch<ViewInsights>('/admin/analytics/product-views/insights', {
    token,
    searchParams: { ...params, tzOffset: tzOffset() },
  });
}

/** The filtered history as an .xlsx file, built by the API. */
export function exportProductViews(
  token: string,
  params: ProductViewFilterParams,
  lang: 'en' | 'es',
): Promise<Blob> {
  return apiFetchBlob('/admin/analytics/product-views/export', {
    token,
    searchParams: { ...params, tzOffset: tzOffset(), lang },
  });
}
