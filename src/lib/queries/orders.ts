import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOrder, listMyOrders, payOrder, placeOrder, type ListOrdersParams } from '../api/orders';
import { toastOnNextLoad } from '../toast';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/i18n';
import { errorMessage } from './error-message';

export function useMyOrders(params: ListOrdersParams = {}) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => listMyOrders(accessToken as string, params),
    enabled: hasHydrated && Boolean(accessToken),
  });
}

export function useOrder(id: string) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id, accessToken as string),
    enabled: hasHydrated && Boolean(accessToken),
  });
}

export function usePlaceOrder() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: (items: Parameters<typeof placeOrder>[0]) => placeOrder(items, accessToken as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      // CheckoutView redirects via a hard navigation right after this
      // resolves, tearing down the current Toaster before it can render.
      toastOnNextLoad('success', t.orders.placed);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.checkout.error));
    },
  });
}

export function usePayOrder() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: (orderId: string) => payOrder(orderId, accessToken as string),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.id], order);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t.orders.paymentConfirmed);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.orders.paymentError));
    },
  });
}
