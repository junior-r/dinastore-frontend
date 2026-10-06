import { CircleAlert } from 'lucide-react';

interface Props {
  message: string | null;
}

// The form-level error. `role="alert"` makes a screen reader announce it the
// moment it is inserted, so it is rendered only while there is a message
// rather than kept as an empty region (which would also leave a stray gap in
// the form's spacing).
export default function AuthError({ message }: Props) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
      <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}
