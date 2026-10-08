interface Props {
  rows?: number;
}

// Stand-in for an admin table or list while its first page loads: a bordered
// box of rows at the real row height, so the page doesn't jump from a line of
// "Loading…" text to a full table.
export default function AdminListSkeleton({ rows = 6 }: Props) {
  return (
    <div className="animate-pulse divide-y divide-border rounded-lg border border-border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="size-10 shrink-0 rounded-full bg-surface-muted" />
          <div className="h-4 w-1/4 rounded bg-surface-muted" />
          <div className="h-4 w-1/3 rounded bg-surface-muted" />
          <div className="ml-auto h-5 w-16 rounded-full bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}
