/**
 * JWT utilities using jose library
 *
 * Ported from Cloudflare Worker implementation.
 * Uses HS256 algorithm for compatibility with existing tokens.
 *
 * CRITICAL: Must use the same secret and algorithm as the Cloudflare Worker
 * to ensure token interoperability during migration.
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';

/**
 * JWT payload structure for ArtTherapy+ tokens
 */
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

/**
 * Generate a JWT token with the given payload
 *
 * @param payload - Data to encode in token (userId, email)
 * @param secret - Secret key for signing
 * @returns JWT token string
 *
 * @example
 * ```typescript
 * const token = await generateJWT({ userId: '123', email: 'user@example.com' }, 'secret');
 * ```
 */
export async function generateJWT(
  payload: { userId: string; email: string },
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token to verify
 * @param secret - Secret key for verification
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * ```typescript
 * try {
 *   const payload = await verifyJWT(token, 'secret');
 *   console.log(payload.userId);
 * } catch (err) {
 *   console.error('Invalid token');
 * }
 * ```
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<TokenPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as TokenPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
