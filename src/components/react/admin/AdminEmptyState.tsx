import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  message: string;
  // What to do about it (e.g. a "New category" button), when there is
  // something the person can do.
  action?: ReactNode;
}

export default function AdminEmptyState({ icon: Icon, message, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-muted px-6 py-14 text-center">
      <Icon aria-hidden="true" className="size-7 text-content-muted" strokeWidth={1.5} />
      <p className="mt-3 text-content-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
