# Phase 1: Authentication Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to sign in with Microsoft OAuth, protect routes, and manage authentication state.

**Architecture:** Hybrid OAuth flow (frontend initiates, Worker handles callback), JWT tokens stored in localStorage, React Context for auth state, protected route wrapper for authorization.

**Tech Stack:** Microsoft OAuth 2.0, Cloudflare D1, React Context API, JWT (jose library), Axios interceptors

---

## Prerequisites

**Azure App Registration Setup:**
Before starting, register app in Azure Portal:
1. Go to portal.azure.com → Azure Active Directory → App registrations
2. New registration: Name "ArtTherapy-plus", Supported accounts: "Personal Microsoft accounts and organizational"
3. Add redirect URI: `https://arttherapy-plus-api.julienh15.workers.dev/api/auth/microsoft/callback`
4. Add platform: Single-page application → `https://arttherapy-plus.pages.dev`
5. API permissions: Add Microsoft Graph → User.Read
6. Certificates & secrets → New client secret → Copy value
7. Copy Application (client) ID

**Cloudflare D1 Database Setup:**
```bash
cd cloudflare-worker
wrangler d1 create arttherapy-plus-db
# Copy database_id from output
```

**Environment Secrets:**
```bash
cd cloudflare-worker
wrangler secret put MICROSOFT_CLIENT_SECRET
# Paste secret from Azure
wrangler secret put JWT_SECRET
# Generate with: openssl rand -base64 32
```

---

## Task 1: Create D1 Database Schema

**Files:**
- Create: `cloudflare-worker/src/db/schema.sql`

**Step 1: Write schema file**

Create `cloudflare-worker/src/db/schema.sql`:

```sql
-- Users table (core authentication + profile)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  microsoft_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,

  -- Profile fields (Phase 3)
  age INTEGER,
  sex TEXT,
  gender TEXT,
  symptoms TEXT,
  location TEXT,
  languages TEXT,
  occupation TEXT,
  relationship_status TEXT,
  prescriptions TEXT,
  activity_level TEXT,

  -- Settings as JSON
  settings TEXT DEFAULT '{}',

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Step 2: Update wrangler.toml with D1 binding**

Edit `cloudflare-worker/wrangler.toml`:

```toml
name = "arttherapy-plus-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "arttherapy-plus-db"
database_id = "PASTE_DATABASE_ID_FROM_WRANGLER_D1_CREATE"

# Public environment variables
[vars]
MICROSOFT_CLIENT_ID = "PASTE_CLIENT_ID_FROM_AZURE"
MICROSOFT_TENANT_ID = "common"
```

**Step 3: Initialize database with schema**

Run:
```bash
cd cloudflare-worker
wrangler d1 execute arttherapy-plus-db --file=./src/db/schema.sql
```

Expected: `🌀 Executing on arttherapy-plus-db:`

**Step 4: Verify tables created**

Run:
```bash
wrangler d1 execute arttherapy-plus-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected output:
```
┌───────┐
│ name  │
├───────┤
│ users │
└───────┘
```

**Step 5: Commit**

```bash
git add cloudflare-worker/src/db/schema.sql cloudflare-worker/wrangler.toml
git commit -m "feat: add D1 database schema and configuration

- Create users table with Microsoft OAuth fields
- Add D1 binding to wrangler.toml
- Configure Microsoft OAuth environment variables"
```

---

## Task 2: JWT Utilities

**Files:**
- Create: `cloudflare-worker/src/utils/jwt.js`

**Step 1: Install jose library**

Run:
```bash
cd cloudflare-worker
npm install jose
```

**Step 2: Write JWT utilities**

Create `cloudflare-worker/src/utils/jwt.js`:

```javascript
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
```

**Step 3: Commit**

```bash
git add cloudflare-worker/package.json cloudflare-worker/package-lock.json cloudflare-worker/src/utils/jwt.js
git commit -m "feat: add JWT generation and verification utilities

- Install jose library for JWT handling
- Create generateJWT function with 24h expiration
- Create verifyJWT function with error handling"
```

---

## Task 3: Response Utilities

**Files:**
- Create: `cloudflare-worker/src/utils/response.js`

**Step 1: Write response utilities**

Create `cloudflare-worker/src/utils/response.js`:

```javascript
/**
 * Create a standardized JSON response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Additional headers
 * @returns {Response} Cloudflare Response object
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders(),
      ...headers
    }
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} code - Error code enum
 * @param {number} status - HTTP status code
 * @returns {Response} Error response
 */
export function errorResponse(message, code = 'ERROR', status = 500) {
  return jsonResponse({
    error: message,
    code
  }, status);
}

/**
 * Get CORS headers for responses
 * @param {string} origin - Request origin (optional)
 * @returns {Object} CORS headers
 */
export function getCORSHeaders(origin = null) {
  const allowedOrigins = [
    'https://arttherapy-plus.pages.dev',
    'http://localhost:5173'
  ];

  // Allow origin if in whitelist or use first allowed origin as default
  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle CORS preflight requests
 * @returns {Response} CORS preflight response
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}
```

**Step 2: Commit**

```bash
git add cloudflare-worker/src/utils/response.js
git commit -m "feat: add standardized response utilities

- Create jsonResponse helper for consistent API responses
- Create errorResponse for standardized error format
- Add CORS headers utility with whitelist
- Add CORS preflight handler"
```

---

## Task 4: Authentication Middleware

**Files:**
- Create: `cloudflare-worker/src/middleware/auth.js`

**Step 1: Write authentication middleware**

Create `cloudflare-worker/src/middleware/auth.js`:

```javascript
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
```

**Step 2: Commit**

```bash
git add cloudflare-worker/src/middleware/auth.js
git commit -m "feat: add JWT authentication middleware

- Extract and verify Bearer token from Authorization header
- Validate JWT signature and expiration
- Query D1 to verify user exists
- Return user object if valid, error details if invalid"
```

---

## Task 5: Microsoft OAuth Handler

**Files:**
- Create: `cloudflare-worker/src/handlers/auth.js`

**Step 1: Write Microsoft OAuth callback handler**

Create `cloudflare-worker/src/handlers/auth.js`:

```javascript
import { generateJWT } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Handle Microsoft OAuth callback - exchange code for JWT
 * @param {Request} request - Incoming request with {code}
 * @param {Object} env - Environment bindings
 * @returns {Promise<Response>} JWT and user data
 */
export async function handleMicrosoftCallback(request, env) {
  try {
    const { code } = await request.json();

    if (!code) {
      return errorResponse('Missing authorization code', 'MISSING_CODE', 400);
    }

    // Exchange authorization code for access token
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
      const error = await tokenResponse.text();
      console.error('Microsoft token exchange failed:', error);
      return errorResponse('Failed to exchange authorization code', 'TOKEN_EXCHANGE_FAILED', 401);
    }

    const { access_token } = await tokenResponse.json();

    // Get user profile from Microsoft Graph API
    const profileResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('Microsoft profile fetch failed:', error);
      return errorResponse('Failed to fetch user profile', 'PROFILE_FETCH_FAILED', 401);
    }

    const profile = await profileResponse.json();

    // Check if user exists in D1
    let user = await env.DB
      .prepare('SELECT * FROM users WHERE microsoft_id = ?')
      .bind(profile.id)
      .first();

    // Create new user if doesn't exist
    if (!user) {
      const userId = crypto.randomUUID();
      const email = profile.mail || profile.userPrincipalName;

      await env.DB
        .prepare(`
          INSERT INTO users (id, microsoft_id, email, name, avatar_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          userId,
          profile.id,
          email,
          profile.displayName,
          null  // Microsoft Graph photo requires additional permissions
        )
        .run();

      user = {
        id: userId,
        microsoft_id: profile.id,
        email: email,
        name: profile.displayName,
        avatar_url: null
      };
    }

    // Generate JWT token
    const token = await generateJWT(
      {
        userId: user.id,
        email: user.email
      },
      env.JWT_SECRET
    );

    // Return token and user data
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
    console.error('Microsoft OAuth error:', error);
    return errorResponse('Authentication failed', 'AUTH_FAILED', 500);
  }
}

/**
 * Verify JWT token validity
 * @param {Request} request - Incoming request with Authorization header
 * @param {Object} env - Environment bindings
 * @returns {Promise<Response>} User data if valid
 */
export async function handleVerifyToken(request, env) {
  const { verifyAuth } = await import('../middleware/auth.js');

  const authResult = await verifyAuth(request, env);

  if (!authResult.valid) {
    return errorResponse(authResult.error, authResult.code, 401);
  }

  return jsonResponse({
    valid: true,
    user: authResult.user
  });
}

/**
 * Handle logout (client-side only with JWT)
 * @returns {Response} Success response
 */
export async function handleLogout() {
  return jsonResponse({ success: true });
}
```

**Step 2: Commit**

```bash
git add cloudflare-worker/src/handlers/auth.js
git commit -m "feat: add Microsoft OAuth authentication handlers

- handleMicrosoftCallback: exchange code for access token
- Fetch user profile from Microsoft Graph API
- Create new user or load existing user from D1
- Generate JWT token with 24h expiration
- Add handleVerifyToken for token validation
- Add handleLogout stub for client-side logout"
```

---

## Task 6: Update Worker Main Router

**Files:**
- Modify: `cloudflare-worker/src/index.js`

**Step 1: Read current index.js to understand structure**

Run:
```bash
cat cloudflare-worker/src/index.js | head -50
```

**Step 2: Backup existing index.js**

Run:
```bash
cp cloudflare-worker/src/index.js cloudflare-worker/src/index.js.backup
```

**Step 3: Rewrite index.js with auth routing**

Replace contents of `cloudflare-worker/src/index.js`:

```javascript
import { handleMicrosoftCallback, handleVerifyToken, handleLogout } from './handlers/auth.js';
import { handleCORS, errorResponse, jsonResponse } from './utils/response.js';
import { verifyAuth } from './middleware/auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // Health check (public)
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // Authentication endpoints (public)
      if (path === '/api/auth/microsoft/callback' && request.method === 'POST') {
        return await handleMicrosoftCallback(request, env);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        return await handleVerifyToken(request, env);
      }

      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout();
      }

      // TODO: Add protected endpoints for gallery, user, journal in Phase 2 & 3
      // These will use verifyAuth middleware

      // Existing OpenAI endpoints (will be protected in Phase 2)
      // TODO: Import and route to generate handlers

      // 404 for unknown routes
      return errorResponse('Not found', 'NOT_FOUND', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
};
```

**Step 4: Test locally**

Run:
```bash
cd cloudflare-worker
wrangler dev
```

Expected: Server starts on http://localhost:8787

**Step 5: Test health endpoint**

In another terminal:
```bash
curl http://localhost:8787/api/health
```

Expected output:
```json
{"status":"ok","timestamp":"2025-10-20T..."}
```

**Step 6: Stop local server and commit**

```bash
git add cloudflare-worker/src/index.js
git commit -m "feat: add authentication routing to Worker

- Route Microsoft OAuth callback endpoint
- Route token verification endpoint
- Route logout endpoint
- Add CORS preflight handling
- Add health check endpoint
- Add error handling wrapper"
```

---

## Task 7: Frontend AuthContext

**Files:**
- Create: `frontend/src/contexts/AuthContext.jsx`

**Step 1: Create AuthContext with provider**

Create `frontend/src/contexts/AuthContext.jsx`:

```javascript
import { createContext, useState, useContext, useEffect } from 'react';
import { painPlusAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await painPlusAPI.auth.verifyToken();
        const { user: userData } = response.data;

        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid or expired - clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/register';
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add frontend/src/contexts/AuthContext.jsx
git commit -m "feat: add AuthContext for global authentication state

- Create AuthContext with user, token, isAuthenticated, isLoading
- Verify token on mount from localStorage
- Provide login method to store token and update state
- Provide logout method to clear state and redirect
- Export useAuth hook for consuming context"
```

---

## Task 8: Frontend API Service Updates

**Files:**
- Modify: `frontend/src/services/api.js`

**Step 1: Read current api.js**

Run:
```bash
cat frontend/src/services/api.js
```

**Step 2: Add auth methods and interceptors**

Modify `frontend/src/services/api.js` (add to existing content):

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  'https://arttherapy-plus-api.julienh15.workers.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add JWT to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear and redirect
      localStorage.removeItem('auth_token');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);

export const painPlusAPI = {
  // Authentication
  auth: {
    microsoftCallback: (code) =>
      api.post('/auth/microsoft/callback', { code }),
    verifyToken: () =>
      api.post('/auth/verify'),
    logout: () =>
      api.post('/auth/logout')
  },

  // User (Phase 3)
  user: {
    getProfile: () =>
      api.get('/user/profile'),
    updateProfile: (data) =>
      api.put('/user/profile', data)
  },

  // Gallery (Phase 2 - will update these)
  gallery: {
    save: (item) =>
      api.post('/gallery', item),
    getAll: (limit = 50, offset = 0) =>
      api.get(`/gallery?limit=${limit}&offset=${offset}`),
    delete: (id) =>
      api.delete(`/gallery/${id}`)
  },

  // Journal (Phase 3)
  journal: {
    create: (entry) =>
      api.post('/journal', entry),
    getAll: (limit = 20, offset = 0) =>
      api.get(`/journal?limit=${limit}&offset=${offset}`)
  },

  // Existing OpenAI endpoints (keep as-is for now)
  healthCheck: () => api.get('/health'),

  generateImage: (description) =>
    api.post('/generate/image', { description }),

  generatePrompt: (description) =>
    api.post('/generate/prompt', { description }),

  reflect: (description, imageContext) =>
    api.post('/reflect', { description, imageContext }),

  getInspiration: () =>
    api.get('/inspire'),

  editImage: ({ image, description }) =>
    api.post('/edit/image', { image, description })
};

export default api;
```

**Step 3: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add authentication to API service

- Add request interceptor to inject JWT from localStorage
- Add response interceptor to handle 401 (auto-logout)
- Add auth methods (microsoftCallback, verifyToken, logout)
- Add user, gallery, journal method stubs
- Keep existing OpenAI methods unchanged"
```

---

## Task 9: Protected Route Component

**Files:**
- Create: `frontend/src/components/auth/ProtectedRoute.jsx`

**Step 1: Create ProtectedRoute component**

Create `frontend/src/components/auth/ProtectedRoute.jsx`:

```javascript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to register if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/auth/ProtectedRoute.jsx
git commit -m "feat: add ProtectedRoute component for route authorization

- Check isAuthenticated from AuthContext
- Show loading spinner while verifying token
- Redirect to /register if not authenticated
- Render child routes with Outlet if authenticated"
```

---

## Task 10: Update App Routes

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Read current App.jsx**

Run:
```bash
cat frontend/src/App.jsx
```

**Step 2: Wrap app with AuthProvider and add ProtectedRoute**

Modify `frontend/src/App.jsx`:

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Welcome from './pages/Welcome';
import Registration from './pages/Registration';
import About from './pages/About';
import ModeSelection from './pages/ModeSelection';
import PainDescription from './pages/PainDescription';
import Visualize from './pages/Visualize';
import Edit from './pages/Edit';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ComponentShowcase from './pages/ComponentShowcase';

// Layout
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/about" element={<About />} />

          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/mode" element={<ModeSelection />} />
              <Route path="/describe" element={<PainDescription />} />
              <Route path="/visualize" element={<Visualize />} />
              <Route path="/edit" element={<Edit />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/componentshowcase" element={<ComponentShowcase />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add authentication routing to App

- Wrap app with AuthProvider for global auth state
- Add public routes (/, /register, /about)
- Wrap protected routes with ProtectedRoute component
- All authenticated routes require valid JWT token"
```

---

## Task 11: Update Registration Page with Microsoft OAuth

**Files:**
- Modify: `frontend/src/pages/Registration.jsx`

**Step 1: Read current Registration.jsx**

Run:
```bash
cat frontend/src/pages/Registration.jsx | head -50
```

**Step 2: Replace with Microsoft OAuth implementation**

Modify `frontend/src/pages/Registration.jsx`:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { painPlusAPI } from '../services/api';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export default function Registration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/api/auth/microsoft/callback`;

      const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('openid email profile')}&` +
        `response_mode=query`;

      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Microsoft Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback message
      const handleMessage = async (event) => {
        // Security: verify origin
        if (!event.origin.startsWith(window.location.origin)) {
          return;
        }

        if (event.data.type === 'microsoft-oauth-callback') {
          window.removeEventListener('message', handleMessage);

          const { code, error: oauthError } = event.data;

          if (oauthError) {
            setError('Authentication failed. Please try again.');
            setIsLoading(false);
            return;
          }

          try {
            // Exchange code for JWT
            const response = await painPlusAPI.auth.microsoftCallback(code);
            const { token, user } = response.data;

            // Update auth context
            login(token, user);

            // Redirect to authenticated home
            navigate('/mode');
          } catch (err) {
            console.error('OAuth callback error:', err);
            setError('Authentication failed. Please try again.');
            setIsLoading(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup closed without completing
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 500);

    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Pain+ Art Therapy
          </h1>
          <p className="text-gray-600">
            Transform pain into art through creative expression
          </p>
        </div>

        {/* Registration card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Sign In
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Microsoft OAuth button */}
          <Button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            fullWidth
            className="mb-4"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                Sign in with Microsoft
              </span>
            )}
          </Button>

          <p className="text-sm text-gray-600 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create OAuth callback handler HTML**

Create `frontend/public/oauth-callback.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>OAuth Callback</title>
</head>
<body>
  <script>
    // Extract code or error from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Send message to opener window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'microsoft-oauth-callback',
          code,
          error,
          errorDescription
        },
        window.location.origin
      );
      window.close();
    } else {
      document.body.innerHTML = '<p>Authentication complete. You can close this window.</p>';
    }
  </script>
</body>
</html>
```

**Step 4: Add environment variable to .env**

Create `frontend/.env.local`:

```
VITE_MICROSOFT_CLIENT_ID=PASTE_CLIENT_ID_FROM_AZURE
```

**Step 5: Commit**

```bash
git add frontend/src/pages/Registration.jsx frontend/public/oauth-callback.html frontend/.env.local
git commit -m "feat: implement Microsoft OAuth login on Registration page

- Add Microsoft OAuth button with popup flow
- Handle OAuth callback with postMessage
- Exchange authorization code for JWT token
- Update AuthContext on successful login
- Redirect to /mode after authentication
- Add oauth-callback.html for popup redirect
- Add VITE_MICROSOFT_CLIENT_ID environment variable"
```

---

## Task 12: Update Header with User Info

**Files:**
- Modify: `frontend/src/components/layout/Header.jsx`

**Step 1: Read current Header.jsx**

Run:
```bash
cat frontend/src/components/layout/Header.jsx
```

**Step 2: Add user info and logout**

Modify `frontend/src/components/layout/Header.jsx` to add auth context:

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* User menu (only show if authenticated) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {/* Avatar */}
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-primary"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}

                {/* Name and dropdown arrow */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>

                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <Link
                    to="/gallery"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Gallery
                  </Link>
                  <hr className="my-1" />
                  <Link
                    to="/about"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/mode"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Create Art
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/layout/Header.jsx
git commit -m "feat: add user info and logout to Header

- Display user name and avatar from AuthContext
- Show first letter of name if no avatar URL
- Add dropdown menu with navigation links
- Add logout button that clears auth state
- Only show user menu if authenticated"
```

---

## Task 13: Test End-to-End Authentication Flow

**Files:**
- No files modified (testing only)

**Step 1: Start Worker locally**

Run:
```bash
cd cloudflare-worker
wrangler dev
```

Expected: Worker running on http://localhost:8787

**Step 2: Start frontend locally (new terminal)**

Run:
```bash
cd frontend
npm run dev
```

Expected: Frontend running on http://localhost:5173

**Step 3: Test health endpoint**

```bash
curl http://localhost:8787/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Step 4: Manual browser test**

1. Open http://localhost:5173
2. Click "Get Started" or navigate to /register
3. Click "Sign in with Microsoft"
4. OAuth popup should open
5. Sign in with Microsoft account
6. Popup should close, redirect to /mode
7. Header should show user name and avatar
8. Click user dropdown → should see Profile, Settings, Gallery, Logout
9. Navigate to /gallery → should not redirect (authenticated)
10. Click Logout → should redirect to /register
11. Try to navigate to /mode → should redirect to /register (not authenticated)

**Step 5: Check browser console for errors**

Expected: No errors in console

**Step 6: Verify token in localStorage**

Open browser DevTools → Application → Local Storage → http://localhost:5173
Expected: `auth_token` key with JWT value

**Step 7: Stop servers**

Press Ctrl+C in both terminals

**Step 8: Document test results**

No commit needed - testing only

---

## Task 14: Deploy to Production

**Files:**
- No files modified (deployment only)

**Step 1: Build frontend**

```bash
cd frontend
npm run build
```

Expected: `dist/` directory created

**Step 2: Deploy Worker**

```bash
cd ../cloudflare-worker
wrangler deploy
```

Expected:
```
Published arttherapy-plus-api
  https://arttherapy-plus-api.julienh15.workers.dev
```

**Step 3: Update Azure redirect URI for production**

1. Go to Azure Portal → App registrations → ArtTherapy-plus
2. Add redirect URI: `https://arttherapy-plus-api.julienh15.workers.dev/api/auth/microsoft/callback`
3. Save changes

**Step 4: Deploy frontend to Cloudflare Pages**

(Assuming GitHub integration is set up)

```bash
git push origin feature/auth-database
```

Or manual deployment:
```bash
cd frontend
wrangler pages deploy dist
```

**Step 5: Test production OAuth flow**

1. Visit https://arttherapy-plus.pages.dev
2. Navigate to /register
3. Click "Sign in with Microsoft"
4. Complete OAuth flow
5. Verify redirect to /mode
6. Check authenticated routes work
7. Test logout

**Step 6: Commit deployment notes**

```bash
git add .
git commit -m "docs: add deployment verification for Phase 1

Phase 1 complete and deployed:
- Microsoft OAuth authentication working
- JWT token generation and verification
- Protected routes redirecting correctly
- User info displayed in Header
- Logout functionality working

Production URLs:
- Worker: https://arttherapy-plus-api.julienh15.workers.dev
- Frontend: https://arttherapy-plus.pages.dev"
```

---

## Phase 1 Complete ✅

**Delivered:**
- ✅ D1 database with users table
- ✅ Microsoft OAuth 2.0 authentication
- ✅ JWT token generation and verification
- ✅ Authentication middleware for protected endpoints
- ✅ AuthContext provider for global auth state
- ✅ ProtectedRoute component for route authorization
- ✅ Registration page with OAuth flow
- ✅ Header with user info and logout
- ✅ API service with auth methods and interceptors
- ✅ End-to-end authentication tested locally and in production

**Next Steps:**
- Phase 2: Gallery Migration to Database
- Phase 3: Profile & Journal Features

**Testing Checklist:**
- [ ] User can sign in with Microsoft OAuth
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to /register when not authenticated
- [ ] User info displayed in Header
- [ ] Logout clears token and redirects
- [ ] Token verification works on page refresh
- [ ] CORS allows frontend domain
- [ ] Production OAuth flow works end-to-end

---

## Common Issues & Troubleshooting

**Issue: OAuth popup blocked**
- Solution: Allow popups for localhost:5173 in browser settings

**Issue: "Invalid redirect URI" from Microsoft**
- Solution: Verify redirect URI in Azure matches exactly (including https/http, trailing slash)

**Issue: CORS error on Worker**
- Solution: Check CORS headers in response.js allow frontend origin

**Issue: JWT verification fails**
- Solution: Ensure JWT_SECRET is set correctly with `wrangler secret put JWT_SECRET`

**Issue: D1 database not found**
- Solution: Verify database_id in wrangler.toml matches output from `wrangler d1 create`

**Issue: Token expired mid-session**
- Solution: Expected behavior - user will be redirected to /register to re-authenticate

**Issue: Worker deployment fails**
- Solution: Run `npm install` in cloudflare-worker directory, ensure wrangler.toml is valid

---

**End of Phase 1 Implementation Plan**
