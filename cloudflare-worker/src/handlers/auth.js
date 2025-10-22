import { generateJWT } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Handle Microsoft OAuth callback
 * Exchange authorization code for access token, fetch user profile,
 * create/load user from D1, and return JWT token
 *
 * @param {Request} request - Incoming request with authorization code
 * @param {Object} env - Environment bindings (DB, secrets, etc.)
 * @returns {Response} JSON response with token and user data
 */
export async function handleMicrosoftCallback(request, env) {
  try {
    const { code } = await request.json();

    if (!code) {
      return errorResponse('Authorization code is required', 'INVALID_REQUEST', 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          code,
          redirect_uri: `${new URL(request.url).origin}/api/auth/microsoft/callback`,
          grant_type: 'authorization_code',
          scope: 'openid email profile'
        })
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Microsoft token exchange failed:', errorData);
      return errorResponse('Failed to authenticate with Microsoft', 'AUTH_FAILED', 401);
    }

    const { access_token } = await tokenResponse.json();

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!profileResponse.ok) {
      console.error('Microsoft Graph API failed');
      return errorResponse('Failed to fetch user profile', 'AUTH_FAILED', 401);
    }

    const profile = await profileResponse.json();

    // Check if user exists in D1
    let user = await env.DB
      .prepare('SELECT * FROM users WHERE microsoft_id = ?')
      .bind(profile.id)
      .first();

    // Create new user if not exists
    if (!user) {
      const userId = crypto.randomUUID();
      await env.DB
        .prepare(`
          INSERT INTO users (id, microsoft_id, email, name, avatar_url)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          profile.id,
          profile.mail || profile.userPrincipalName,
          profile.displayName,
          null  // Microsoft Graph requires additional permissions for photo
        )
        .run();

      user = {
        id: userId,
        microsoft_id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        name: profile.displayName,
        avatar_url: null
      };
    }

    // Generate JWT
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      env.JWT_SECRET
    );

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse('Authentication failed', 'AUTH_FAILED', 401);
  }
}

/**
 * Handle token verification
 * Verify JWT token validity and return user data
 *
 * @param {Request} request - Incoming request with Authorization header
 * @param {Object} env - Environment bindings (DB, secrets, etc.)
 * @returns {Response} JSON response with validation result and user data
 */
export async function handleVerifyToken(request, env) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('No token provided', 'INVALID_TOKEN', 401);
    }

    const token = authHeader.substring(7);

    // Import verifyJWT here to avoid circular dependency issues
    const { verifyJWT } = await import('../utils/jwt.js');

    // Verify JWT signature and expiration
    let payload;
    try {
      payload = await verifyJWT(token, env.JWT_SECRET);
    } catch (error) {
      return errorResponse('Invalid or expired token', 'EXPIRED_TOKEN', 401);
    }

    // Query D1 for user
    const user = await env.DB
      .prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 401);
    }

    return jsonResponse({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return errorResponse('Token verification failed', 'INVALID_TOKEN', 401);
  }
}

/**
 * Handle logout
 * Client-side logout stub (no server action needed with stateless JWT)
 *
 * @returns {Response} JSON success response
 */
export async function handleLogout() {
  return jsonResponse({
    success: true
  });
}
