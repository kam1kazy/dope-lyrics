import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import type { UserRole } from '~/generated/prisma/client';
import type { GraphQLContext } from '~/graphql/context';
import { resolvers } from '~/graphql/resolvers';
import { prisma } from '~/infrastructure/prisma';

const BASE_TG = Number(`95${Date.now().toString().slice(-8)}`);
let nextTg = BASE_TG;

const contexts: Record<'user' | 'adminA' | 'adminB', GraphQLContext> = {
  user: { prisma, user: null },
  adminA: { prisma, user: null },
  adminB: { prisma, user: null },
};

const makeContext = async (role: UserRole): Promise<GraphQLContext> => {
  nextTg += 1;
  const created = await prisma.users.create({
    data: {
      username: `prof_${nextTg}`,
      telegramId: BigInt(nextTg),
      role,
    },
  });
  return {
    prisma,
    user: {
      id: created.id,
      role: created.role,
      username: created.username,
      telegramId: created.telegramId,
    },
  };
};

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );
  contexts.user = await makeContext('USER');
  contexts.adminA = await makeContext('ADMIN');
  contexts.adminB = await makeContext('ADMIN');
});

afterAll(async () => {
  await prisma.users.deleteMany({
    where: { telegramId: { gt: BigInt(BASE_TG), lte: BigInt(nextTg) } },
  });
  await prisma.$disconnect();
});

describe('профиль', () => {
  test('без сессии профиль не отдаётся', () => {
    expect(() =>
      resolvers.Query.profile(null, {}, { prisma, user: null })
    ).toThrow('Нет доступа');
  });

  test('профиль отдаёт свою учётку', () => {
    const profile = resolvers.Query.profile(null, {}, contexts.user);
    expect(profile).toEqual({
      id: contexts.user.user?.id ?? 0,
      username: contexts.user.user?.username ?? '',
      role: 'USER',
    });
  });
});

describe('приглашения из профиля', () => {
  test('USER не создаёт, не видит и не отзывает приглашения', async () => {
    await expect(
      resolvers.Mutation.createInvite(null, {}, contexts.user)
    ).rejects.toThrow('Нет доступа');
    await expect(
      resolvers.Query.myInvites(null, {}, contexts.user)
    ).rejects.toThrow('Нет доступа');
    expect(() =>
      resolvers.Mutation.revokeInvite(null, { id: 1 }, contexts.user)
    ).toThrow('Нет доступа');
  });

  test('ADMIN создаёт и видит своё приглашение', async () => {
    const created = await resolvers.Mutation.createInvite(
      null,
      {},
      contexts.adminA
    );
    expect(created.code.length).toBeGreaterThan(10);

    const list = await resolvers.Query.myInvites(null, {}, contexts.adminA);
    expect(list.length).toBe(1);
  });

  test('чужое приглашение не отзывается', async () => {
    const [invite] = await resolvers.Query.myInvites(null, {}, contexts.adminA);
    expect(invite).toBeDefined();

    const revoked = await resolvers.Mutation.revokeInvite(
      null,
      { id: invite!.id },
      contexts.adminB
    );
    expect(revoked).toBe(false);

    const stillActive = await resolvers.Query.myInvites(
      null,
      {},
      contexts.adminA
    );
    expect(stillActive.some((item) => item.id === invite!.id)).toBe(true);

    expect(
      await resolvers.Mutation.revokeInvite(
        null,
        { id: invite!.id },
        contexts.adminA
      )
    ).toBe(true);
  });
});
