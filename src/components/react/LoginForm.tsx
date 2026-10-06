import { useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';
import { toastOnNextLoad } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import { useDocumentTitle, useTranslation } from '@/i18n';
import AuthError from './auth/AuthError';
import AuthField from './auth/AuthField';
import AuthShell from './auth/AuthShell';
import AuthSubmitButton from './auth/AuthSubmitButton';
import OAuthButtons from './OAuthButtons';

export default function LoginForm() {
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslation();

  useDocumentTitle(t.auth.loginTitle);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login({ email, password });
      setSession(result.accessToken, result.user);
      toastOnNextLoad('success', t.auth.welcomeBack(result.user.name.split(' ')[0]));
      window.location.href = '/account';
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.auth.genericError;
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell heading={t.auth.loginHeading} intro={t.auth.loginIntro} panelHeading={t.home.heading}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />

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
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />

          <AuthSubmitButton label={t.auth.loginHeading} pendingLabel={t.auth.loggingIn} pending={submitting} />
        </form>

        <OAuthButtons />

        <p className="text-center text-sm text-content-muted">
          {t.auth.noAccount}{' '}
          <a href="/register" className="font-semibold text-brand hover:underline">
            {t.nav.signUp}
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
