import type { YogaInitialContext } from 'graphql-yoga';

import { isProduction } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import {
  type AuthUser,
  resolveAuthUser,
} from '~/modules/auth/resolve-auth-user';
import { usersService } from '~/modules/users/users.service';

export type GraphQLContext = {
  prisma: typeof prisma;
  user: AuthUser | null;
};

export async function createContext(
  initial?: YogaInitialContext
): Promise<GraphQLContext> {
  const request = initial?.request;
  let user: AuthUser | null = null;

  if (request) {
    user = await resolveAuthUser(request);
  }

  // Локальная разработка без сессии — владелец каталога
  if (!user && !isProduction) {
    const owner = await usersService.getOwner();
    if (owner) {
      user = {
        id: owner.id,
        role: owner.role,
        username: owner.username,
        telegramId: owner.telegramId,
      };
    }
  }

  return { prisma, user };
}
