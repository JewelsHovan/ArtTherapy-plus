import { verifyJWT } from '../utils/jwt.js';

/**
 * Verify JWT token and attach user to request context
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings (includes DB, JWT_SECRET)
 * @returns {Promise<Object>} {valid: boolean, user?: Object, error?: string}
 */
export async function verifyAuth(request, env) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT signature and expiration
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload.userId) {
      return {
        valid: false,
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      };
    }

    // Query D1 for user
    const user = await env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return {
        valid: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        microsoftId: user.microsoft_id
      }
    };

  } catch (error) {
    return {
      valid: false,
      error: error.message,
      code: 'AUTH_FAILED'
    };
  }
}
