import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteReview, listReviews, rateProduct, type RateProductInput } from '../api/reviews';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/i18n';
import { errorMessage } from './error-message';

export const REVIEWS_PAGE_SIZE = 5;

// Every page of every viewer for one product. Saving or removing a rating
// changes the summary on all of them, so mutations invalidate by this prefix.
function productReviewsKey(productId: string) {
  return ['reviews', productId] as const;
}

/**
 * A page of written reviews, plus the rating summary and the reader's own
 * review. The viewer is part of the key because `viewerReview` differs per
 * reader, the same reason `useComments` is keyed that way.
 */
export function useReviews(productId: string, page = 1) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return useQuery({
    queryKey: [...productReviewsKey(productId), viewerId ?? 'anonymous', page],
    queryFn: () => listReviews(productId, { page, pageSize: REVIEWS_PAGE_SIZE }, accessToken ?? undefined),
    // Wait for the persisted auth state, otherwise the first fetch goes out
    // anonymously and a signed-in shopper sees an empty form over a rating
    // they already gave.
    enabled: hasHydrated,
    // Keeps the summary and the current reviews on screen while another page
    // of them loads.
    placeholderData: keepPreviousData,
  });
}

export function useRateProduct(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: (input: RateProductInput) => rateProduct(productId, input, accessToken as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productReviewsKey(productId) });
      toast.success(t.reviews.saved);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.reviews.saveError));
    },
  });
}

export function useDeleteReview(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: () => deleteReview(productId, accessToken as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productReviewsKey(productId) });
      toast.success(t.reviews.removed);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.reviews.removeError));
    },
  });
}
