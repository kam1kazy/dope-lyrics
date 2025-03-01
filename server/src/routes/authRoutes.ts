// src/routes/authRoutes.ts
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

export const authRoutes = (app: Elysia) =>
  app
    .use(jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'supersecretkey',
      exp: '7d',
    }))
    .use(cookie())
    .post('/auth/logout', ({ setCookie }) => {
      setCookie('auth_token', '', { maxAge: 0 });
      return { message: 'Успешный выход' };
    });