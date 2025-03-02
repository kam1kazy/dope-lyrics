// src/graphql/context.ts
import { prisma } from '../prisma';
import { verify } from 'jsonwebtoken';
import { CookieRequest } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';

export interface GraphQLContext {
  prisma: typeof prisma;
  setCookie: CookieRequest['setCookie']
  user?: { id: string; role: string } | null;
  jwt: ReturnType<typeof jwt>;
}

/**
 * Создает контекст GraphQL с аутентификацией пользователя
 * @param request - Объект HTTP-запроса
 * @returns Объект контекста с клиентом Prisma и аутентифицированным пользователем
 */
export async function createContext({
  request,
}: {
  request: Request;
}): Promise<GraphQLContext> {
  let user: { id: string; role: string } | null = null;

  console.log('request в контексте', request);
  const setCookie = (name: string, value: string, options: { maxAge: number; httpOnly: boolean; secure: boolean }) => {
    request.headers.set('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([key, value]) => `${key}=${value}`).join('; ')}`);
  }
  try {
    const authHeader = request.headers.get('Authorization');
    if(!process.env.JWT_SECRET) throw new Error('JWT_SECRET не установлен');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = await verify(token, process.env.JWT_SECRET);

      if (typeof decoded !== 'string' && decoded) {
        user = { id: decoded.id.toString(), role: decoded.role };
      }
    }
  } catch (error) {
    console.warn('Ошибка аутентификации:', error);
  }

  return { prisma, user, setCookie: setCookie as CookieRequest['setCookie'], jwt: jwt as ReturnType<typeof jwt> };
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Мониторинг производительности запросов Prisma
// @ts-ignore
prisma.$on('query', (e: Prisma.QueryEvent) => {
  console.log(`Запрос ${e.model}.${e.action} занял ${e.duration}мс \n Params: ${e.params} \n Query: ${e.query}`);
})
