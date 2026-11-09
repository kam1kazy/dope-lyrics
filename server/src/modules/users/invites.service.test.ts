import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import { invitesService } from '~/modules/users/invites.service';

const BASE_TG = Number(`93${Date.now().toString().slice(-8)}`);
let nextTg = BASE_TG;
const newTelegramId = () => (nextTg += 1);

let ownerId = 0;

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );
  const owner = await prisma.users.create({
    data: {
      username: `inv_owner_${BASE_TG}`,
      telegramId: BigInt(newTelegramId()),
      role: 'ADMIN',
    },
  });
  ownerId = owner.id;
});

afterAll(async () => {
  await prisma.users.deleteMany({
    where: { telegramId: { gte: BigInt(BASE_TG), lte: BigInt(nextTg) } },
  });
});

describe('приглашения', () => {
  test('активация заводит USER и тратит код', async () => {
    const { code } = await invitesService.create(ownerId);
    const telegramId = newTelegramId();

    const first = await invitesService.redeem({ code, telegramId });
    expect(first.status).toBe('created');

    const user = await prisma.users.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
    expect(user?.role).toBe('USER');

    const second = await invitesService.redeem({
      code,
      telegramId: newTelegramId(),
    });
    expect(second.status).toBe('invalid');
  });

  test('просроченное и отозванное не активируются и учётку не заводят', async () => {
    const expired = await invitesService.create(ownerId);
    await prisma.invite.updateMany({
      where: { createdById: ownerId, usedAt: null, revokedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const revoked = await invitesService.create(ownerId);
    const [active] = await invitesService.listActive(ownerId);
    expect(active).toBeDefined();
    expect(await invitesService.revoke(active?.id ?? 0, ownerId)).toBe(true);

    for (const code of [expired.code, revoked.code, 'не-тот-код']) {
      const telegramId = newTelegramId();
      expect((await invitesService.redeem({ code, telegramId })).status).toBe(
        'invalid'
      );
      expect(
        await prisma.users.findUnique({
          where: { telegramId: BigInt(telegramId) },
        })
      ).toBeNull();
    }
  });

  test('чужое приглашение отозвать нельзя', async () => {
    await invitesService.create(ownerId);
    const [invite] = await invitesService.listActive(ownerId);
    const stranger = await prisma.users.create({
      data: {
        username: 'inv_stranger',
        telegramId: BigInt(newTelegramId()),
        role: 'ADMIN',
      },
    });

    expect(await invitesService.revoke(invite?.id ?? 0, stranger.id)).toBe(
      false
    );
    expect(
      (await invitesService.listActive(ownerId)).some(
        (row) => row.id === invite?.id
      )
    ).toBe(true);
  });

  test('аккаунт с учёткой не тратит приглашение', async () => {
    const { code } = await invitesService.create(ownerId);
    const memberTg = newTelegramId();
    await prisma.users.create({
      data: { username: 'inv_member', telegramId: BigInt(memberTg) },
    });

    const result = await invitesService.redeem({ code, telegramId: memberTg });
    expect(result.status).toBe('already-member');

    const fresh = await invitesService.redeem({
      code,
      telegramId: newTelegramId(),
    });
    expect(fresh.status).toBe('created');
  });

  test('два аккаунта на один код — проходит ровно один', async () => {
    const { code } = await invitesService.create(ownerId);

    const results = await Promise.all([
      invitesService.redeem({ code, telegramId: newTelegramId() }),
      invitesService.redeem({ code, telegramId: newTelegramId() }),
    ]);

    expect(results.filter((r) => r.status === 'created')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'invalid')).toHaveLength(1);
  });

  test('в списке нет использованных', async () => {
    const used = await invitesService.create(ownerId);
    await invitesService.create(ownerId);
    await invitesService.redeem({
      code: used.code,
      telegramId: newTelegramId(),
    });

    const active = await invitesService.listActive(ownerId);
    const usedRow = await prisma.invite.findFirst({
      where: { createdById: ownerId, usedAt: { not: null } },
      orderBy: { usedAt: 'desc' },
    });
    expect(active.some((row) => row.id === usedRow?.id)).toBe(false);
    expect(active.length).toBeGreaterThan(0);
  });
});
