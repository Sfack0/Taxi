import app from './app';
import config from './config/environment';
import { connectDatabaseWithRetry } from './config/database';
import logger from './utils/logger';

const startServer = async () => {
  try {
    // Connect to database (blocking, with retries — long-running server)
    await connectDatabaseWithRetry();

    // Start server
    app.listen(config.port, () => {
      logger.success('Server started');
      logger.info(`Environment: ${config.env}`);
      logger.info(`Server running on: http://localhost:${config.port}`);
      logger.info(`API base path: http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.fatal('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
