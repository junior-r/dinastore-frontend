import { Star } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { REVIEWS_PAGE_SIZE, useDeleteReview, useRateProduct, useReviews } from '@/lib/queries/reviews';
import type { ListedReview, RatingSummary, Review } from '@/lib/types';
import { useFormat } from '@/lib/format';
import { useTranslation } from '@/i18n';
import Avatar from '../Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import Pagination from '../ui/Pagination';
import StarRating from '../ui/StarRating';
import StarRatingInput from '../ui/StarRatingInput';

interface Props {
  productId: string;
}

/** Mirrors the backend's MAX_REVIEW_BODY_LENGTH. */
const MAX_BODY_LENGTH = 1000;

const STARS_DESCENDING = [5, 4, 3, 2, 1];

function RatingOverview({ summary }: { summary: RatingSummary }) {
  const t = useTranslation();
  const format = useFormat();

  if (summary.average === null) {
    return <p className="mt-4 text-sm text-content-muted">{t.reviews.empty}</p>;
  }

  const average = format.rating(summary.average);

  return (
    <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
      <div className="shrink-0">
        {/* The stars below carry the spoken version of this number. */}
        <p
          aria-hidden="true"
          className="text-5xl font-extrabold tabular-nums tracking-tight text-content font-stretch-expanded"
        >
          {average}
        </p>
        <StarRating value={summary.average} size={18} label={t.reviews.outOfFive(average)} className="mt-2" />
        <p className="mt-1 text-sm text-content-muted">{t.reviews.count(summary.count)}</p>
      </div>

      <ul className="flex-1 space-y-1.5">
        {STARS_DESCENDING.map((stars) => {
          const count = summary.distribution[stars] ?? 0;
          return (
            <li key={stars} className="flex items-center gap-3 text-sm">
              <span className="sr-only">{t.reviews.distributionRow(stars, count)}</span>
              <span aria-hidden="true" className="flex w-8 items-center gap-1 tabular-nums text-content-muted">
                {stars}
                <Star size={12} fill="currentColor" strokeWidth={0} className="text-star" />
              </span>
              <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-star"
                  style={{ width: `${(count / summary.count) * 100}%` }}
                />
              </span>
              <span aria-hidden="true" className="w-8 text-right tabular-nums text-content-muted">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The signed-in shopper's own rating: stars are required, the comment is
 * not. Saving again replaces what they gave before (the API keeps one review
 * per shopper per product), so the same form creates and edits.
 */
function ReviewForm({ productId, viewerReview }: { productId: string; viewerReview: Review | null }) {
  const t = useTranslation();
  const rateProduct = useRateProduct(productId);
  const deleteReview = useDeleteReview(productId);
  const [rating, setRating] = useState(viewerReview?.rating ?? 0);
  const [body, setBody] = useState(viewerReview?.body ?? '');
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const pending = rateProduct.isPending || deleteReview.isPending;
  const changed = !viewerReview || rating !== viewerReview.rating || body.trim() !== (viewerReview.body ?? '');
  const canSubmit = rating > 0 && changed && !pending;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    // Nothing is cleared here. On success the list refetches and this form
    // remounts from the saved review (see the `key` where it is rendered);
    // on a rejection, e.g. moderation, the draft stays as typed.
    rateProduct.mutate({ rating, body: body.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg bg-surface-muted p-4 sm:p-5">
      <p className="text-sm font-semibold text-content">{viewerReview ? t.reviews.yourRating : t.reviews.rateThis}</p>

      <div className="mt-2">
        <StarRatingInput
          value={rating}
          onChange={setRating}
          legend={t.reviews.yourRating}
          optionLabel={t.reviews.starOption}
          name={`rating-${productId}`}
          disabled={pending}
        />
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t.reviews.commentPlaceholder}
        aria-label={`${t.reviews.commentLabel} ${t.common.optional}`}
        maxLength={MAX_BODY_LENGTH}
        rows={3}
        className="mt-3 w-full resize-none rounded-md border border-border bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rateProduct.isPending ? t.common.saving : viewerReview ? t.reviews.update : t.reviews.submit}
        </button>

        {viewerReview && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmRemoveOpen(true)}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-content-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.reviews.remove}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title={t.reviews.removeTitle}
        message={viewerReview?.body ? t.reviews.removeMessageWithComment : t.reviews.removeMessage}
        confirmLabel={t.common.remove}
        danger
        onCancel={() => setConfirmRemoveOpen(false)}
        onConfirm={() => {
          deleteReview.mutate();
          setConfirmRemoveOpen(false);
        }}
      />
    </form>
  );
}

function ReviewItem({ review }: { review: ListedReview }) {
  const t = useTranslation();
  const format = useFormat();

  return (
    <li className="flex gap-3 py-4">
      <Avatar name={review.author.name} avatarUrl={review.author.avatarUrl} className="h-8 w-8 text-sm" />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-content">{review.author.name}</span>
          <span className="text-xs text-content-muted">{format.date(review.updatedAt)}</span>
        </div>
        <StarRating
          value={review.rating}
          size={14}
          label={t.reviews.outOfFive(String(review.rating))}
          className="mt-1"
        />
        <p className="mt-1 whitespace-pre-line text-sm text-content">{review.body}</p>
      </div>
    </li>
  );
}

/**
 * Star ratings for a product: the average and its breakdown, the reader's own
 * rating, and the ratings that came with a comment. Separate from the comment
 * thread below it, which is a conversation rather than a score.
 */
export default function ReviewsSection({ productId }: Props) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReviews(productId, page);
  const t = useTranslation();

  const isLoggedIn = hasHydrated && Boolean(accessToken);
  const totalPages = data ? Math.ceil(data.total / REVIEWS_PAGE_SIZE) : 0;
  const viewerReview = data?.viewerReview ?? null;

  return (
    // scroll-mt clears the sticky navbar when the rating under the product
    // title links here.
    <section id="reviews" className="mt-16 scroll-mt-24 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-content">{t.reviews.heading}</h2>

      {isLoading && <p className="mt-4 text-sm text-content-muted">{t.reviews.loading}</p>}

      {data && <RatingOverview summary={data.summary} />}

      {data &&
        (isLoggedIn ? (
          <ReviewForm
            // Remounts from the server's copy whenever that copy changes
            // (saved, removed, or edited in another tab), which is simpler
            // and safer than syncing three pieces of state in an effect.
            key={viewerReview ? `${viewerReview.id}-${viewerReview.updatedAt}` : 'new'}
            productId={productId}
            viewerReview={viewerReview}
          />
        ) : (
          <p className="mt-6 text-sm text-content-muted">
            <a href="/login" className="text-brand hover:underline">
              {t.reviews.logInPrompt}
            </a>
            {t.reviews.logInSuffix}
          </p>
        ))}

      {data && data.total > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold text-content">{t.reviews.writtenHeading(data.total)}</h3>
          <ul className="mt-1 divide-y divide-border">
            {data.items.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </ul>
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
}
