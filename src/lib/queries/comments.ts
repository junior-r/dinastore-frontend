import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createComment,
  deleteComment,
  listComments,
  setCommentLike,
  type CreateCommentInput,
} from '../api/comments';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/i18n';
import type { PaginatedComments } from '../types';
import { errorMessage } from './error-message';

// The viewer is part of the key because `likedByViewer` differs per reader —
// logging in or out has to produce a different cache entry, not reuse the
// previous user's filled hearts.
function commentsKey(productId: string, viewerId: string | undefined) {
  return ['comments', productId, viewerId ?? 'anonymous'] as const;
}

export function useComments(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return useQuery({
    queryKey: commentsKey(productId, viewerId),
    queryFn: () => listComments(productId, {}, accessToken ?? undefined),
    // Wait for the persisted auth state to load, otherwise the first fetch
    // goes out anonymously and every heart renders empty for a logged-in user
    // until something else invalidates it.
    enabled: hasHydrated,
  });
}

export function useCreateComment(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      createComment(productId, input, accessToken as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsKey(productId, viewerId) });
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.comments.postError));
    },
  });
}

export function useDeleteComment(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const t = useTranslation();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(productId, commentId, accessToken as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsKey(productId, viewerId) });
    },
    onError: (error) => {
      toast.error(errorMessage(error, t.comments.deleteError));
    },
  });
}

/**
 * Optimistic by design: the heart animation has to start on the click, not a
 * round trip later. The server's recounted total then overwrites the guess in
 * `onSuccess` (it is authoritative — other people may have liked meanwhile),
 * and `onError` restores the snapshot taken before the click.
 */
export function useSetCommentLike(productId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const t = useTranslation();
  const key = commentsKey(productId, viewerId);

  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: string; liked: boolean }) =>
      setCommentLike(productId, commentId, liked, accessToken as string),

    onMutate: async ({ commentId, liked }) => {
      // Stop an in-flight list refetch from landing after this and reverting
      // the optimistic state.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaginatedComments>(key);

      queryClient.setQueryData<PaginatedComments>(key, (current) =>
        current && {
          ...current,
          items: current.items.map((item) =>
            item.id === commentId
              ? {
                  ...item,
                  likedByViewer: liked,
                  // Guard against a negative count if the cache was stale.
                  likeCount: Math.max(0, item.likeCount + (liked ? 1 : -1)),
                }
              : item,
          ),
        },
      );

      return { previous };
    },

    onSuccess: (state) => {
      queryClient.setQueryData<PaginatedComments>(key, (current) =>
        current && {
          ...current,
          items: current.items.map((item) =>
            item.id === state.commentId
              ? { ...item, likedByViewer: state.liked, likeCount: state.likeCount }
              : item,
          ),
        },
      );
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(errorMessage(error, t.comments.likeError));
    },
  });
}
