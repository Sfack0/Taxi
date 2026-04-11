import mongoose from 'mongoose';
import config from './environment';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(config.mongodb.uri);
      logger.success('MongoDB connected successfully');
      logger.info(`Database: ${mongoose.connection.name}`);
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
