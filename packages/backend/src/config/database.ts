import mongoose from 'mongoose';
import config from './environment';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cached connection promise — critical for serverless (Netlify Functions),
// where the same warm container may handle many invocations and must NOT
// open a new MongoDB connection on every request.
let cachedConnection: Promise<typeof mongoose> | null = null;

/**
 * Connect to MongoDB, reusing an existing/in-flight connection when possible.
 *
 * - In a long-running server (index.ts) this is called once at startup.
 * - In serverless it is called at the top of every invocation; if the
 *   container is warm and already connected, it returns immediately.
 */
export const connectDatabase = async (): Promise<void> => {
  // Already connected on this (warm) instance.
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // A connection attempt is already in flight — await the same promise.
  if (cachedConnection) {
    await cachedConnection;
    return;
  }

  cachedConnection = mongoose.connect(config.mongodb.uri, {
    // Fail fast on cold serverless invocations instead of hanging.
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await cachedConnection;
    logger.success('MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    // Reset so the next invocation can retry a fresh connection.
    cachedConnection = null;
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Blocking connect with retries — used only by the long-running server
 * (index.ts). Serverless callers should use connectDatabase() directly.
 */
export const connectDatabaseWithRetry = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await connectDatabase();
      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt === MAX_RETRIES) {
        logger.fatal('All MongoDB connection attempts failed');
        process.exit(1);
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — Mongoose will attempt to reconnect automatically');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error:', error);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});
