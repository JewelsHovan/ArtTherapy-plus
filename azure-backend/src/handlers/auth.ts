/**
 * Authentication handlers
 *
 * Handles Microsoft OAuth, email/password authentication, and token management.
 * Ported from Cloudflare Worker implementation.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateJWT, verifyJWT } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { query } from '../db/index.js';
import { config } from '../config/index.js';

/**
 * Handle Microsoft OAuth callback
 *
 * Receives access_token from frontend (which did the PKCE token exchange),
 * fetches user profile from Microsoft Graph, creates/loads user from DB,
 * and returns JWT token.
 *
 * POST /api/auth/microsoft/callback
 * Body: { access_token: string }
 */
export async function handleMicrosoftCallback(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      res.status(400).json({
        error: 'Access token is required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.error('Microsoft Graph API failed:', profileResponse.status, profileError);
      res.status(401).json({
        error: `Failed to fetch user profile: ${profileResponse.status}`,
        code: 'AUTH_FAILED',
      });
      return;
    }

    const profile = await profileResponse.json() as {
      id: string;
      mail?: string;
      userPrincipalName: string;
      displayName: string;
    };

    // Check if user exists in database
    const existingUsers = await query<{
      id: string;
      microsoft_id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, microsoft_id, email, name, avatar_url
       FROM users
       WHERE microsoft_id = @p0`,
      [profile.id]
    );

    let user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    };

    if (existingUsers.length === 0) {
      // Create new user
      const userId = uuidv4();
      const email = profile.mail || profile.userPrincipalName;

      await query(
        `INSERT INTO users (id, microsoft_id, email, name, avatar_url, auth_provider, created_at, updated_at)
         VALUES (@p0, @p1, @p2, @p3, @p4, 'microsoft', GETDATE(), GETDATE())`,
        [userId, profile.id, email, profile.displayName, null]
      );

      user = {
        id: userId,
        email: email,
        name: profile.displayName,
        avatarUrl: null,
      };
    } else {
      const existingUser = existingUsers[0];
      user = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatarUrl: existingUser.avatar_url,
      };
    }

    // Generate JWT
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      config.jwt.secret
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Handle email/password signup
 *
 * POST /api/auth/signup
 * Body: { email: string, password: string, name?: string }
 */
export async function handleSignup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Invalid email address',
        code: 'INVALID_EMAIL',
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        error: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUsers = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = @p0`,
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({
        error: 'An account with this email already exists',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    // Hash password
    const { hash, salt } = await hashPassword(password);

    // Generate user ID
    const userId = uuidv4();

    // Insert user into database
    await query(
      `INSERT INTO users (id, email, name, password_hash, password_salt, auth_provider, created_at, updated_at)
       VALUES (@p0, @p1, @p2, @p3, @p4, 'email', GETDATE(), GETDATE())`,
      [userId, normalizedEmail, name || null, hash, salt]
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId, email: normalizedEmail },
      config.jwt.secret
    );

    // Return success response
    res.status(201).json({
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        name: name || null,
        avatarUrl: null,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Failed to create account',
      code: 'SIGNUP_FAILED',
    });
  }
}

/**
 * Handle email/password login
 *
 * POST /api/auth/login
 * Body: { email: string, password: string }
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Look up user by email
    const users = await query<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
      password_hash: string | null;
      password_salt: string | null;
      auth_provider: string;
    }>(
      `SELECT id, email, name, avatar_url, password_hash, password_salt, auth_provider
       FROM users
       WHERE email = @p0`,
      [normalizedEmail]
    );

    // Generic error message (don't reveal if email exists)
    if (users.length === 0) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const user = users[0];

    // Check if user registered with email/password (not OAuth)
    if (user.auth_provider !== 'email') {
      res.status(401).json({
        error: `This email is registered with ${user.auth_provider}. Please use ${user.auth_provider} sign-in`,
        code: 'WRONG_AUTH_PROVIDER',
      });
      return;
    }

    // Verify password
    if (!user.password_hash || !user.password_salt) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isValidPassword = await verifyPassword(
      password,
      user.password_hash,
      user.password_salt
    );

    if (!isValidPassword) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      config.jwt.secret
    );

    // Return success response
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
}

/**
 * Handle token verification
 *
 * Verify JWT token validity and return user data.
 *
 * POST /api/auth/verify
 * Headers: Authorization: Bearer <token>
 */
export async function handleVerifyToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'No token provided',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT signature and expiration
    let payload;
    try {
      payload = await verifyJWT(token, config.jwt.secret);
    } catch {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'EXPIRED_TOKEN',
      });
      return;
    }

    // Query database for user
    const users = await query<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, email, name, avatar_url
       FROM users
       WHERE id = @p0`,
      [payload.userId]
    );

    if (users.length === 0) {
      res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    const user = users[0];

    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Token verification failed',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Handle logout
 *
 * Client-side logout stub (no server action needed with stateless JWT).
 *
 * POST /api/auth/logout
 */
export async function handleLogout(
  _req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
  });
}
