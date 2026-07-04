import serverless from 'serverless-http';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import app from '../../packages/backend/src/app';
import { connectDatabase } from '../../packages/backend/src/config/database';

// Wrap the Express app once (module scope) so warm invocations reuse it.
const serverlessHandler = serverless(app);

/**
 * Normalize the incoming path so the Express router (mounted at `/api/v1`)
 * matches regardless of whether Netlify passes the original request path
 * (`/api/v1/...`) or the rewritten function path
 * (`/.netlify/functions/api/v1/...`).
 */
function normalizePath(path: string): string {
  // Strip the function prefix if Netlify rewrote the URL onto it.
  let p = path.replace(/^\/\.netlify\/functions\/api/, '');
  // Ensure the path is rooted under /api so the router matches.
  if (!p.startsWith('/api')) {
    p = '/api' + (p.startsWith('/') ? p : `/${p}`);
  }
  return p;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Don't wait for the Mongo connection pool to drain before responding.
  context.callbackWaitsForEmptyEventLoop = false;

  // Reuse (or lazily open) the MongoDB connection on this warm container.
  await connectDatabase();

  event.path = normalizePath(event.path);

  return serverlessHandler(event, context) as ReturnType<Handler>;
};
