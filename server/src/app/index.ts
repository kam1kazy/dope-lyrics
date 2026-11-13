import './process-error-handlers';

import { env } from '~/config/env';
import { stopRateLimitCleanup } from '~/config/security';
import { prisma } from '~/infrastructure/prisma';
import { sessionService } from '~/modules/auth/session.service';

import { createApp } from './server';

const SESSION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MARGIN_S = 30;
const BUN_MAX_IDLE_TIMEOUT_S = 255;

/** Bun по умолчанию рвёт молчащее соединение через 10 с, а модель отвечает дольше. */
const idleTimeout = Math.min(
  BUN_MAX_IDLE_TIMEOUT_S,
  Math.ceil(env.AI_TIMEOUT_MS / 1000) + IDLE_TIMEOUT_MARGIN_S
);

const cleanupSessions = () => {
  sessionService.cleanupExpired().catch((error: unknown) => {
    console.error('Не удалось почистить сессии:', error);
  });
};

const app = createApp();

const server = app.listen({
  port: env.PORT,
  hostname: '0.0.0.0',
  idleTimeout,
});

console.log(
  `\n🦊 Elysia is running at http://${server.server?.hostname}:${server.server?.port}/graphql`
);

cleanupSessions();
const sessionCleanupTimer = setInterval(
  cleanupSessions,
  SESSION_CLEANUP_INTERVAL_MS
);

let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log('Shutting down server...');
  stopRateLimitCleanup();
  clearInterval(sessionCleanupTimer);

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
