interface Props {
  name: string;
  avatarUrl: string | null;
  className?: string;
}

// Shows the OAuth provider's profile photo when the user has one; otherwise
// falls back to a circle with their initial. Password-only accounts never
// have an avatarUrl, so they always get the initial.
export default function Avatar({ name, avatarUrl, className = 'h-6 w-6 text-xs' }: Props) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-medium text-brand-content ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
