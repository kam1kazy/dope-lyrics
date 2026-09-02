import './process-error-handlers';

import { env } from '~/config/env';
import { stopRateLimitCleanup } from '~/config/security';
import { prisma } from '~/infrastructure/prisma';

import { createApp } from './server';

const app = createApp();

const server = app.listen({
  port: env.PORT,
  hostname: '0.0.0.0',
});

console.log(
  `\n🦊 Elysia is running at http://${server.server?.hostname}:${server.server?.port}/graphql`
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
