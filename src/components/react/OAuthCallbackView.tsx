import { useEffect, useState } from 'react';
import { me } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useDocumentTitle, useTranslation } from '@/i18n';

export default function OAuthCallbackView() {
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  useDocumentTitle(t.auth.callbackTitle);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setError(t.auth.missingToken);
      return;
    }

    me(token)
      .then((user) => {
        setSession(token, user);
        window.location.href = '/account';
      })
      .catch(() => setError(t.auth.callbackFailed));
  }, [setSession, t]);

  if (error) {
    return (
      <div className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
        {error} <a href="/login" className="underline">{t.auth.backToLogin}</a>
      </div>
    );
  }

  return <p className="text-content-muted">{t.auth.signingIn}</p>;
}
