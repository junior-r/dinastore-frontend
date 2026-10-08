import { useReviews } from '@/lib/queries/reviews';
import { useFormat } from '@/lib/format';
import { useTranslation } from '@/i18n';
import StarRating from '../ui/StarRating';

interface Props {
  productId: string;
}

/**
 * The one-line rating under the product title, linking down to the full
 * section. Reads the same query as `ReviewsSection`'s first page, so it costs
 * no extra request. Renders nothing until someone has rated the product: an
 * empty row of stars next to the price would read as a zero.
 */
export default function ProductRatingSummary({ productId }: Props) {
  const { data } = useReviews(productId);
  const t = useTranslation();
  const format = useFormat();

  const summary = data?.summary;
  if (!summary || summary.average === null) {
    return null;
  }

  const average = format.rating(summary.average);

  return (
    <a
      href="#reviews"
      aria-label={`${t.reviews.outOfFive(average)}, ${t.reviews.count(summary.count)}. ${t.reviews.jumpToReviews}`}
      className="mt-3 inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-content"
    >
      <StarRating value={summary.average} />
      <span className="font-medium tabular-nums text-content">{average}</span>
      <span>({t.reviews.count(summary.count)})</span>
    </a>
  );
}
