import { useEffect, useState } from 'react';
import {
  useActivateUser,
  useAdminUserDetail,
  useDeactivateUser,
  useUpdateUserPermissions,
  useUpdateUserRole,
} from '@/lib/queries/admin';
import { useAuthStore } from '@/stores/auth-store';
import type { Permission, Role } from '@/lib/types';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import Avatar from '../Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { can } from '@/lib/permissions';

const ROLES: Role[] = ['CUSTOMER', 'STAFF', 'ADMIN'];
// Labels live in the dictionaries (admin.users.permissionLabels), keyed by
// the same permission string the backend uses.
const PERMISSIONS: Permission[] = [
  'users:view',
  'users:manage',
  'products:view',
  'products:manage',
  'categories:view',
  'categories:manage',
  'analytics:view',
  'orders:view',
];

const selectClass =
  'mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-content focus:border-brand focus:outline-none';

interface Props {
  id: string;
}

export default function AdminUserDetailView({ id }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const { data: detail, isLoading } = useAdminUserDetail(id);
  const updateRole = useUpdateUserRole();
  const updatePermissions = useUpdateUserPermissions();
  const deactivate = useDeactivateUser();
  const activate = useActivateUser();

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const t = useTranslation();
  const format = useFormat();

  useEffect(() => {
    if (detail) {
      setSelectedPermissions(detail.permissions);
    }
  }, [detail]);

  if (isLoading || !detail) {
    return <p className="text-content-muted">{t.common.loading}</p>;
  }

  const isSelf = currentUser?.id === detail.id;
  const canManageRolePermissions = currentUser?.role === 'ADMIN';
  const canManageActive = can(currentUser, 'users:manage');
  const permissionsDirty =
    selectedPermissions.length !== detail.permissions.length ||
    !selectedPermissions.every((permission) => detail.permissions.includes(permission));

  function togglePermission(permission: Permission) {
    setSelectedPermissions((current) =>
      current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission],
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={detail.name} avatarUrl={detail.avatarUrl} className="h-14 w-14 text-lg" />
        <div>
          <h1 className="text-xl font-semibold text-content">{detail.name}</h1>
          <p className="text-sm text-content-muted">{detail.email}</p>
        </div>
        {detail.isActive ? (
          <span className="ml-auto rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
            {t.admin.users.active}
          </span>
        ) : (
          <span className="ml-auto rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
            {t.admin.users.deactivated}
          </span>
        )}
      </div>

      {isSelf && (
        <p className="mt-4 rounded-md bg-warning-soft px-4 py-2 text-sm text-warning">
          {t.admin.users.selfWarning}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-content">{t.admin.users.role}</h2>
        {canManageRolePermissions ? (
          <select
            value={detail.role}
            disabled={isSelf || updateRole.isPending}
            onChange={(event) => updateRole.mutate({ id: detail.id, role: event.target.value as Role })}
            className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 text-sm text-content">{detail.role}</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-content">{t.admin.users.permissions}</h2>
        <p className="text-xs text-content-muted">{t.admin.users.permissionsHint}</p>
        <div className="mt-2 space-y-1.5">
          {PERMISSIONS.map((permission) => (
            <label key={permission} className="flex items-center gap-2 text-sm text-content">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission)}
                disabled={!canManageRolePermissions || isSelf}
                onChange={() => togglePermission(permission)}
                className="rounded border-border"
              />
              {t.admin.users.permissionLabels[permission]}
            </label>
          ))}
        </div>
        {canManageRolePermissions && !isSelf && (
          <button
            type="button"
            disabled={!permissionsDirty || updatePermissions.isPending}
            onClick={() => updatePermissions.mutate({ id: detail.id, permissions: selectedPermissions })}
            className="mt-3 cursor-pointer rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatePermissions.isPending ? t.common.saving : t.admin.users.savePermissions}
          </button>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-content">{t.admin.users.signInMethods}</h2>
        <p className="mt-1 text-sm text-content-muted">
          {detail.hasPassword ? t.admin.users.passwordSet : t.admin.users.passwordNotSet}
        </p>
        {detail.oauthAccounts.length > 0 ? (
          <ul className="mt-1 space-y-1 text-sm text-content-muted">
            {detail.oauthAccounts.map((account) => (
              <li key={`${account.provider}-${account.providerAccountId}`}>
                {t.admin.users.linkedOn(account.provider, format.date(account.createdAt))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-content-muted">{t.admin.users.noProviders}</p>
        )}
      </section>

      {canManageActive && !isSelf && (
        <section className="mt-6">
          {detail.isActive ? (
            <button
              type="button"
              disabled={deactivate.isPending}
              onClick={() => setConfirmingDeactivate(true)}
              className="cursor-pointer rounded-md border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.admin.users.deactivateAccount}
            </button>
          ) : (
            <button
              type="button"
              disabled={activate.isPending}
              onClick={() => activate.mutate({ id: detail.id })}
              className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activate.isPending ? t.admin.users.reactivating : t.admin.users.reactivateAccount}
            </button>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmingDeactivate}
        title={t.admin.users.deactivateAccount}
        message={t.admin.users.deactivateMessage(detail.name)}
        confirmLabel={t.admin.users.deactivate}
        danger
        onCancel={() => setConfirmingDeactivate(false)}
        onConfirm={() => {
          setConfirmingDeactivate(false);
          deactivate.mutate({ id: detail.id });
        }}
      />
    </div>
  );
}
