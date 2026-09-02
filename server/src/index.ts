import './app/process-error-handlers';

import { cors } from '@elysiajs/cors';
import { yoga } from '@elysiajs/graphql-yoga';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { isOriginAllowed } from './config/cors';
import { env, isProduction } from './config/env';
import { securityPlugin, stopRateLimitCleanup } from './config/security';
import { schema } from './graphql/schema';
import { prisma } from './infrastructure/prisma';

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

app.use(yoga(schema));

const server = app.listen({
  port: env.PORT,
  hostname: '0.0.0.0',
});

export type App = typeof app;

console.log(
  `\n🦊 Elysia is running at http://${server.server?.hostname}:${server.server?.port}/${schema.path}`
);

let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log('Shutting down server...');
  stopRateLimitCleanup();

  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error closing database connections:', error);
  }

  try {
    await app.stop();
  } catch (error) {
    console.error('Error closing server:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGUSR2', () => {
  void shutdown();
});
