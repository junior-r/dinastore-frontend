import { apiFetch } from '../api-client';
import type { CommentLikeState, PaginatedComments } from '../types';

export interface ListCommentsParams {
  page?: number;
  pageSize?: number;
}

// The token is optional here: the list is public, but sending it lets the API
// fill in `likedByViewer` so the reader sees their own likes already filled.
export function listComments(
  productId: string,
  params: ListCommentsParams = {},
  token?: string,
): Promise<PaginatedComments> {
  return apiFetch<PaginatedComments>(
    `/catalog/products/${encodeURIComponent(productId)}/comments`,
    { searchParams: { ...params }, token },
  );
}

export interface CreateCommentInput {
  body: string;
  parentId?: string;
  /** At most one — the API rejects a second file outright. */
  image?: File | null;
}

// A text-only comment stays a plain JSON request; multipart is only used when
// there is actually a file to carry.
export function createComment(
  productId: string,
  { body, parentId, image }: CreateCommentInput,
  token: string,
): Promise<{ id: string }> {
  const path = `/catalog/products/${encodeURIComponent(productId)}/comments`;

  if (!image) {
    return apiFetch<{ id: string }>(path, {
      method: 'POST',
      body: { body, ...(parentId ? { parentId } : {}) },
      token,
    });
  }

  const form = new FormData();
  form.append('body', body);
  if (parentId) form.append('parentId', parentId);
  form.append('image', image);
  return apiFetch<{ id: string }>(path, { method: 'POST', body: form, token });
}

export function deleteComment(productId: string, commentId: string, token: string): Promise<void> {
  return apiFetch<void>(
    `/catalog/products/${encodeURIComponent(productId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE', token },
  );
}

// POST to like / DELETE to unlike — both idempotent, so a double-click or a
// retry can't flip the state back the other way (unlike a toggle endpoint).
export function setCommentLike(
  productId: string,
  commentId: string,
  liked: boolean,
  token: string,
): Promise<CommentLikeState> {
  return apiFetch<CommentLikeState>(
    `/catalog/products/${encodeURIComponent(productId)}/comments/${encodeURIComponent(commentId)}/likes`,
    { method: liked ? 'POST' : 'DELETE', token },
  );
}
