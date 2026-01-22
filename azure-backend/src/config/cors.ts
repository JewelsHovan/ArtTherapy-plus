/**
 * CORS configuration with strict origin whitelisting
 *
 * SECURITY: This configuration implements strict origin validation.
 * - Returns CORS headers ONLY for whitelisted origins
 * - Returns 403 Forbidden for non-whitelisted origins on preflight
 * - Includes Vary: Origin header for proper caching
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Whitelisted origins that are allowed to make cross-origin requests
 */
const ALLOWED_ORIGINS = [
  'https://arttherapy-plus.pages.dev',
  'https://witty-glacier-01b4b7710.2.azurestaticapps.net',
  'http://localhost:5173',
];

/**
 * Check if an origin is whitelisted
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers for a given origin
 * Returns null if origin is not whitelisted
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> | null {
  if (!isOriginAllowed(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin', // Required for proper caching when CORS varies by origin
  };
}

/**
 * Express CORS middleware with strict origin validation
 *
 * SECURITY:
 * - Preflight (OPTIONS) requests from non-whitelisted origins receive 403 Forbidden
 * - Regular requests from non-whitelisted origins receive responses without CORS headers
 *   (browsers will block these due to same-origin policy)
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    if (!corsHeaders) {
      // SECURITY: Reject preflight from non-whitelisted origins with 403
      res.status(403).send('Forbidden');
      return;
    }

    // Set CORS headers and respond to preflight
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(204).send();
    return;
  }

  // For regular requests, add CORS headers if origin is allowed
  if (corsHeaders) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  next();
}

/**
 * Export allowed origins for reference
 */
export { ALLOWED_ORIGINS };
