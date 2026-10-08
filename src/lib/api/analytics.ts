import { apiFetch } from '../api-client';
import type { PaginatedProductViews } from '../types';

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

export interface ListProductViewsParams {
  page?: number;
  pageSize?: number;
  productId?: string;
}

export function listProductViews(token: string, params: ListProductViewsParams = {}): Promise<PaginatedProductViews> {
  return apiFetch<PaginatedProductViews>('/admin/analytics/product-views', {
    token,
    searchParams: { ...params },
  });
}
