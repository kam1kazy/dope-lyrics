// src/graphql/context.ts
import { prisma } from '../prisma';
import { verify } from 'jsonwebtoken';
import { CookieRequest } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';

export interface GraphQLContext {
  prisma: typeof prisma;
  setCookie: (name: string, value: string, options?: { maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string }) => void;
  user?: { id: string; role: string } | null;
  jwt: ReturnType<typeof jwt>;
  cookie?: Record<string, string>;
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
  
  // Получаем куки из запроса
  const cookieHeader = request.headers.get('Cookie');
  const cookies: Record<string, string> = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }
  
  // Функция для установки кук (будет использоваться в резолверах)
  // Обратите внимание: эта функция не устанавливает куки напрямую,
  // а будет использоваться в резолверах для формирования ответа
  const setCookie = (name: string, value: string, options: { maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string } = {}) => {
    // Эта функция будет использоваться в резолверах
    // Фактическая установка кук происходит в ответе GraphQL
    return { name, value, options };
  };

  try {
    // Проверяем токен из заголовка Authorization
    const authHeader = request.headers.get('Authorization');
    if(!process.env.JWT_SECRET) throw new Error('JWT_SECRET не установлен');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = await verify(token, process.env.JWT_SECRET);

      if (typeof decoded !== 'string' && decoded) {
        user = { id: decoded.id.toString(), role: decoded.role };
      }
    }
    
    // Если нет токена в заголовке, проверяем токен из куки
    else if (cookies.token) {
      try {
        const decoded = await verify(cookies.token, process.env.JWT_SECRET);
        if (typeof decoded !== 'string' && decoded) {
          user = { id: decoded.id.toString(), role: decoded.role };
        }
      } catch (error) {
        console.warn('Ошибка проверки токена из куки:', error);
      }
    }
  } catch (error) {
    console.warn('Ошибка аутентификации:', error);
  }

  return { 
    prisma, 
    user, 
    setCookie, 
    jwt: jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET as string
    }) as ReturnType<typeof jwt>, 
    cookie: cookies
  };
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
