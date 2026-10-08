import { apiFetch } from '../api-client';
import type { ProductReviews, Review } from '../types';

export interface ListReviewsParams {
  page?: number;
  pageSize?: number;
}

// The token is optional here: the list is public, but sending it makes the
// API include the reader's own review so the form can show it.
export function listReviews(
  productId: string,
  params: ListReviewsParams = {},
  token?: string,
): Promise<ProductReviews> {
  return apiFetch<ProductReviews>(`/catalog/products/${encodeURIComponent(productId)}/reviews`, {
    searchParams: { ...params },
    token,
  });
}

export interface RateProductInput {
  /** Whole stars, 1..5. */
  rating: number;
  /** Leave out or empty for a rating without a comment. */
  body?: string;
}

// PUT to a fixed `mine` resource: a shopper has one review per product, so
// this both creates it and replaces it.
export function rateProduct(productId: string, input: RateProductInput, token: string): Promise<Review> {
  return apiFetch<Review>(`/catalog/products/${encodeURIComponent(productId)}/reviews/mine`, {
    method: 'PUT',
    body: { rating: input.rating, body: input.body ?? '' },
    token,
  });
}

export function deleteReview(productId: string, token: string): Promise<void> {
  return apiFetch<void>(`/catalog/products/${encodeURIComponent(productId)}/reviews/mine`, {
    method: 'DELETE',
    token,
  });
}
