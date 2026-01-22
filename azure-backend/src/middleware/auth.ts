/**
 * Authentication middleware
 *
 * Verifies JWT tokens and attaches user information to the request.
 * Ported from Cloudflare Worker implementation.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJWT, TokenPayload } from '../utils/jwt.js';
import { query } from '../db/index.js';
import { config } from '../config/index.js';

/**
 * Authenticated user information attached to requests
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  microsoftId: string | null;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Result of authentication verification
 */
interface AuthResult {
  valid: boolean;
  user?: AuthenticatedUser;
  error?: string;
  code?: string;
}

/**
 * Verify authentication and get user from database
 *
 * @param authHeader - Authorization header value
 * @returns Authentication result with user or error
 */
async function verifyAuth(authHeader: string | undefined): Promise<AuthResult> {
  try {
    // Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'No token provided',
        code: 'NO_TOKEN',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT signature and expiration
    let payload: TokenPayload;
    try {
      payload = await verifyJWT(token, config.jwt.secret);
    } catch {
      return {
        valid: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      };
    }

    if (!payload.userId || typeof payload.userId !== 'string') {
      return {
        valid: false,
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN',
      };
    }

    // Query database for user
    const users = await query<{
      id: string;
      microsoft_id: string | null;
      email: string;
      name: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, microsoft_id, email, name, avatar_url
       FROM users
       WHERE id = @p0`,
      [payload.userId]
    );

    if (users.length === 0) {
      return {
        valid: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    const user = users[0];

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        microsoftId: user.microsoft_id,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      code: 'AUTH_FAILED',
    };
  }
}

/**
 * Authentication middleware for protected routes
 *
 * Verifies the JWT token in the Authorization header and attaches
 * the authenticated user to the request object.
 *
 * @example
 * ```typescript
 * app.get('/api/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
 *   const user = req.user!;
 *   res.json({ user });
 * });
 * ```
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authResult = await verifyAuth(req.headers.authorization);

  if (!authResult.valid) {
    res.status(401).json({
      error: authResult.error,
      code: authResult.code,
    });
    return;
  }

  // Attach user to request
  req.user = authResult.user;
  next();
}

/**
 * Optional authentication middleware
 *
 * Like authMiddleware, but doesn't fail if no token is provided.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // If no auth header, continue without user
  if (!authHeader) {
    next();
    return;
  }

  const authResult = await verifyAuth(authHeader);

  // If auth fails, continue without user (don't fail the request)
  if (authResult.valid && authResult.user) {
    req.user = authResult.user;
  }

  next();
}
