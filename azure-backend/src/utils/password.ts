/**
 * Password hashing utilities using Web Crypto API (PBKDF2)
 *
 * Ported from Cloudflare Worker implementation.
 * Uses Node.js crypto.subtle (Web Crypto API) which is available in Node 18+.
 *
 * CRITICAL: These parameters MUST match exactly with the Cloudflare Worker
 * implementation to ensure existing users can log in after migration.
 *
 * Security parameters:
 * - Algorithm: PBKDF2
 * - Hash: SHA-256
 * - Iterations: 100,000
 * - Salt length: 16 bytes (128 bits)
 * - Output length: 32 bytes (256 bits)
 * - Encoding: Hex strings
 */

import { webcrypto, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

// Use Node's Web Crypto API
const crypto = webcrypto as unknown as Crypto;

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * SECURITY: Uses Node's native crypto.timingSafeEqual which is
 * cryptographically secure and prevents timing side-channel attacks.
 *
 * @param a - First string (hex-encoded hash)
 * @param b - Second string (hex-encoded hash)
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Length check first - different lengths can never be equal
  if (a.length !== b.length) {
    return false;
  }

  // Use Node's native timing-safe comparison
  return cryptoTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Convert a Uint8Array to a hex string
 */
function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string to a Uint8Array
 */
function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Hash a password using PBKDF2 with Web Crypto API
 *
 * @param password - Plain text password
 * @returns Object containing hex-encoded hash and salt
 *
 * @example
 * ```typescript
 * const { hash, salt } = await hashPassword('mypassword');
 * // Store hash and salt in database
 * ```
 */
export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import key for PBKDF2
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive hash using PBKDF2 (100,000 iterations)
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256 // 256-bit output
  );

  // Convert to hex strings for storage
  return {
    hash: toHex(new Uint8Array(hashBuffer)),
    salt: toHex(salt),
  };
}

/**
 * Verify a password against stored hash
 *
 * @param password - Plain text password to verify
 * @param storedHash - Hex-encoded stored hash
 * @param storedSalt - Hex-encoded stored salt
 * @returns True if password matches
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('mypassword', storedHash, storedSalt);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  // Convert hex salt back to Uint8Array
  const salt = fromHex(storedSalt);

  // Hash the provided password with stored salt
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const computedHash = toHex(new Uint8Array(hashBuffer));

  // SECURITY: Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(computedHash, storedHash);
}
