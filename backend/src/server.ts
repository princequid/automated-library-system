// backend/src/server.ts
// Process entry point. Starts the HTTP server, verifies the Prisma connection,
// warms Redis (with fallback), registers cron jobs, and shuts down gracefully.
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { isRedisFallback } from './config/redis';
import { registerJobs } from './jobs';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Verify DB connectivity early so failures are obvious at boot.
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma.');
  } catch (err) {
    logger.error(`Failed to connect to PostgreSQL: ${(err as Error).message}`);
    process.exit(1);
  }

  if (isRedisFallback()) {
    logger.warn('Redis unavailable - running with in-memory fallback (rate limits and caches are per-process).');
  }

  // Scheduled background jobs (fines, hold expiry, reminders).
  registerJobs();

  const server = app.listen(env.PORT, () => {
    logger.info(`ALMS backend listening on http://localhost:${env.PORT}`);
    logger.info(`API docs at http://localhost:${env.PORT}/api/docs`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received - shutting down gracefully.`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Closed server and disconnected Prisma. Bye.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Fatal boot error: ${(err as Error).message}`);
  process.exit(1);
});
