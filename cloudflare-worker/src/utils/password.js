/**
 * Password hashing utilities using Web Crypto API (PBKDF2)
 *
 * Security parameters:
 * - Algorithm: PBKDF2
 * - Hash: SHA-256
 * - Iterations: 100,000
 * - Salt length: 16 bytes (128 bits)
 * - Output length: 32 bytes (256 bits)
 */

/**
 * Hash a password using PBKDF2 with Web Crypto API
 * @param {string} password - Plain text password
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password) {
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
      hash: 'SHA-256'
    },
    key,
    256 // 256-bit output
  );

  // Convert to hex strings for storage
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);

  return {
    hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: saltArray.map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

/**
 * Verify a password against stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Hex-encoded stored hash
 * @param {string} storedSalt - Hex-encoded stored salt
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, storedSalt) {
  // Convert hex salt back to Uint8Array
  const saltArray = storedSalt.match(/.{2}/g).map(byte => parseInt(byte, 16));
  const salt = new Uint8Array(saltArray);

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
      hash: 'SHA-256'
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison to prevent timing attacks
  return computedHash === storedHash;
}
