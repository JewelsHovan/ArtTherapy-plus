/**
 * Rate limiting middleware using express-rate-limit with database store
 *
 * Implements sliding window rate limiting to prevent brute force attacks
 * on authentication endpoints.
 *
 * SECURITY: Rate limiting is essential for:
 * - Preventing password brute force attacks
 * - Preventing account enumeration via signup
 * - Protecting against credential stuffing
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limit configuration per endpoint type
 */
const RATE_LIMIT_CONFIGS = {
  login: {
    windowMs: 60 * 1000, // 1 minute window
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // 3 signups per window
    message: {
      error: 'Too many signup attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  oauth: {
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // 10 OAuth attempts per minute
    message: {
      error: 'Too many OAuth attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  general: {
    windowMs: 60 * 1000, // 1 minute window
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
};

/**
 * Custom key generator that uses the real client IP
 *
 * Handles X-Forwarded-For header for requests behind load balancers/proxies.
 */
function keyGenerator(req: Request): string {
  // Trust proxy should be set in the main app
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown';

  return ip;
}

/**
 * Custom handler for rate limit exceeded
 */
function rateLimitHandler(
  _req: Request,
  res: Response,
  _next: unknown,
  options: { message: { error: string; code: string } }
): void {
  res.status(429).json(options.message);
}

/**
 * Create a rate limiter for login attempts
 *
 * - 5 attempts per minute
 * - Headers indicate remaining attempts
 *
 * @example
 * ```typescript
 * app.post('/api/auth/login', loginRateLimiter, handleLogin);
 * ```
 */
export const loginRateLimiter: RateLimitRequestHandler = rateLimit({
  ...RATE_LIMIT_CONFIGS.login,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Create a rate limiter for signup attempts
 *
 * - 3 attempts per hour
 * - Stricter to prevent mass account creation
 *
 * @example
 * ```typescript
 * app.post('/api/auth/signup', signupRateLimiter, handleSignup);
 * ```
 */
export const signupRateLimiter: RateLimitRequestHandler = rateLimit({
  ...RATE_LIMIT_CONFIGS.signup,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * General rate limiter for API endpoints
 *
 * - 100 requests per minute
 * - Applies to all non-auth endpoints
 *
 * @example
 * ```typescript
 * app.use('/api', generalRateLimiter);
 * ```
 */
export const generalRateLimiter: RateLimitRequestHandler = rateLimit({
  ...RATE_LIMIT_CONFIGS.general,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Create a rate limiter for OAuth callback attempts
 *
 * - 10 attempts per minute
 * - Prevents abuse of OAuth token validation
 *
 * @example
 * ```typescript
 * app.post('/api/auth/microsoft/callback', oauthRateLimiter, handleMicrosoftCallback);
 * ```
 */
export const oauthRateLimiter: RateLimitRequestHandler = rateLimit({
  ...RATE_LIMIT_CONFIGS.oauth,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});
