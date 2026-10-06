// Mirrors ProductCard's box model (4:5 media, then a name line and a price
// line) so the grid doesn't shift when the real cards replace it.
export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="aspect-[4/5] rounded-lg bg-surface-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-surface-muted" />
      <div className="mt-2 h-4 w-1/3 rounded bg-surface-muted" />
    </div>
  );
}
