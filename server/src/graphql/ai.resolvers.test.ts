import { describe, expect, test } from 'bun:test';

import { aiMutationResolvers } from '~/graphql/ai.resolvers';
import type { GraphQLContext } from '~/graphql/context';
import { prisma } from '~/infrastructure/prisma';

const asRole = (role: 'USER' | 'ADMIN'): GraphQLContext => ({
  prisma,
  user: { id: 1, role, username: 'u', telegramId: BigInt(1) },
});

const HIT = { intro: 0, verse: 4, hook: 1, bridge: 0 };

describe('«С нуля» только у владельца', () => {
  for (const role of ['USER', 'ADMIN'] as const) {
    test(`${role}: «Написать» отклонено`, async () => {
      await expect(
        aiMutationResolvers.writeFromScratch(
          null,
          { theme: 'тема', form: HIT },
          asRole(role)
        )
      ).rejects.toThrow('Нет доступа');
    });

    test(`${role}: сохранение отклонено`, async () => {
      await expect(
        aiMutationResolvers.createScratchTrackText(
          null,
          { theme: 'тема', aiText: 'текст' },
          asRole(role)
        )
      ).rejects.toThrow('Нет доступа');
    });
  }
});
