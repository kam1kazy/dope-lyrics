import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { isOriginAllowed } from '~/config/cors';
import { isProduction } from '~/config/env';
import { securityPlugin } from '~/config/security';
import { graphqlPath, yoga } from '~/graphql/schema';
import { prisma } from '~/infrastructure/prisma';

export function createApp() {
  const app = new Elysia()
    .use(securityPlugin)
    .use(
      cors({
        origin: (request: Request) => {
          const origin = request.headers.get('origin');
          if (!origin) {
            return true;
          }
          return isOriginAllowed(origin);
        },
        credentials: true,
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Apollo-Require-Preflight',
          'X-Request-Id',
        ],
        methods: ['GET', 'POST', 'OPTIONS'],
        maxAge: 86400,
      })
    )
    .get('/health', async () => {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    });

  if (!isProduction) {
    app.use(swagger());
  }

  app.all(`/${graphqlPath}`, ({ request }) => yoga.fetch(request));

  return app;
}

export type App = ReturnType<typeof createApp>;
