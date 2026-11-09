import { describe, expect, test } from 'bun:test';

import { can, permissionsForRole } from '~/modules/auth/permissions';

describe('permissions', () => {
  test('USER: каталог и импорт, без db и users', () => {
    const user = { role: 'USER' as const };

    expect(can(user, 'catalog:own')).toBe(true);
    expect(can(user, 'channel:bind')).toBe(true);
    expect(can(user, 'notes:import')).toBe(true);
    expect(can(user, 'db:seed')).toBe(false);
    expect(can(user, 'db:clear')).toBe(false);
    expect(can(user, 'db:parse')).toBe(false);
    expect(can(user, 'users:list')).toBe(false);
    expect(can(user, 'users:role')).toBe(false);
    expect(can(user, 'users:invite')).toBe(false);
    expect(can(user, 'ai:use')).toBe(false);
  });

  test('ADMIN: users:list без разрушающих db и users:role', () => {
    const user = { role: 'ADMIN' as const };

    expect(can(user, 'catalog:own')).toBe(true);
    expect(can(user, 'users:list')).toBe(true);
    expect(can(user, 'users:invite')).toBe(true);
    expect(can(user, 'db:clear')).toBe(false);
    expect(can(user, 'db:seed')).toBe(false);
    expect(can(user, 'db:parse')).toBe(false);
    expect(can(user, 'users:role')).toBe(false);
    expect(can(user, 'ai:use')).toBe(false);
  });

  test('OWNER: все права', () => {
    const user = { role: 'OWNER' as const };
    const permissions = permissionsForRole('OWNER');

    for (const permission of permissions) {
      expect(can(user, permission)).toBe(true);
    }

    expect(can(user, 'db:seed')).toBe(true);
    expect(can(user, 'db:clear')).toBe(true);
    expect(can(user, 'db:parse')).toBe(true);
    expect(can(user, 'users:role')).toBe(true);
    expect(can(user, 'users:invite')).toBe(true);
    expect(can(user, 'ai:use')).toBe(true);
  });

  test('неизвестное право и пустой пользователь запрещены', () => {
    expect(can({ role: 'OWNER' }, 'db:drop-all')).toBe(false);
    expect(can(null, 'catalog:own')).toBe(false);
    expect(can(undefined, 'catalog:own')).toBe(false);
  });
});
