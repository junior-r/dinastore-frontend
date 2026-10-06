import { LoaderCircle } from 'lucide-react';

interface Props {
  label: string;
  // Shown, with a spinner, while the request is in flight.
  pendingLabel: string;
  pending: boolean;
}

export default function AuthSubmitButton({ label, pendingLabel, pending }: Props) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-content transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* motion-safe: under reduced motion the icon still shows, it just
          doesn't spin, and the label change alone carries the state. */}
      {pending && <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}
