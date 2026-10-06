import type { ProductStatus, Role } from '@/lib/types';

// Pill colors for the two fixed enums the admin shows as badges. One module,
// so the dashboard and the list pages can't end up coloring the same status
// differently. Each pill always carries its label as text as well, so the
// color is never the only thing telling two states apart.

export const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const PRODUCT_STATUS_STYLES: Record<ProductStatus, string> = {
  DRAFT: 'bg-surface-muted text-content-muted',
  PUBLISHED: 'bg-success-soft text-success',
  ARCHIVED: 'bg-warning-soft text-warning',
};

export const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-brand/10 text-brand',
  STAFF: 'bg-warning-soft text-warning',
  CUSTOMER: 'bg-surface-muted text-content-muted',
};

export const PILL_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-medium';
