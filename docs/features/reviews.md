# Product Ratings

Star ratings on each product's detail page, each with an optional comment.

## Where it lives

Not a page of its own. Two pieces, both mounted by `ProductDetailView.tsx` (`/catalog/[slug]`):

- `ProductRatingSummary.tsx`: one line under the product title (stars, average, count) that links down to the section. Hidden until the product has at least one rating.
- `ReviewsSection.tsx`: the full section (`id="reviews"`), above the comment thread.

## What it does (user-facing)

- **Summary**: the average to one decimal, the number of ratings, and a bar per star value.
- **Rating**: signed-in shoppers pick 1 to 5 stars and may add a comment. The stars are required, the comment is not. Signed-out visitors see a log-in link instead.
- **Editing**: a shopper has one rating per product. The form opens on what they gave before; saving replaces it, and saving with the comment box emptied removes the comment.
- **Removing**: "Remove my rating", behind the shared `ConfirmDialog`.
- **List**: only ratings that came with a comment are listed, five per page. A rating without one still counts in the summary.
- **Moderation**: a rejected comment surfaces as an error toast and the draft stays in the form.

## Components

- `ui/StarRating.tsx`: read-only stars, with partial fill for averages.
- `ui/StarRatingInput.tsx`: the picker. Real radio inputs, visually hidden, so keyboard use and screen-reader grouping come from the browser.
- Stars use the `star` color token (`global.css`), not `accent`, which is violet in dark mode.

## Data fetching

- `lib/api/reviews.ts`: `listReviews`, `rateProduct`, `deleteReview`.
- `lib/queries/reviews.ts`: `useReviews(productId, page)`, `useRateProduct`, `useDeleteReview`. The list is keyed on the viewer (the response includes their own review) and gated on `hasHydrated`, for the same reasons `useComments` is. Both mutations invalidate every cached page for the product.
- `ReviewForm` takes its initial state from `viewerReview` and is remounted through its `key` when the server's copy changes, instead of syncing state in an effect.

## Backend endpoints used

- `GET /catalog/products/:productId/reviews`
- `PUT /catalog/products/:productId/reviews/mine`
- `DELETE /catalog/products/:productId/reviews/mine`

## Known gaps

- Catalog cards do not show ratings: the product list response has no rating fields (see the backend's `reviews.md`).
- No sorting or filtering of the list by star value.
