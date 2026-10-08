import type { Permission, User } from './types';

type RoleHolder = Pick<User, 'role'>;
type PermissionHolder = Pick<User, 'role' | 'permissions'>;

/** Whether this account may enter the admin panel at all. */
export function isStaff(user: RoleHolder | null | undefined): boolean {
  return user?.role === 'ADMIN' || user?.role === 'STAFF';
}

/**
 * Whether this account holds a permission. ADMIN holds all of them; STAFF
 * only what it was granted. This mirrors the backend's PermissionsGuard and
 * must stay in step with it.
 *
 * It only decides what to show. The server checks every request itself, so a
 * wrong answer here can hide or reveal a button but never grant access.
 */
export function can(user: PermissionHolder | null | undefined, permission: Permission): boolean {
  if (!user) {
    return false;
  }
  return user.role === 'ADMIN' || user.permissions.includes(permission);
}
