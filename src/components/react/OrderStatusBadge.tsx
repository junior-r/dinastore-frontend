import { useTranslation } from '@/i18n';
import type { OrderStatus } from '@/lib/types';

interface Props {
  status: OrderStatus;
  // `md` is for a page that is about one order; `sm` for a row in a list.
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-warning-soft text-warning',
  PAID: 'bg-success-soft text-success',
  CANCELLED: 'bg-danger-soft text-danger',
};

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

// The one place an order status is turned into a colored label, shared by the
// orders list, the order page and the account page so the three can't drift.
// The status is always spelled out, so the color is never the only signal.
export default function OrderStatusBadge({ status, size = 'sm' }: Props) {
  const t = useTranslation();

  return (
    <span className={`shrink-0 rounded-full font-medium ${SIZE_STYLES[size]} ${STATUS_STYLES[status]}`}>
      {t.orders.status[status]}
    </span>
  );
}
