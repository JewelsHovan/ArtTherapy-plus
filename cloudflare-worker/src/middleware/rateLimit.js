/**
 * Rate limiting middleware using D1 database
 *
 * Implements a sliding window rate limiter to prevent brute force attacks
 * on authentication endpoints.
 *
 * SECURITY: Rate limiting is essential for:
 * - Preventing password brute force attacks
 * - Preventing account enumeration via signup
 * - Protecting against credential stuffing
 */

/**
 * Rate limit configuration per endpoint
 */
const RATE_LIMITS = {
  login: {
    windowMs: 60 * 1000,      // 1 minute window
    maxRequests: 5,           // 5 attempts per window
    blockDurationMs: 5 * 60 * 1000  // 5 minute block after exceeding
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour window
    maxRequests: 3,           // 3 signups per window
    blockDurationMs: 60 * 60 * 1000  // 1 hour block after exceeding
  }
};

/**
 * Check if a request should be rate limited
 *
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment with D1 binding
 * @param {string} endpoint - 'login' | 'signup'
 * @returns {Promise<{allowed: boolean, remaining?: number, retryAfter?: number, error?: string, code?: string}>}
 */
export async function checkRateLimit(request, env, endpoint) {
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    return { allowed: true };
  }

  // Get client IP from Cloudflare headers
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
             'unknown';

  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Clean up old records and count recent attempts in one transaction
    // First, delete expired records for this IP/endpoint
    await env.DB.prepare(`
      DELETE FROM rate_limits
      WHERE ip = ? AND endpoint = ? AND timestamp < ?
    `).bind(ip, endpoint, windowStart).run();

    // Count attempts in current window
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM rate_limits
      WHERE ip = ? AND endpoint = ? AND timestamp >= ?
    `).bind(ip, endpoint, windowStart).first();

    const currentCount = countResult?.count || 0;

    // Check if rate limit exceeded
    if (currentCount >= config.maxRequests) {
      // Find when the oldest request in window will expire
      const oldestResult = await env.DB.prepare(`
        SELECT MIN(timestamp) as oldest FROM rate_limits
        WHERE ip = ? AND endpoint = ?
      `).bind(ip, endpoint).first();

      const retryAfter = oldestResult?.oldest
        ? Math.ceil((oldestResult.oldest + config.windowMs - now) / 1000)
        : Math.ceil(config.blockDurationMs / 1000);

      return {
        allowed: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.max(1, retryAfter),
        remaining: 0
      };
    }

    // Record this attempt
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO rate_limits (id, ip, endpoint, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(id, ip, endpoint, now).run();

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1
    };

  } catch (error) {
    // If rate limiting fails (e.g., table doesn't exist), allow the request
    // but log the error. Don't block legitimate users due to infra issues.
    console.error('Rate limit check failed:', error);

    // Return allowed but with a warning
    return {
      allowed: true,
      remaining: -1,  // Indicates unknown
      warning: 'Rate limiting unavailable'
    };
  }
}

/**
 * Get rate limit headers for response
 *
 * @param {Object} rateLimitResult - Result from checkRateLimit
 * @returns {Object} Headers to add to response
 */
export function getRateLimitHeaders(rateLimitResult) {
  const headers = {};

  if (rateLimitResult.remaining !== undefined && rateLimitResult.remaining >= 0) {
    headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
  }

  if (rateLimitResult.retryAfter) {
    headers['Retry-After'] = rateLimitResult.retryAfter.toString();
  }

  return headers;
}
