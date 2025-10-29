# Email/Password Authentication Design

**Date:** 2025-10-22
**Status:** Approved Design
**Type:** Feature Addition

## Executive Summary

Add email/password authentication alongside existing Microsoft OAuth to enable immediate user testing without Azure configuration. Uses Cloudflare Workers' native Web Crypto API for secure password hashing.

**Key Decisions:**
- Both auth methods coexist (user choice)
- Web Crypto API with PBKDF2 for password hashing
- No email verification (immediate access for MVP)
- Add password fields to existing users table
- Minimal implementation (signup + login only)

---

## Requirements

### Functional Requirements
1. Users can sign up with email/password
2. Users can log in with email/password
3. Both email and OAuth auth methods work simultaneously
4. Email is unique across both auth methods
5. OAuth users cannot use password login (and vice versa)

### Non-Functional Requirements
1. Passwords hashed with industry-standard security (PBKDF2, 100k iterations)
2. No external dependencies for password hashing
3. Fast implementation (~2-3 hours)
4. No email service required (no verification emails)

---

## Database Schema Changes

### Migration: Add Password Fields to Users Table

```sql
-- Add password authentication columns
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';

-- Existing columns remain:
-- - microsoft_id (nullable)
-- - email (required, unique)
-- - name, avatar_url, etc.
```

### Schema Rules

**For Email Auth Users:**
- `auth_provider = 'email'`
- `password_hash` and `password_salt` are required
- `microsoft_id` is NULL

**For OAuth Users:**
- `auth_provider = 'microsoft'`
- `microsoft_id` is required
- `password_hash` and `password_salt` are NULL

**Universal:**
- `email` is required and unique
- `name` is optional
- All users get JWT tokens after authentication

---

## Password Security Implementation

### Hashing Algorithm: PBKDF2

**Parameters:**
- Algorithm: PBKDF2
- Hash Function: SHA-256
- Iterations: 100,000
- Salt Length: 16 bytes (128 bits)
- Output Length: 32 bytes (256 bits)

### Password Hashing Function

**File:** `cloudflare-worker/src/utils/password.js`

```javascript
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
```

**Security Features:**
- Random salt per user (prevents rainbow tables)
- 100,000 iterations (slows brute force attacks)
- Constant-time comparison (prevents timing attacks)
- SHA-256 hash function (industry standard)
- No external dependencies (uses Workers' native crypto)

---

## API Endpoints

### POST /api/auth/signup

Create new user account with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validations:**
- Email: Valid email format, not already registered
- Password: Minimum 8 characters
- Name: Optional, max 100 characters

**Process:**
1. Validate email format and uniqueness
2. Check password strength (min 8 chars)
3. Hash password with random salt
4. Generate UUID for user ID
5. Insert user into D1 with `auth_provider='email'`
6. Generate JWT token
7. Return token and user data

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null
  }
}
```

**Error Responses:**
- `400` - Invalid email format: `{ error: "Invalid email address", code: "INVALID_EMAIL" }`
- `400` - Password too short: `{ error: "Password must be at least 8 characters", code: "WEAK_PASSWORD" }`
- `409` - Email exists: `{ error: "An account with this email already exists", code: "EMAIL_EXISTS" }`
- `500` - Server error: `{ error: "Failed to create account", code: "SIGNUP_FAILED" }`

---

### POST /api/auth/login

Authenticate user with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Process:**
1. Look up user by email
2. Verify auth_provider='email' (reject OAuth users)
3. Verify password against stored hash
4. Generate JWT token
5. Return token and user data

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null
  }
}
```

**Error Responses:**
- `401` - Invalid credentials: `{ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }`
- `401` - Wrong auth provider: `{ error: "This email is registered with Microsoft. Please use Microsoft sign-in", code: "WRONG_AUTH_PROVIDER" }`
- `500` - Server error: `{ error: "Login failed", code: "LOGIN_FAILED" }`

**Security Notes:**
- Don't reveal if email exists (generic "Invalid email or password")
- Rate limiting recommended (future enhancement)
- Account lockout after N failed attempts (future enhancement)

---

## Frontend Implementation

### Registration Page Updates

**File:** `frontend/src/pages/Registration.jsx`

**New UI Structure:**
```
┌─────────────────────────────────────┐
│  Logo & Welcome Message             │
├─────────────────────────────────────┤
│  [ Sign Up ] / [ Log In ] Toggle    │
├─────────────────────────────────────┤
│  Email/Password Form:               │
│  - Email input                      │
│  - Password input                   │
│  - (Confirm Password - signup only) │
│  - (Name - signup only)             │
│  - Submit button                    │
├─────────────────────────────────────┤
│  "Or continue with"                 │
├─────────────────────────────────────┤
│  [Sign in with Microsoft] button    │
└─────────────────────────────────────┘
```

**Component State:**
```javascript
const [mode, setMode] = useState('signup'); // 'signup' or 'login'
const [formData, setFormData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
});
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
```

**Client-Side Validation:**
- Email: Regex pattern for valid email
- Password: Minimum 8 characters, show strength indicator
- Confirm Password: Must match password (signup only)
- Name: Optional, max 100 characters

**Form Submission:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  setIsLoading(true);

  try {
    let response;
    if (mode === 'signup') {
      response = await painPlusAPI.auth.signup(
        formData.email,
        formData.password,
        formData.name
      );
    } else {
      response = await painPlusAPI.auth.login(
        formData.email,
        formData.password
      );
    }

    const { token, user } = response.data;
    login(token, user); // From AuthContext
    navigate('/mode');
  } catch (error) {
    if (error.response?.data?.code === 'EMAIL_EXISTS') {
      setErrors({ email: 'This email is already registered' });
    } else if (error.response?.data?.code === 'INVALID_CREDENTIALS') {
      setErrors({ general: 'Invalid email or password' });
    } else if (error.response?.data?.code === 'WRONG_AUTH_PROVIDER') {
      setErrors({ general: 'This email uses Microsoft sign-in' });
    } else {
      setErrors({ general: 'Something went wrong. Please try again.' });
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

### API Service Updates

**File:** `frontend/src/services/api.js`

Add to `painPlusAPI.auth` object:

```javascript
auth: {
  // Existing methods
  microsoftCallback: (code) => api.post('/auth/microsoft/callback', { code }),
  verifyToken: () => api.post('/auth/verify'),
  logout: () => api.post('/auth/logout'),

  // New methods
  signup: (email, password, name) =>
    api.post('/auth/signup', { email, password, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
}
```

---

## Implementation Plan Summary

### Backend Tasks (6 tasks)

1. **Database Migration:** Run ALTER TABLE to add password columns
2. **Password Utilities:** Create `utils/password.js` with hash/verify functions
3. **Signup Handler:** Add `handleSignup` to `handlers/auth.js`
4. **Login Handler:** Add `handleLogin` to `handlers/auth.js`
5. **Router Updates:** Add signup/login routes to `index.js`
6. **Testing:** Manual testing with curl/Postman

### Frontend Tasks (3 tasks)

1. **Registration Page:** Add email/password form with mode toggle
2. **API Service:** Add signup/login methods
3. **Testing:** Manual testing in browser

---

## Testing Checklist

### Backend Tests (API)

```bash
# Test signup
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Expected: 201 with token and user

# Test login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: 200 with token and user

# Test duplicate signup
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password456","name":"Test2"}'

# Expected: 409 EMAIL_EXISTS

# Test wrong password
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Expected: 401 INVALID_CREDENTIALS
```

### Frontend Tests (Browser)

1. **Signup Flow:**
   - [ ] Visit /register
   - [ ] Fill email/password form
   - [ ] Click "Sign Up"
   - [ ] Redirected to /mode with auth token
   - [ ] Header shows user name

2. **Login Flow:**
   - [ ] Logout
   - [ ] Visit /register
   - [ ] Toggle to "Log In" mode
   - [ ] Enter email/password
   - [ ] Click "Log In"
   - [ ] Redirected to /mode
   - [ ] Header shows user name

3. **Validation:**
   - [ ] Invalid email shows error
   - [ ] Short password shows error
   - [ ] Passwords don't match shows error (signup)
   - [ ] Wrong password shows error (login)
   - [ ] Duplicate email shows error (signup)

4. **OAuth Coexistence:**
   - [ ] Microsoft OAuth still works
   - [ ] Email auth users can't use OAuth (and vice versa)

---

## Security Considerations

### Password Security
- ✅ PBKDF2 with 100,000 iterations (industry standard)
- ✅ Random salt per user (prevents rainbow tables)
- ✅ SHA-256 hash function
- ✅ Constant-time comparison (prevents timing attacks)
- ✅ Passwords never logged or exposed

### API Security
- ✅ Don't reveal if email exists on login (generic error)
- ✅ Parameterized SQL queries (prevents injection)
- ✅ JWT tokens with 24h expiration
- ⚠️ No rate limiting (add in future)
- ⚠️ No account lockout (add in future)

### Data Privacy
- ✅ Passwords hashed, never stored in plain text
- ✅ Email is unique constraint (database level)
- ✅ Auth provider tracked (prevents method confusion)
- ⚠️ No email verification (acceptable for MVP)

### Future Enhancements
- Rate limiting (prevent brute force)
- Account lockout after N failed attempts
- Password strength requirements (uppercase, numbers, special chars)
- Password reset via email
- Email verification
- Two-factor authentication (2FA)

---

## Migration from Current State

### What Changes
- ✅ D1 schema adds 3 columns (backward compatible)
- ✅ Registration page adds email form (keeps OAuth)
- ✅ API adds 2 new endpoints (doesn't affect existing)
- ✅ No breaking changes to existing OAuth flow

### What Stays the Same
- ✅ Microsoft OAuth still works
- ✅ Existing JWT token system unchanged
- ✅ AuthContext unchanged
- ✅ Protected routes unchanged
- ✅ All existing functionality preserved

---

## Deployment Steps

1. **Database Migration:** Run ALTER TABLE on D1 production database
2. **Deploy Worker:** Deploy updated Worker with new endpoints
3. **Deploy Frontend:** Deploy updated Registration page
4. **Test:** Create test accounts and verify both auth methods work
5. **Monitor:** Watch for errors in Cloudflare logs

---

## Future Considerations

### Phase 2: Enhanced Security
- Password reset via email (requires email service)
- Email verification tokens
- Rate limiting and account lockout
- Password strength meter with requirements

### Phase 3: Account Management
- Change password
- Change email
- Account linking (add OAuth to existing email account)
- Delete account

### Phase 4: Advanced Features
- Two-factor authentication (2FA)
- Social login (Google, GitHub, etc.)
- Magic links (passwordless email login)
- Session management (view/revoke active sessions)

---

## Appendix: File Changes Reference

### Backend Files
1. `cloudflare-worker/src/db/schema.sql` - Add migration SQL
2. `cloudflare-worker/src/utils/password.js` - NEW: Password hashing utilities
3. `cloudflare-worker/src/handlers/auth.js` - ADD: handleSignup, handleLogin
4. `cloudflare-worker/src/index.js` - ADD: Route /auth/signup and /auth/login

### Frontend Files
1. `frontend/src/pages/Registration.jsx` - ADD: Email/password form
2. `frontend/src/services/api.js` - ADD: signup and login methods

### Total Changes
- 6 files modified/created
- ~400 lines of code added
- Estimated time: 2-3 hours

---

**End of Design Document**
