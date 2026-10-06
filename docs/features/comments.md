# Product Comments

A public comment thread on each product's detail page.

## Where it lives

Not a page of its own — `CommentsSection.tsx`
(`components/react/catalog/CommentsSection.tsx`) is mounted at the bottom of
`ProductDetailView.tsx` (`/catalog/[slug]`, see `catalog.md`).

## What it does (user-facing)

- **Public list**: anyone (signed in or not) can see a product's comments —
  author avatar/name, relative date, comment body — and the total count in
  the section heading.
- **Posting**: signed-in users get a textarea (max 1000 chars) + "Post
  comment" button below the list. Signed-out users see a "Log in to leave a
  comment" link instead of the form.
- **Moderation**: if a comment is rejected by backend moderation, the
  rejection surfaces via the existing `sonner` `toast.error` wrapper (the
  mutation's `onError`) rather than a dedicated UI state.
- **Deletion**: only visible on a comment's own author's comments
  (`comment.author.id === user?.id`). Goes through the shared
  `ConfirmDialog` ("Delete this comment? This cannot be undone.").

## Data fetching

- `lib/api/comments.ts` — `listComments(productId, params)` (public),
  `createComment(productId, body, token)`, `deleteComment(productId,
  commentId, token)`.
- `lib/queries/comments.ts` — `useComments(productId)` (no auth gate — public
  read), `useCreateComment(productId)`, `useDeleteComment(productId)`. Both
  mutations invalidate `['comments', productId]` on success; errors toast via
  the shared `errorMessage()` helper.

## Backend endpoints used

- `GET /catalog/products/:productId/comments`
- `POST /catalog/products/:productId/comments`
- `DELETE /catalog/products/:productId/comments/:commentId`

## Known gaps

- No editing of an existing comment — only post and delete.
- No pagination controls surfaced in the UI even though the backend returns
  a paginated shape (`PaginatedComments`); the section currently just
  renders whatever the first page returns.
