import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import corsOptions from './config/cors';
import config from './config/environment';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

const app: Application = express();

// Serve frontend static files FIRST (before CORS/helmet) when this app is the
// single service for both API and frontend. Disabled on Netlify (CDN serves it).
if (config.serveStatic) {
  const frontendPath = path.join(process.cwd(), 'packages/frontend/dist');
  logger.info('Serving frontend from:', frontendPath);
  app.use(express.static(frontendPath));
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
const SENSITIVE_KEYS = new Set(['password', 'token', 'refreshToken', 'accessToken', 'otp']);
const redactSensitive = (obj: Record<string, any>): Record<string, any> => {
  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    redacted[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : value;
  }
  return redacted;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log incoming request with args
  const args: Record<string, any> = {};
  if (req.body && Object.keys(req.body).length > 0) args.body = redactSensitive(req.body);
  if (Object.keys(req.query).length > 0) args.query = req.query;
  if (Object.keys(req.params).length > 0) args.params = req.params;

  logger.info(`→ ${req.method} ${req.originalUrl}`, Object.keys(args).length > 0 ? args : '');

  // Log response
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const line = `← ${req.method} ${req.originalUrl} ${status} ${ms}ms`;
    if (status >= 500) {
      logger.error(line);
    } else if (status >= 400) {
      logger.warn(line);
    } else {
      logger.success(line);
    }
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
    },
  });
});

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// Serve frontend catch-all when this app also serves the frontend.
// On Netlify the function only handles /api/*, so unmatched routes should
// return a JSON 404 instead of trying to send index.html.
if (config.serveStatic) {
  const frontendPath = path.join(process.cwd(), 'packages/frontend/dist');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.use(notFoundHandler);
}

// Error handler (must be last)
app.use(errorHandler);

export default app;
