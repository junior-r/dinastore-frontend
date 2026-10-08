import { Check } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { login, register } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';
import { toastOnNextLoad } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import { useDocumentTitle, useTranslation } from '@/i18n';
import AuthError from './auth/AuthError';
import AuthField from './auth/AuthField';
import AuthShell from './auth/AuthShell';
import AuthSubmitButton from './auth/AuthSubmitButton';
import OAuthButtons from './OAuthButtons';

// Mirrors the backend's rule (and the wording of t.auth.passwordHint).
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslation();

  useDocumentTitle(t.auth.registerTitle);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register({ email, password, name });
      const result = await login({ email, password });
      setSession(result.accessToken, result.user);
      toastOnNextLoad('success', t.auth.welcome(result.user.name.split(' ')[0]));
      window.location.href = '/account';
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.auth.genericError;
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH;

  return (
    <AuthShell heading={t.auth.registerHeading} intro={t.home.joinBody} panelHeading={t.home.joinHeading}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />

          <AuthField id="name" label={t.auth.name} type="text" autoComplete="name" value={name} onChange={setName} />
          <AuthField
            id="email"
            label={t.auth.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <AuthField
            id="password"
            label={t.auth.password}
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={setPassword}
            // The rule is shown from the start and confirms itself as it is
            // met, instead of appearing as an error after a failed submit.
            // The check mark means the state isn't carried by color alone.
            hint={
              <p
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordLongEnough ? 'font-medium text-success' : 'text-content-muted'
                }`}
              >
                {passwordLongEnough && <Check aria-hidden="true" size={14} />}
                {t.auth.passwordHint}
              </p>
            }
          />

          <AuthSubmitButton label={t.nav.signUp} pendingLabel={t.auth.creatingAccount} pending={submitting} />
        </form>

        <OAuthButtons />

        <p className="text-center text-sm text-content-muted">
          {t.auth.hasAccount}{' '}
          <a href="/login" className="font-semibold text-brand hover:underline">
            {t.nav.logIn}
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
