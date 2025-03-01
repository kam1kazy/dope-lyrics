// src/graphql/context.ts
import { prisma } from '../lib/prisma';
import { verify } from 'jsonwebtoken';

export interface GraphQLContext {
  prisma: typeof prisma;
  user?: { id: string; role: string } | null;
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
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = await verify(token, process.env.JWT_SECRET || 'supersecretkey');

      if (typeof decoded !== 'string' && decoded) {
        user = { id: decoded.id.toString(), role: decoded.role };
      }
    }
  } catch (error) {
    console.warn('Ошибка аутентификации:', error);
  }

  return { prisma, user };
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
