import crypto from 'crypto';

// Secret for signing one-click ride-action links embedded in admin emails.
// Reuses JWT_SECRET so no extra configuration is needed.
const secret = (): string => process.env.JWT_SECRET || 'default_secret_change_in_production';

/**
 * HMAC token that authorizes a specific action on a specific ride from an email
 * link (e.g. the admin accepting a booking without logging in). It is bound to
 * the ride id and action, so it cannot be reused for another ride or action.
 */
export const signRideAction = (rideId: string, action: string): string =>
  crypto.createHmac('sha256', secret()).update(`${rideId}:${action}`).digest('base64url');

/** Timing-safe verification of a ride-action token. */
export const verifyRideAction = (rideId: string, action: string, token: string | undefined): boolean => {
  if (!token) return false;
  const expected = Buffer.from(signRideAction(rideId, action));
  const provided = Buffer.from(token);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};

/** Absolute site base URL used to build email links (no trailing slash). */
export const publicBaseUrl = (): string =>
  (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://crete-taxivan.gr').replace(/\/$/, '');
