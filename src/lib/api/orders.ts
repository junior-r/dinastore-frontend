import { apiFetch } from '../api-client';
import type { DesignPlacement, Order, PaginatedOrders } from '../types';

export interface PlaceOrderItemPayload {
  productVariantId: string;
  quantity: number;
  /** Present when the line was customized in the design studio. */
  customization?: { designId: string; placement: DesignPlacement };
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
}

export function placeOrder(items: PlaceOrderItemPayload[], token: string): Promise<Order> {
  return apiFetch<Order>('/orders', { method: 'POST', body: { items }, token });
}

export function listMyOrders(token: string, params: ListOrdersParams = {}): Promise<PaginatedOrders> {
  return apiFetch<PaginatedOrders>('/orders', { token, searchParams: { ...params } });
}

export function getOrder(id: string, token: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, { token });
}

export function payOrder(id: string, token: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}/pay`, { method: 'POST', token });
}
