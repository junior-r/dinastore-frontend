import { Eye, EyeOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '@/i18n';

interface Props {
  // Also used as the input's `name`, which is what lets browsers and
  // password managers recognise the field.
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  // Required rather than optional: a sign-in form whose fields don't declare
  // what they are is one password managers fill wrongly or not at all.
  autoComplete: string;
  minLength?: number;
  // Rendered under the input and tied to it with aria-describedby.
  hint?: ReactNode;
}

// One labelled input for the auth forms: label above, optional hint below.
// A password field also gets a show/hide toggle, since a mistyped password
// that can't be seen is the most common reason a sign-in fails.
export default function AuthField({ id, label, type, value, onChange, autoComplete, minLength, hint }: Props) {
  const [revealed, setRevealed] = useState(false);
  const t = useTranslation();
  const isPassword = type === 'password';
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-content">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={id}
          type={isPassword && revealed ? 'text' : type}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hintId}
          // `::-ms-reveal` is Edge's own built-in show-password eye. It is
          // hidden because the toggle below already does that job, and two
          // eyes side by side in one browser only is worse than either alone.
          className={`h-12 w-full rounded-md border border-border bg-surface px-4 text-content transition focus:border-brand focus:ring-4 focus:ring-ring/15 focus:outline-none ${
            isPassword ? 'pr-12 [&::-ms-reveal]:hidden' : ''
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? t.auth.hidePassword : t.auth.showPassword}
            aria-pressed={revealed}
            className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-content-muted transition hover:bg-surface-hover hover:text-content"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && (
        <div id={hintId} className="mt-2 text-sm">
          {hint}
        </div>
      )}
    </div>
  );
}
