import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { UserSearch } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getQueryClient } from '@/lib/query-client';
import { getRealtimeSocket } from '@/lib/realtime';
import { useAdminUsers } from '@/lib/queries/admin';
import { useAuthStore } from '@/stores/auth-store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRequireAdminAccess } from '@/hooks/useRequireAdminAccess';
import type { User } from '@/lib/types';
import { useDocumentTitle, useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import Avatar from '../Avatar';
import Pagination from '../ui/Pagination';
import Sidebar from '../ui/Sidebar';
import AdminEmptyState from './AdminEmptyState';
import AdminListSkeleton from './AdminListSkeleton';
import AdminPageHeader from './AdminPageHeader';
import AdminSearchInput from './AdminSearchInput';
import AdminUserDetailView from './AdminUserDetailView';
import { PILL_CLASS, ROLE_STYLES } from './status-styles';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { TABLE_HEAD_CLASS, TABLE_WRAPPER_CLASS, TD_CLASS, TH_CLASS } from './list-styles';


function AdminUsersListInner() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const isFirstFilterRun = useRef(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const t = useTranslation();
  const format = useFormat();

  const { data, isLoading } = useAdminUsers({ page, search: debouncedSearch || undefined });

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch]);

  // The server only routes `user.registered` to sockets whose owner can see
  // the users list (ADMIN, or STAFF with users:view) -- see RealtimeGateway.
  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const socket = getRealtimeSocket(accessToken);
    function handleRegistered(user: User) {
      toast.success(t.admin.users.registered(user.name));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
    socket.on('user.registered', handleRegistered);
    return () => {
      socket.off('user.registered', handleRegistered);
    };
  }, [accessToken, queryClient, t]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <AdminPageHeader title={t.admin.users.heading} count={data?.total} />

      <div className="mt-6">
        <AdminSearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t.admin.users.searchPlaceholder}
          label={t.admin.users.searchLabel}
        />
      </div>

      <div className="mt-6">
        {isLoading && <AdminListSkeleton />}

        {!isLoading && data && data.items.length === 0 && (
          <AdminEmptyState icon={UserSearch} message={t.admin.users.noMatches} />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <>
            <div className={TABLE_WRAPPER_CLASS}>
              <table className="w-full text-left text-sm">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={TH_CLASS}>{t.admin.users.name}</th>
                    <th className={TH_CLASS}>{t.admin.users.role}</th>
                    <th className={TH_CLASS}>{t.admin.users.status}</th>
                    <th className={`${TH_CLASS} hidden lg:table-cell`}>{t.admin.users.joined}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-surface-muted">
                      <td className={TD_CLASS}>
                        {/* Name and email share a cell under the avatar's
                            side, so the row reads as one person rather than
                            three loose columns. The button still carries the
                            name alone as its accessible text. */}
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(user.id)}
                              className="block cursor-pointer truncate font-semibold text-content hover:underline"
                            >
                              {user.name}
                            </button>
                            <p className="truncate text-content-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <span className={`${PILL_CLASS} ${ROLE_STYLES[user.role]}`}>{user.role}</span>
                      </td>
                      <td className={TD_CLASS}>
                        {user.isActive ? (
                          <span className={`${PILL_CLASS} bg-success-soft text-success`}>{t.admin.users.active}</span>
                        ) : (
                          <span className={`${PILL_CLASS} bg-danger-soft text-danger`}>{t.admin.users.deactivated}</span>
                        )}
                      </td>
                      <td className={`${TD_CLASS} hidden tabular-nums text-content-muted lg:table-cell`}>
                        {format.date(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Sidebar open={selectedUserId !== null} onClose={() => setSelectedUserId(null)} title={t.admin.users.detailsTitle}>
        {selectedUserId !== null && <AdminUserDetailView id={selectedUserId} />}
      </Sidebar>
    </div>
  );
}

export default function AdminUsersListView() {
  const { authorized } = useRequireAdminAccess('users:view');
  const t = useTranslation();

  useDocumentTitle(t.admin.title);

  if (!authorized) {
    return <AdminListSkeleton />;
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AdminUsersListInner />
    </QueryClientProvider>
  );
}
