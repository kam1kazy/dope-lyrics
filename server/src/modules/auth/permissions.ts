import type { UserRole } from '~/generated/prisma/client';

export const PERMISSIONS = [
  'db:seed',
  'db:clear',
  'db:parse',
  'users:list',
  'users:role',
  'catalog:own',
  'channel:bind',
  'notes:import',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: ReadonlySet<Permission> = new Set(PERMISSIONS);

const USER_PERMISSIONS: ReadonlySet<Permission> = new Set([
  'catalog:own',
  'channel:bind',
  'notes:import',
]);

const ADMIN_PERMISSIONS: ReadonlySet<Permission> = new Set([
  ...USER_PERMISSIONS,
  'users:list',
]);

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  USER: USER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  OWNER: ALL_PERMISSIONS,
};

export type PermissionSubject = {
  role: UserRole;
};

export const isPermission = (value: string): value is Permission =>
  (ALL_PERMISSIONS as ReadonlySet<string>).has(value);

export const permissionsForRole = (role: UserRole): ReadonlySet<Permission> =>
  ROLE_PERMISSIONS[role] ?? new Set();

export const can = (
  user: PermissionSubject | null | undefined,
  permission: Permission | string
): boolean => {
  if (!user) {
    return false;
  }

  if (!isPermission(permission)) {
    return false;
  }

  return permissionsForRole(user.role).has(permission);
};
