import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { db } from './database/connection';
import { redis } from './database/redis';

const PORT = config.port;

async function startServer(): Promise<void> {
  try {
    // Test database connection (optional in development)
    try {
      await db.query('SELECT 1');
      logger.info('Database connected successfully');
    } catch (dbError: any) {
      if (config.nodeEnv === 'development') {
        logger.warn('Database connection failed - server will start but database features will not work', {
          error: dbError.message,
          hint: 'Start PostgreSQL or run: docker-compose up -d postgres',
        });
      } else {
        logger.error('Database connection failed', dbError);
        throw dbError;
      }
    }

    // Test Redis connection (optional in development)
    try {
      await redis.set('health-check', 'ok', 10);
      logger.info('Redis connected successfully');
    } catch (redisError: any) {
      if (config.nodeEnv === 'development') {
        logger.warn('Redis connection failed - server will start but caching will not work', {
          error: redisError.message,
          hint: 'Start Redis or run: docker-compose up -d redis',
        });
      } else {
        logger.error('Redis connection failed', redisError);
        throw redisError;
      }
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: config.nodeEnv,
        port: PORT,
        apiDocs: `http://localhost:${PORT}/api-docs`,
        health: `http://localhost:${PORT}/health`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  await redis.disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

startServer();

