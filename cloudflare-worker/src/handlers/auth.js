import { generateJWT } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/**
 * Handle Microsoft OAuth callback
 * Receives access_token from frontend (which did the PKCE token exchange),
 * fetches user profile, creates/loads user from D1, and returns JWT token
 *
 * @param {Request} request - Incoming request with Microsoft access_token
 * @param {Object} env - Environment bindings (DB, secrets, etc.)
 * @param {string|null} origin - Request origin for CORS validation
 * @returns {Response} JSON response with token and user data
 */
export async function handleMicrosoftCallback(request, env, origin = null) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return errorResponse('Access token is required', 'INVALID_REQUEST', 400, origin);
    }

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.error('Microsoft Graph API failed:', profileResponse.status, profileError);
      return errorResponse(
        `Failed to fetch user profile: ${profileResponse.status}`,
        'AUTH_FAILED',
        401,
        origin
      );
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
          INSERT INTO users (id, microsoft_id, email, name, avatar_url, auth_provider, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'microsoft', datetime('now'), datetime('now'))
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
    }, 200, {}, origin);

  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse('Authentication failed', 'AUTH_FAILED', 401, origin);
  }
}

/**
 * Handle token verification
 * Verify JWT token validity and return user data
 *
 * @param {Request} request - Incoming request with Authorization header
 * @param {Object} env - Environment bindings (DB, secrets, etc.)
 * @param {string|null} origin - Request origin for CORS validation
 * @returns {Response} JSON response with validation result and user data
 */
export async function handleVerifyToken(request, env, origin = null) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('No token provided', 'INVALID_TOKEN', 401, origin);
    }

    const token = authHeader.substring(7);

    // Import verifyJWT here to avoid circular dependency issues
    const { verifyJWT } = await import('../utils/jwt.js');

    // Verify JWT signature and expiration
    let payload;
    try {
      payload = await verifyJWT(token, env.JWT_SECRET);
    } catch (error) {
      return errorResponse('Invalid or expired token', 'EXPIRED_TOKEN', 401, origin);
    }

    // Query D1 for user
    const user = await env.DB
      .prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 401, origin);
    }

    return jsonResponse({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url
      }
    }, 200, {}, origin);

  } catch (error) {
    console.error('Token verification error:', error);
    return errorResponse('Token verification failed', 'INVALID_TOKEN', 401, origin);
  }
}

/**
 * Handle email/password signup
 * POST /api/auth/signup
 * Body: { email, password, name }
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {string|null} origin - Request origin for CORS validation
 */
export async function handleSignup(request, env, origin = null) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required', 'MISSING_FIELDS', 400, origin);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email address', 'INVALID_EMAIL', 400, origin);
    }

    // Validate password strength
    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 'WEAK_PASSWORD', 400, origin);
    }

    // Check if email already exists
    const existingUser = await env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      return errorResponse('An account with this email already exists', 'EMAIL_EXISTS', 409, origin);
    }

    // Hash password
    const { hash, salt } = await hashPassword(password);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Insert user into database
    await env.DB
      .prepare(`
        INSERT INTO users (id, email, name, password_hash, password_salt, auth_provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'email', datetime('now'), datetime('now'))
      `)
      .bind(userId, email.toLowerCase(), name || null, hash, salt)
      .run();

    // Generate JWT token
    const token = await generateJWT(
      { userId, email: email.toLowerCase() },
      env.JWT_SECRET
    );

    // Return success response
    return jsonResponse({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || null,
        avatarUrl: null
      }
    }, 201, {}, origin);

  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse('Failed to create account', 'SIGNUP_FAILED', 500, origin);
  }
}

/**
 * Handle email/password login
 * POST /api/auth/login
 * Body: { email, password }
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {string|null} origin - Request origin for CORS validation
 */
export async function handleLogin(request, env, origin = null) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required', 'MISSING_FIELDS', 400, origin);
    }

    // Look up user by email
    const user = await env.DB
      .prepare(`
        SELECT id, email, name, avatar_url, password_hash, password_salt, auth_provider
        FROM users
        WHERE email = ?
      `)
      .bind(email.toLowerCase())
      .first();

    // Generic error message (don't reveal if email exists)
    if (!user) {
      return errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401, origin);
    }

    // Check if user registered with email/password (not OAuth)
    if (user.auth_provider !== 'email') {
      return errorResponse(
        `This email is registered with ${user.auth_provider}. Please use ${user.auth_provider} sign-in`,
        'WRONG_AUTH_PROVIDER',
        401,
        origin
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      user.password_hash,
      user.password_salt
    );

    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401, origin);
    }

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      env.JWT_SECRET
    );

    // Return success response
    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url
      }
    }, 200, {}, origin);

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 'LOGIN_FAILED', 500, origin);
  }
}

/**
 * Handle logout
 * Client-side logout stub (no server action needed with stateless JWT)
 *
 * @param {string|null} origin - Request origin for CORS validation
 * @returns {Response} JSON success response
 */
export async function handleLogout(origin = null) {
  return jsonResponse({
    success: true
  }, 200, {}, origin);
}
