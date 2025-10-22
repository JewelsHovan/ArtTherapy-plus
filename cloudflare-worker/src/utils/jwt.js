import { SignJWT, jwtVerify } from 'jose';

/**
 * Generate a JWT token with the given payload
 * @param {Object} payload - Data to encode in token (userId, email)
 * @param {string} secret - Secret key for signing
 * @returns {Promise<string>} JWT token
 */
export async function generateJWT(payload, secret) {
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
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @returns {Promise<Object>} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export async function verifyJWT(token, secret) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
