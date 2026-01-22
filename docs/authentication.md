# Authentication

## Overview

ArtTherapy+ supports two authentication methods:
1. **Microsoft OAuth 2.0 with PKCE** - Social login via Microsoft accounts
2. **Email/Password** - Traditional registration/login

Both methods issue JWT tokens stored in localStorage for subsequent API calls.

## Microsoft OAuth Flow (PKCE)

### Why PKCE?
Single Page Applications cannot securely store client secrets. PKCE (Proof Key for Code Exchange) provides security without requiring a secret on the client.

### Flow Diagram
```
1. User clicks "Sign in with Microsoft"
2. Frontend generates:
   - code_verifier (random 32 bytes, base64url encoded)
   - code_challenge (SHA-256 hash of verifier, base64url encoded)
3. Frontend stores code_verifier in sessionStorage
4. Frontend opens popup to Microsoft authorization URL with code_challenge
5. User authenticates with Microsoft
6. Microsoft redirects to /oauth-callback.html with authorization code
7. Callback page stores code in localStorage, closes popup
8. Frontend polls localStorage for code
9. Frontend exchanges code for tokens directly with Microsoft (includes code_verifier)
10. Frontend sends access_token to backend (/api/auth/microsoft/callback)
11. Backend fetches user profile from Microsoft Graph API
12. Backend creates/finds user in D1 database
13. Backend generates JWT and returns to frontend
14. Frontend stores JWT in localStorage, redirects to /mode
```

### Frontend Implementation (Registration.jsx)

```javascript
// PKCE helpers
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Initiate OAuth
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
sessionStorage.setItem('pkce_code_verifier', codeVerifier);

const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&` +
  `scope=${encodeURIComponent('openid email profile User.Read')}&` +
  `response_mode=query&code_challenge=${codeChallenge}&code_challenge_method=S256`;

// Token exchange (frontend performs this for SPA+PKCE)
const tokenResponse = await fetch(
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
      scope: 'openid email profile User.Read'
    })
  }
);
```

### OAuth Callback Page (oauth-callback.html)

The callback page:
1. Extracts code/error from URL parameters
2. Stores result in localStorage (for popup communication)
3. Attempts postMessage to opener (fallback)
4. Closes popup window

```javascript
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const error = params.get('error');

if (code) {
  localStorage.setItem('oauth_result', JSON.stringify({
    type: 'success',
    code,
    timestamp: Date.now()
  }));
}
```

### Backend Callback Handler (handlers/auth.js)

```javascript
export async function handleMicrosoftCallback(request, env, origin) {
  const { access_token } = await request.json();

  // Fetch Microsoft profile
  const profileResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const profile = await profileResponse.json();

  // Find or create user in D1
  let user = await env.DB
    .prepare('SELECT * FROM users WHERE microsoft_id = ?')
    .bind(profile.id)
    .first();

  if (!user) {
    const userId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO users (id, microsoft_id, email, name, auth_provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'microsoft', datetime('now'), datetime('now'))
    `).bind(userId, profile.id, profile.mail || profile.userPrincipalName, profile.displayName)
    .run();
    user = { id: userId, email: profile.mail || profile.userPrincipalName, name: profile.displayName };
  }

  // Generate JWT
  const token = await generateJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);
  return jsonResponse({ token, user });
}
```

## Email/Password Authentication

### Registration Flow
1. User submits email, password, name
2. Frontend validates (email format, password >= 8 chars)
3. Backend checks rate limit (3/hour)
4. Backend validates email uniqueness
5. Backend hashes password with PBKDF2
6. Backend creates user in D1
7. Backend returns JWT

### Login Flow
1. User submits email, password
2. Backend checks rate limit (5/min)
3. Backend finds user by email
4. Backend verifies auth_provider is 'email'
5. Backend verifies password hash
6. Backend returns JWT

### Password Security

```javascript
// utils/password.js
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  return {
    hash: btoa(String.fromCharCode(...new Uint8Array(hash))),
    salt: btoa(String.fromCharCode(...salt))
  };
}
```

## JWT Token Management

### Token Structure
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  iat: 1234567890,
  exp: 1234567890 + (7 * 24 * 60 * 60) // 7 days (default, configurable via JWT_TTL_DAYS)
}
```

### Frontend Token Handling (api.js)

```javascript
// Request interceptor - add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expires_at');
      sessionStorage.setItem('auth_redirect', window.location.pathname);
      setTimeout(() => window.location.href = '/register', 1500);
    }
    return Promise.reject(error);
  }
);
```

### Backend Token Verification (middleware/auth.js)

```javascript
export async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided', code: 'NO_TOKEN' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    const user = await env.DB
      .prepare('SELECT id, email, name FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();
    return { valid: true, user };
  } catch {
    return { valid: false, error: 'Invalid token', code: 'INVALID_TOKEN' };
  }
}
```

## AuthContext (Frontend)

```javascript
// contexts/AuthContext.jsx
// Helper to read JWT expiry (ms since epoch)
const getTokenExpiry = (token) => {
  const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  if (!base64) return null;
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const payload = JSON.parse(atob(padded));
  return payload?.exp ? payload.exp * 1000 : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) { setIsLoading(false); return; }

      try {
        const response = await painPlusAPI.auth.verifyToken(storedToken);
        setToken(storedToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_expires_at');
        }
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_expires_at', String(getTokenExpiry(newToken)));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires_at');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/register';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Troubleshooting

### "Popup was blocked"
- Enable popups for the site in browser settings
- Ensure popup is triggered by user action (click event)

### "Token exchange failed"
- Verify PKCE code_verifier matches code_challenge
- Check redirect_uri matches Azure app registration
- Ensure client_id is correct

### "Invalid or expired token"
- Token has 7-day expiry (configurable via `JWT_TTL_DAYS` in Azure backend)
- User will be redirected to /register
- Previous location saved in sessionStorage for redirect after login

### "This email uses Microsoft sign-in"
- User registered with Microsoft OAuth but trying email/password login
- Direct them to use Microsoft sign-in button
