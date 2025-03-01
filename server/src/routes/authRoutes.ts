import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
import bcrypt from 'bcrypt';
import { prisma } from '~/lib/prisma';

export const authRoutes = (app: Elysia) =>
  app
    .state('jwt', null as null | ReturnType<typeof jwt>)
    .state('setCookie', null as null | {
      set: {
        cookie: (options: { name: string; value: string; options?: Record<string, any> }) => void
    }
    })
    .use(jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'supersecretkey',
      exp: '7d',
    }))
    .use(cookie())
    .post('/auth/logout', ({ setCookie }) => {
      setCookie('auth_token', '', { maxAge: 0 });
      return { message: 'Успешный выход' };
    })
    .post('/auth/register', async ({ body }) => {
      const { name, password } = body as { name: string; password: string };
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { name, password: hashedPassword, role: 'user' },
      });

      return { success: true, user };
    })
    .post('/auth/login', async ({ body, setCookie, jwt }) => {
      const { email, password } = body as { email: string; password: string };
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password || ''))) {
        return { success: false, message: 'Invalid credentials' };
      }

      const token = await jwt.sign({ id: user.id, email: user.email || '' });
      setCookie('token', token, { httpOnly: true });
      return { success: true, token };
    })
    .get('/auth/me', async ({ jwt, headers }) => {
      const token = headers.authorization?.split(' ')[1];
      if (!token) return { success: false };

      const payload = await jwt.verify(token);
      if (!payload) return { success: false };

      return { success: true, user: payload };
    })