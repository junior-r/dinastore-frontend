import type { ReactNode } from 'react';

interface Props {
  title: string;
  // Total rows behind the list, shown beside the title. Left out while the
  // first request is still loading.
  count?: number;
  // The page's primary action (e.g. a "New product" button), if any.
  action?: ReactNode;
}

// The title row every admin list page opens with.
export default function AdminPageHeader({ title, count, action }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-content font-stretch-expanded">{title}</h1>
        {count !== undefined && (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm font-medium tabular-nums text-content-muted">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
