import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { disconnectRealtimeSocket, getRealtimeSocket } from '@/lib/realtime';
import Modal from './ui/Modal';
import { useTranslation } from '@/i18n';

interface DeactivatedPayload {
  message: string;
  supportUrl: string;
}

// Mounted once in Layout.astro (client:load transition:persist) so it stays
// connected across soft navigations. Holds the app's one realtime socket
// connection open for as long as the user is signed in, and reacts to the
// backend force-ending this session the moment an admin deactivates the
// account -- not just the next time a page happens to reload.
export default function SessionWatcher() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [deactivation, setDeactivation] = useState<DeactivatedPayload | null>(null);
  const t = useTranslation();

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      disconnectRealtimeSocket();
      return;
    }

    const socket = getRealtimeSocket(accessToken);
    function handleDeactivated(payload: DeactivatedPayload) {
      setDeactivation(payload);
      clearSession();
    }
    socket.on('user.deactivated', handleDeactivated);
    return () => {
      socket.off('user.deactivated', handleDeactivated);
    };
  }, [hasHydrated, accessToken, clearSession]);

  function handleClose() {
    setDeactivation(null);
    window.location.href = '/login';
  }

  return (
    <Modal open={deactivation !== null} onClose={handleClose} title={t.session.deactivatedTitle}>
      <div className="space-y-4">
        <p className="text-sm text-content-muted">{deactivation?.message}</p>
        <p className="text-sm text-content-muted">
          {t.session.mistakePrefix}{' '}
          <a href={deactivation?.supportUrl ?? '/support'} className="font-medium text-brand hover:underline">
            {t.session.contactSupport}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="w-full cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-content hover:bg-brand-hover"
        >
          {t.session.goToLogin}
        </button>
      </div>
    </Modal>
  );
}
