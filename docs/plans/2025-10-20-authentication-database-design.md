# Authentication & Database Integration Design

**Project:** ArtTherapy-plus
**Date:** 2025-10-20
**Status:** Approved Design
**Author:** Design Session with Claude Code

## Executive Summary

This document outlines the design for adding user authentication and persistent database storage to the ArtTherapy-plus application. The implementation will use Microsoft OAuth for authentication, Cloudflare D1 (SQLite) for database storage, and JWT tokens for session management.

**Key Decisions:**
- **Authentication:** Microsoft OAuth 2.0 (Azure AD) only
- **Database:** Cloudflare D1 (SQLite)
- **Session Management:** Stateless JWT tokens
- **OAuth Flow:** Hybrid (frontend initiates, Worker handles callback)
- **Schema Design:** Hybrid normalized (separate tables for entities, JSON for settings)
- **Migration Strategy:** No localStorage migration - fresh start for authenticated users
- **Rollout Strategy:** Three-phase deployment (Auth → Gallery → Profile/Journal)

---

## Current State Analysis

### Existing Architecture
- **Frontend:** React 19 + Vite + React Router v7 (port 5173)
- **Backend:** Cloudflare Workers (serverless API)
- **AI Integration:** OpenAI API (GPT-4o-mini, DALL-E 3)
- **Data Storage:** localStorage only (client-side gallery persistence)
- **Authentication:** Complete stub implementation (no backend)

### Current Data Model (localStorage)
```javascript
{
  id: string,              // timestamp as string
  timestamp: string,       // ISO date string
  imageUrl: string,        // DALL-E generated image URL
  description: string,     // user's pain description
  promptUsed: string       // revised OpenAI prompt
}
```

### Key Gaps
- No user identification system
- No persistent server-side storage
- No authentication/authorization
- No cross-device data access
- Profile/Settings pages are non-functional stubs

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ AuthContext  │  │ Protected   │  │  API Service     │   │
│  │ Provider     │→ │ Routes      │→ │  (axios + JWT)   │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTPS + JWT
┌───────────────────────────────▼─────────────────────────────┐
│                  Cloudflare Workers API                      │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Auth         │  │ JWT         │  │  Request Router  │   │
│  │ Middleware   │→ │ Verification│→ │  (handlers)      │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                     Cloudflare D1 (SQLite)                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   users      │  │ gallery_    │  │  journal_        │   │
│  │              │→ │ items       │  │  entries         │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘

External Services:
  ┌──────────────────┐  ┌──────────────────┐
  │ Microsoft OAuth  │  │  OpenAI API      │
  │ (Azure AD)       │  │  (DALL-E 3)      │
  └──────────────────┘  └──────────────────┘
```

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Auth Provider | Microsoft OAuth 2.0 | User preference, no password management |
| Database | Cloudflare D1 (SQLite) | Native Workers integration, SQL queries, free tier |
| Session | JWT (stateless) | Scalable, no server-side session storage |
| Frontend State | React Context API | Built-in, sufficient for auth state |
| API Client | Axios with interceptors | Already in use, supports auth headers |

---

## Database Schema Design

### Schema Philosophy
**Hybrid Normalized Approach:**
- Separate tables for core entities (users, gallery, journal)
- JSON fields for flexible/low-priority data (settings)
- Foreign keys with CASCADE for data integrity
- Indexes on common query patterns

### Complete Schema

```sql
-- Users table (core authentication + profile)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID v4
  microsoft_id TEXT UNIQUE NOT NULL,      -- Microsoft OAuth user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,                              -- From Microsoft profile
  avatar_url TEXT,                        -- Microsoft profile picture

  -- Profile fields (currently in Profile.jsx)
  age INTEGER,
  sex TEXT,
  gender TEXT,
  symptoms TEXT,                          -- JSON array
  location TEXT,
  languages TEXT,                         -- JSON array
  occupation TEXT,
  relationship_status TEXT,
  prescriptions TEXT,                     -- JSON array
  activity_level TEXT,

  -- Settings/preferences as JSON (lower priority)
  settings TEXT DEFAULT '{}',             -- JSON object for all settings

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery items (migrated from localStorage)
CREATE TABLE gallery_items (
  id TEXT PRIMARY KEY,                    -- UUID v4
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,                -- DALL-E generated image URL
  description TEXT NOT NULL,              -- User's pain description
  prompt_used TEXT,                       -- OpenAI's revised prompt
  mode TEXT,                              -- 'create' | 'inspire' | 'edit'

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Journal/reflection entries
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,                    -- UUID v4
  user_id TEXT NOT NULL,
  gallery_item_id TEXT,                   -- Optional link to artwork

  reflection_questions TEXT,              -- JSON array of questions
  responses TEXT,                         -- JSON array of user responses
  notes TEXT,                             -- Freeform notes

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX idx_gallery_user_created ON gallery_items(user_id, created_at DESC);
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX idx_users_email ON users(email);
```

### Data Model Relationships

```
users (1) ──────┬──────> (*) gallery_items
                │
                └──────> (*) journal_entries

gallery_items (1) ────> (0..1) journal_entries
```

### Key Design Decisions

1. **UUIDs as Primary Keys**
   - Better for distributed systems
   - No auto-increment coordination issues
   - Unpredictable IDs (security benefit)

2. **Profile in users Table**
   - Simpler queries (no JOIN needed for profile)
   - Most fields are optional
   - Single point of user data access

3. **Settings as JSON**
   - Low priority feature
   - Flexible schema for future additions
   - Avoid table bloat for rarely-used fields

4. **CASCADE Deletes**
   - User deletion removes all associated data
   - GDPR compliance (right to be forgotten)
   - Data integrity maintained automatically

5. **gallery_item_id Nullable in Journal**
   - Allows standalone journal entries
   - Supports future free-form journaling
   - SET NULL on artwork deletion preserves journal entry

---

## Authentication Flow

### Microsoft OAuth 2.0 Flow (Hybrid)

```
┌─────────┐                                  ┌──────────────┐
│ User    │                                  │  Microsoft   │
│ Browser │                                  │  OAuth       │
└────┬────┘                                  └──────┬───────┘
     │                                              │
     │ 1. Click "Sign in with Microsoft"           │
     ▼                                              │
┌─────────────────┐                                │
│ Frontend React  │                                │
│ (/register)     │                                │
└────┬────────────┘                                │
     │                                              │
     │ 2. Open OAuth popup                          │
     ├─────────────────────────────────────────────>│
     │    with client_id, redirect_uri              │
     │                                              │
     │                        3. User authenticates │
     │                           and grants consent │
     │                                              │
     │ 4. Redirect with authorization code          │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ 5. POST /api/auth/microsoft/callback         │
     │    {code: "auth_code"}                       │
     ▼                                              │
┌─────────────────────────────────────────────┐   │
│ Cloudflare Worker                           │   │
│                                             │   │
│ 6. Exchange code for access token           │   │
│ ────────────────────────────────────────────┼──>│
│                                             │   │
│ 7. Verify token, get user profile           │   │
│ <────────────────────────────────────────────   │
│                                             │
│ 8. Query D1 for user by microsoft_id        │
│    ┌─ If not found: INSERT new user         │
│    └─ If found: Load user record            │
│                                             │
│ 9. Generate JWT token                       │
│    {userId, email, exp: 24h}                │
│                                             │
└────┬────────────────────────────────────────┘
     │
     │ 10. Return {token, user}
     ▼
┌─────────────────┐
│ Frontend React  │
│                 │
│ 11. Store token in localStorage             │
│ 12. Update AuthContext state                │
│ 13. Redirect to /mode                       │
└─────────────────┘
```

### JWT Token Structure

```javascript
{
  // Header
  "alg": "HS256",
  "typ": "JWT",

  // Payload
  "userId": "uuid-v4-string",
  "email": "user@example.com",
  "iat": 1234567890,          // Issued at timestamp
  "exp": 1234654290           // Expires in 24 hours

  // Signature (HMAC SHA256)
  // Verified using JWT_SECRET
}
```

### Authentication State Management

**Frontend (React Context):**
```javascript
AuthContext provides:
  - user: {id, email, name, avatarUrl} | null
  - token: string | null
  - isAuthenticated: boolean
  - isLoading: boolean

Methods:
  - login(token, user): Store token, update state
  - logout(): Clear localStorage, reset state, redirect to /register
  - verifyToken(): Validate token with backend on mount
```

**Token Storage:**
- Location: `localStorage.setItem('auth_token', token)`
- Attached to requests: `Authorization: Bearer <token>` header
- Expiration: 24 hours (configurable)
- Refresh: None (re-login after expiry - can add refresh tokens in future)

### Protected Routes

All routes except `/`, `/register`, and `/about` require authentication:

```javascript
<Route element={<ProtectedRoute />}>
  {/* These routes check isAuthenticated */}
  <Route path="/mode" element={<ModeSelection />} />
  <Route path="/describe" element={<PainDescription />} />
  <Route path="/visualize" element={<Visualize />} />
  <Route path="/edit" element={<Edit />} />
  <Route path="/gallery" element={<Gallery />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/settings" element={<Settings />} />
</Route>
```

**ProtectedRoute Component:**
```javascript
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/register" />;

  return <Outlet />;  // Render children
}
```

---

## API Design

### Authentication Endpoints

#### `POST /api/auth/microsoft/callback`
Exchange Microsoft OAuth authorization code for JWT.

**Request:**
```json
{
  "code": "M.R3_BAY.xxx-authorization-code"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://..."
  }
}
```

**Error Responses:**
- `400` - Invalid or missing code
- `401` - Microsoft token verification failed
- `500` - Server error

---

#### `POST /api/auth/verify`
Verify current JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://..."
  }
}
```

**Error Response:**
- `401` - Invalid or expired token

---

#### `POST /api/auth/logout`
Client-side logout (no server action required with stateless JWT).

**Response (200):**
```json
{
  "success": true
}
```

---

### User Profile Endpoints

#### `GET /api/user/profile`
Get current user's complete profile.

**Auth:** Required

**Success Response (200):**
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "age": 35,
  "sex": "female",
  "gender": "non-binary",
  "symptoms": ["chronic pain", "anxiety"],
  "location": "San Francisco, CA",
  "languages": ["English", "Spanish"],
  "occupation": "Software Engineer",
  "relationshipStatus": "single",
  "prescriptions": ["medication1", "medication2"],
  "activityLevel": "moderate",
  "settings": {},
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

#### `PUT /api/user/profile`
Update user profile fields.

**Auth:** Required

**Request (partial update):**
```json
{
  "age": 36,
  "symptoms": ["chronic pain", "anxiety", "depression"],
  "occupation": "Senior Software Engineer"
}
```

**Success Response (200):**
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  // ... complete updated user object
}
```

---

### Gallery Endpoints (Updated for Auth)

#### `POST /api/gallery`
Save generated artwork to user's gallery.

**Auth:** Required

**Request:**
```json
{
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "description": "A visualization of my chronic back pain as a storm...",
  "promptUsed": "An abstract artistic representation of chronic pain...",
  "mode": "create"
}
```

**Success Response (201):**
```json
{
  "id": "uuid-v4",
  "userId": "uuid-v4",
  "imageUrl": "https://...",
  "description": "...",
  "promptUsed": "...",
  "mode": "create",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

#### `GET /api/gallery`
Get user's gallery items (paginated).

**Auth:** Required

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

**Success Response (200):**
```json
{
  "items": [
    {
      "id": "uuid-v4",
      "userId": "uuid-v4",
      "imageUrl": "https://...",
      "description": "...",
      "promptUsed": "...",
      "mode": "create",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

#### `DELETE /api/gallery/:id`
Delete a gallery item.

**Auth:** Required

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `404` - Gallery item not found
- `403` - Gallery item belongs to different user

---

### Journal Endpoints

#### `POST /api/journal`
Create a journal entry.

**Auth:** Required

**Request:**
```json
{
  "galleryItemId": "uuid-v4",  // optional
  "reflectionQuestions": [
    "What emotions does this image bring up?",
    "How has your pain changed today?"
  ],
  "responses": [
    "I feel a sense of calm looking at this...",
    "The pain is less intense than yesterday..."
  ],
  "notes": "Today was a good day overall."
}
```

**Success Response (201):**
```json
{
  "id": "uuid-v4",
  "userId": "uuid-v4",
  "galleryItemId": "uuid-v4",
  "reflectionQuestions": [...],
  "responses": [...],
  "notes": "...",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

#### `GET /api/journal`
Get user's journal entries (paginated).

**Auth:** Required

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Success Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid-v4",
      "userId": "uuid-v4",
      "galleryItemId": "uuid-v4",
      "reflectionQuestions": [...],
      "responses": [...],
      "notes": "...",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 8,
  "limit": 20,
  "offset": 0
}
```

---

### Existing OpenAI Endpoints (Updated in Phase 2)

These endpoints will be updated to require authentication in Phase 2:

- `POST /api/generate/image` - Add auth requirement, auto-save to gallery
- `POST /api/generate/prompt` - Add auth requirement
- `POST /api/reflect` - Add auth requirement
- `GET /api/inspire` - Add auth requirement
- `POST /api/edit/image` - Add auth requirement

---

## Frontend Implementation

### File Structure Changes

```
frontend/src/
├── contexts/
│   └── AuthContext.jsx              # NEW: Global auth state provider
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx       # NEW: Route protection wrapper
│   ├── common/
│   │   ├── Button.jsx               # EXISTING
│   │   └── Logo.jsx                 # EXISTING
│   ├── forms/
│   │   └── TextInput.jsx            # EXISTING
│   ├── layout/
│   │   ├── AppLayout.jsx            # EXISTING
│   │   └── Header.jsx               # UPDATE: Add user dropdown with auth
│   └── ...
├── pages/
│   ├── Registration.jsx             # UPDATE: Add real Microsoft OAuth
│   ├── Profile.jsx                  # UPDATE: Connect to API
│   ├── Settings.jsx                 # UPDATE: Connect to API (Phase 3)
│   ├── Gallery.jsx                  # UPDATE: Fetch from API not localStorage
│   ├── Visualize.jsx                # UPDATE: Save to API not localStorage
│   └── ...
├── services/
│   └── api.js                       # UPDATE: Add auth methods, interceptors
└── utils/
    └── storage.js                   # DEPRECATED: Remove gallery storage
```

### AuthContext Implementation

**Purpose:** Manage global authentication state across the application.

**State:**
```javascript
{
  user: {
    id: string,
    email: string,
    name: string,
    avatarUrl: string
  } | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean
}
```

**Methods:**
```javascript
- login(token, user): Store token in localStorage, update state
- logout(): Clear localStorage, reset state, navigate to /register
- verifyToken(): Call API to verify token validity (on mount)
```

**Usage:**
```javascript
// In any component
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.name}!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### API Service Updates

**Add Request Interceptor (JWT Injection):**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Add Response Interceptor (401 Handling):**
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - force logout
      localStorage.removeItem('auth_token');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);
```

**New API Methods:**
```javascript
const painPlusAPI = {
  // Auth
  auth: {
    microsoftCallback: (code) =>
      api.post('/auth/microsoft/callback', { code }),
    verifyToken: () =>
      api.post('/auth/verify'),
    logout: () =>
      api.post('/auth/logout')
  },

  // User
  user: {
    getProfile: () =>
      api.get('/user/profile'),
    updateProfile: (data) =>
      api.put('/user/profile', data)
  },

  // Gallery (updated signatures)
  gallery: {
    save: (item) =>
      api.post('/gallery', item),
    getAll: (limit = 50, offset = 0) =>
      api.get(`/gallery?limit=${limit}&offset=${offset}`),
    delete: (id) =>
      api.delete(`/gallery/${id}`)
  },

  // Journal
  journal: {
    create: (entry) =>
      api.post('/journal', entry),
    getAll: (limit = 20, offset = 0) =>
      api.get(`/journal?limit=${limit}&offset=${offset}`)
  },

  // Existing OpenAI methods (unchanged interface)
  generateImage: (description) => ...,
  generatePrompt: (description) => ...,
  reflect: (description, imageContext) => ...,
  getInspiration: () => ...,
  editImage: ({ image, description }) => ...
};
```

### Registration Page OAuth Implementation

**Microsoft OAuth Configuration:**
```javascript
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/api/auth/microsoft/callback`;

const OAUTH_URL =
  `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${MICROSOFT_CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent('openid email profile')}&` +
  `response_mode=query`;
```

**OAuth Flow Handler:**
```javascript
const handleMicrosoftLogin = () => {
  // Open OAuth popup
  const popup = window.open(
    OAUTH_URL,
    'Microsoft Login',
    'width=500,height=600'
  );

  // Listen for OAuth callback
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'microsoft-oauth-callback') {
      const { code } = event.data;

      try {
        // Exchange code for JWT
        const response = await painPlusAPI.auth.microsoftCallback(code);
        const { token, user } = response.data;

        // Store token and update auth context
        localStorage.setItem('auth_token', token);
        login(token, user);

        // Redirect to authenticated home
        navigate('/mode');
      } catch (error) {
        setError('Authentication failed. Please try again.');
      }
    }
  });
};
```

### Updated Component Behaviors

**Gallery.jsx:**
- Remove: `import { galleryStorage } from '../utils/storage'`
- Add: `const { user } = useAuth()`
- Change: Fetch from `painPlusAPI.gallery.getAll()` instead of localStorage
- Add: Loading state while fetching
- Add: Empty state if no gallery items

**Visualize.jsx:**
- Remove: `galleryStorage.save(item)`
- Change: Call `painPlusAPI.gallery.save(item)` after image generation
- Add: Error handling for save failures
- Keep: Navigate with state to pass image data to current view

**Header.jsx:**
- Add: `const { user, logout } = useAuth()`
- Change: Display `user.name` and `user.avatarUrl` in dropdown
- Add: Logout button that calls `logout()`
- Conditional: Only show user menu if authenticated

**Profile.jsx:**
- Remove: Hardcoded profile data
- Add: `useEffect(() => { fetchProfile() }, [])`
- Change: Fetch from `painPlusAPI.user.getProfile()`
- Add: Form submission to `painPlusAPI.user.updateProfile(data)`
- Add: Loading and error states

---

## Backend Implementation

### Cloudflare Worker Structure

```
cloudflare-worker/src/
├── index.js                   # Main request router
├── middleware/
│   └── auth.js               # JWT verification middleware
├── handlers/
│   ├── auth.js               # Microsoft OAuth handlers
│   ├── user.js               # User profile handlers
│   ├── gallery.js            # Gallery CRUD handlers
│   ├── journal.js            # Journal handlers
│   └── generate.js           # OpenAI endpoints (existing, updated)
├── db/
│   ├── schema.sql            # D1 schema definitions
│   └── queries.js            # Reusable SQL query functions
└── utils/
    ├── jwt.js                # JWT generation/verification
    ├── oauth.js              # Microsoft OAuth helpers
    └── response.js           # Standardized JSON responses
```

### Environment Configuration (wrangler.toml)

```toml
name = "arttherapy-plus-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "arttherapy-plus-db"
database_id = "<generated-on-wrangler-d1-create>"

# Public environment variables
[vars]
MICROSOFT_CLIENT_ID = "xxx-xxx-xxx-xxx"
MICROSOFT_TENANT_ID = "common"

# Secrets (set via: wrangler secret put SECRET_NAME)
# - MICROSOFT_CLIENT_SECRET
# - JWT_SECRET
# - OPENAI_API_KEY (already configured)
```

### Request Router Pattern

```javascript
// src/index.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Public endpoints
    if (path === '/api/auth/microsoft/callback') {
      return handleMicrosoftCallback(request, env);
    }

    // Protected endpoints - verify JWT
    if (requiresAuth(path)) {
      const authResult = await verifyAuth(request, env);

      if (!authResult.valid) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Route to handler with user context
      return routeProtected(request, env, authResult.user);
    }

    // Health check
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok' });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
```

### Authentication Middleware

**Purpose:** Verify JWT and attach user to request context.

```javascript
// src/middleware/auth.js
export async function verifyAuth(request, env) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);

    // Verify JWT signature and expiration
    const payload = await verifyJWT(token, env.JWT_SECRET);

    // Query D1 for user
    const user = await env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    return { valid: true, user };

  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### JWT Utilities

```javascript
// src/utils/jwt.js
import { SignJWT, jwtVerify } from 'jose';

export async function generateJWT(payload, secret) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function verifyJWT(token, secret) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const { payload } = await jwtVerify(token, secretKey);
  return payload;
}
```

### Microsoft OAuth Handler

```javascript
// src/handlers/auth.js
export async function handleMicrosoftCallback(request, env) {
  try {
    const { code } = await request.json();

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

    const { access_token } = await tokenResponse.json();

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

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

      user = { id: userId, microsoft_id: profile.id, email: profile.mail, name: profile.displayName };
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
    return jsonResponse({ error: 'Authentication failed' }, 401);
  }
}
```

### Gallery Handler Example

```javascript
// src/handlers/gallery.js
export async function handleCreateGalleryItem(request, env, user) {
  try {
    const { imageUrl, description, promptUsed, mode } = await request.json();

    const id = crypto.randomUUID();

    await env.DB
      .prepare(`
        INSERT INTO gallery_items (id, user_id, image_url, description, prompt_used, mode)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(id, user.id, imageUrl, description, promptUsed, mode)
      .run();

    const item = await env.DB
      .prepare('SELECT * FROM gallery_items WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(item, 201);

  } catch (error) {
    return jsonResponse({ error: 'Failed to create gallery item' }, 500);
  }
}

export async function handleGetGallery(request, env, user) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const items = await env.DB
    .prepare(`
      SELECT * FROM gallery_items
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(user.id, limit, offset)
    .all();

  const total = await env.DB
    .prepare('SELECT COUNT(*) as count FROM gallery_items WHERE user_id = ?')
    .bind(user.id)
    .first();

  return jsonResponse({
    items: items.results,
    total: total.count,
    limit,
    offset
  });
}
```

---

## Implementation Phases

### Phase 1: Authentication Foundation (Week 1)

**Goal:** Users can sign in with Microsoft OAuth and access protected routes.

**Backend Tasks:**
1. Create D1 database: `wrangler d1 create arttherapy-plus-db`
2. Run schema.sql to create `users` table
3. Implement Microsoft OAuth handler (`/api/auth/microsoft/callback`)
4. Implement JWT generation and verification utilities
5. Implement authentication middleware
6. Implement `/api/auth/verify` endpoint
7. Set up environment variables and secrets

**Frontend Tasks:**
1. Create `AuthContext.jsx` with provider and hooks
2. Create `ProtectedRoute.jsx` component
3. Update `api.js` with auth methods and interceptors
4. Update `Registration.jsx` with real Microsoft OAuth flow
5. Update `Header.jsx` to display user info and logout
6. Wrap protected routes in `App.jsx` with `<ProtectedRoute>`
7. Test OAuth flow end-to-end

**Testing:**
- [ ] User can click "Sign in with Microsoft"
- [ ] OAuth popup opens correctly
- [ ] New user signup creates user in D1
- [ ] Returning user login loads existing user
- [ ] JWT token is stored in localStorage
- [ ] Protected routes redirect to /register when not authenticated
- [ ] Header displays user name and avatar
- [ ] Logout clears token and redirects to /register
- [ ] Token verification works on page refresh

**Deployment:**
- Deploy Worker with new auth endpoints
- Deploy frontend with auth UI
- Verify OAuth redirect URIs are configured in Azure

---

### Phase 2: Gallery Migration to Database (Week 2)

**Goal:** All artwork is saved to D1 and associated with users.

**Backend Tasks:**
1. Add `gallery_items` table to schema
2. Implement `/api/gallery` POST endpoint (create item)
3. Implement `/api/gallery` GET endpoint (list user's items)
4. Implement `/api/gallery/:id` DELETE endpoint
5. Update `/api/generate/image` to require auth
6. Update `/api/edit/image` to require auth

**Frontend Tasks:**
1. Update `Visualize.jsx` to save to API instead of localStorage
2. Update `Gallery.jsx` to fetch from API instead of localStorage
3. Update `Edit.jsx` to save to API
4. Remove gallery-related code from `utils/storage.js`
5. Add loading states for API calls
6. Add error handling for gallery operations
7. Add empty state when gallery is empty

**Data Migration:**
- No automatic migration from localStorage
- Users start with fresh gallery after authentication
- (Optional) Add manual export/import tool if needed

**Testing:**
- [ ] Generated artwork saves to D1 with user_id
- [ ] Gallery page displays only current user's artwork
- [ ] Artwork persists across browser sessions
- [ ] Delete artwork removes from database
- [ ] Unauthenticated users cannot access gallery endpoints
- [ ] DALL-E image URLs remain accessible after save

**Deployment:**
- Run D1 migration to add gallery_items table
- Deploy Worker with updated endpoints
- Deploy frontend with updated gallery logic

---

### Phase 3: Profile & Journal Features (Week 3)

**Goal:** Users can edit their profile and create journal entries.

**Backend Tasks:**
1. Add `journal_entries` table to schema
2. Add profile fields to existing `users` table (migration)
3. Implement `/api/user/profile` GET endpoint
4. Implement `/api/user/profile` PUT endpoint
5. Implement `/api/journal` POST endpoint
6. Implement `/api/journal` GET endpoint

**Frontend Tasks:**
1. Update `Profile.jsx` with form for profile fields
2. Connect profile form to API (`getProfile`, `updateProfile`)
3. Add journal entry UI to `Visualize.jsx` (optional reflection responses)
4. Create journal list view (new page or section)
5. Add loading/saving states for profile updates
6. Add validation for profile fields

**Settings (Low Priority):**
- Defer to future iteration
- Can use existing `settings` JSON field in users table when needed

**Testing:**
- [ ] Profile page loads user data from database
- [ ] Profile updates save successfully
- [ ] Journal entries can be created with optional gallery link
- [ ] Journal entries persist and can be viewed
- [ ] Profile fields validate correctly
- [ ] Multiple profile updates don't lose data

**Deployment:**
- Run D1 migration to add journal_entries table and profile fields
- Deploy Worker with user/journal endpoints
- Deploy frontend with profile/journal UI

---

## Security Considerations

### Authentication Security

1. **JWT Secret Management**
   - Must be cryptographically random (256-bit minimum)
   - Set via Wrangler secrets (never in code)
   - Rotate periodically (implement key rotation if needed)

2. **Token Expiration**
   - Default: 24 hours
   - Configurable via environment variable
   - Frontend must handle expired tokens gracefully

3. **OAuth Security**
   - Validate redirect URI matches registered URI
   - Verify state parameter (add CSRF protection if needed)
   - Use HTTPS for all OAuth callbacks
   - Don't expose client secret in frontend

### API Security

1. **CORS Configuration**
   - Production: Only allow specific domain
   - Current: `https://arttherapy-plus.pages.dev`
   - Never use `*` in production

2. **SQL Injection Prevention**
   - Always use parameterized queries (D1 prepared statements)
   - Never concatenate user input into SQL strings
   - Example: `.bind(userId, description)` not `WHERE id = ${userId}`

3. **Authorization**
   - Verify user owns resource before modification
   - Check `gallery_items.user_id === authenticated_user.id`
   - Return 403 Forbidden if user doesn't own resource

4. **Rate Limiting**
   - Consider adding rate limits to auth endpoints
   - Prevent brute force attacks on OAuth callback
   - Use Cloudflare rate limiting rules if needed

### Data Security

1. **User Data Privacy**
   - CASCADE deletes ensure complete user data removal
   - Implement user deletion endpoint (GDPR compliance)
   - Don't log sensitive user data

2. **XSS Protection**
   - React escapes by default
   - Validate and sanitize user inputs
   - Use Content-Security-Policy headers

3. **HTTPS Only**
   - Cloudflare Workers enforce HTTPS in production
   - Redirect HTTP to HTTPS at edge

---

## Error Handling

### Backend Error Responses

**Standardized Error Format:**
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE_ENUM",
  "details": {}  // Optional, only in development
}
```

**HTTP Status Codes:**
- `400` - Bad Request (missing/invalid data)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (valid token, insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Common Error Codes:**
- `AUTH_FAILED` - OAuth authentication failed
- `INVALID_TOKEN` - JWT verification failed
- `EXPIRED_TOKEN` - JWT expired
- `USER_NOT_FOUND` - User doesn't exist
- `RESOURCE_NOT_FOUND` - Gallery item / journal entry not found
- `PERMISSION_DENIED` - User doesn't own resource
- `VALIDATION_ERROR` - Invalid input data

### Frontend Error Handling

**API Interceptor (401 Auto-Logout):**
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);
```

**Component-Level Error Handling:**
```javascript
try {
  const response = await painPlusAPI.gallery.save(item);
  setGalleryItem(response.data);
} catch (error) {
  if (error.response?.data?.error) {
    setError(error.response.data.error);
  } else {
    setError('Something went wrong. Please try again.');
  }
}
```

**OAuth Error Scenarios:**
- User denies consent → Show message, stay on `/register`
- Invalid OAuth code → Show error, allow retry
- Network failure → Show error with retry button
- Token expired mid-session → Auto-logout and redirect

**Loading States:**
- Show spinner during async operations
- Disable buttons during submission
- Display loading skeleton for data fetching

---

## Testing Strategy

### Backend Testing

**Manual Testing with curl/Postman:**
```bash
# Test OAuth callback
curl -X POST https://localhost:8787/api/auth/microsoft/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test-code"}'

# Test authenticated endpoint
curl https://localhost:8787/api/gallery \
  -H "Authorization: Bearer eyJhbGc..."

# Test token verification
curl -X POST https://localhost:8787/api/auth/verify \
  -H "Authorization: Bearer eyJhbGc..."
```

**D1 Database Queries:**
```bash
# Verify user created
wrangler d1 execute arttherapy-plus-db \
  --command "SELECT * FROM users WHERE email = 'test@example.com'"

# Check gallery items
wrangler d1 execute arttherapy-plus-db \
  --command "SELECT * FROM gallery_items WHERE user_id = 'uuid'"
```

**Test Cases:**
- [ ] OAuth flow with valid code creates user
- [ ] OAuth flow with existing user returns same user
- [ ] JWT generation includes correct payload
- [ ] JWT verification rejects expired tokens
- [ ] JWT verification rejects invalid signatures
- [ ] Gallery endpoints require authentication
- [ ] Gallery items filtered by user_id
- [ ] Delete only allows owner to delete
- [ ] Profile update only modifies allowed fields

### Frontend Testing

**Manual Browser Testing:**
- [ ] OAuth popup opens in all browsers (Chrome, Safari, Firefox)
- [ ] OAuth callback closes popup and updates UI
- [ ] Token persists across page refresh
- [ ] Protected routes redirect correctly
- [ ] Logout clears all state
- [ ] Gallery displays user's artwork
- [ ] Profile form loads and saves data
- [ ] Error messages display correctly

**Network Failure Testing:**
- [ ] Offline: Show error message
- [ ] 401 response: Auto-logout
- [ ] 500 response: Show generic error
- [ ] Slow network: Show loading state

### Integration Testing

**End-to-End User Journey:**
1. Visit homepage → Click "Get Started"
2. Click "Sign in with Microsoft" → OAuth popup opens
3. Authenticate with Microsoft → Popup closes, redirected to `/mode`
4. Create artwork → Saves to database
5. View gallery → Shows saved artwork
6. Logout → Redirected to home
7. Login again → Gallery persists

**Cross-Device Testing:**
- Create artwork on desktop → View on mobile (same account)
- Update profile on mobile → Changes reflect on desktop

---

## Deployment Checklist

### Azure App Registration (Microsoft OAuth)

- [ ] Create App Registration in Azure Portal
- [ ] Set redirect URI: `https://arttherapy-plus-api.julienh15.workers.dev/api/auth/microsoft/callback`
- [ ] Add authorized JavaScript origin: `https://arttherapy-plus.pages.dev`
- [ ] Set supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
- [ ] Add API permission: `User.Read` (Microsoft Graph)
- [ ] Create client secret, copy value
- [ ] Copy Application (client) ID

### Cloudflare D1 Database

- [ ] Create database: `wrangler d1 create arttherapy-plus-db`
- [ ] Copy database ID to `wrangler.toml`
- [ ] Run schema: `wrangler d1 execute arttherapy-plus-db --file=./src/db/schema.sql`
- [ ] Verify tables: `wrangler d1 execute arttherapy-plus-db --command="SELECT name FROM sqlite_master WHERE type='table'"`

### Cloudflare Worker Secrets

```bash
# Set Microsoft OAuth secrets
wrangler secret put MICROSOFT_CLIENT_SECRET
# Paste secret from Azure

# Set JWT secret (generate random 256-bit string)
wrangler secret put JWT_SECRET
# Paste random secret

# Verify OpenAI key is still set
wrangler secret list
```

### Environment Variables

**Worker (wrangler.toml):**
```toml
[vars]
MICROSOFT_CLIENT_ID = "xxx-xxx-xxx-xxx"
MICROSOFT_TENANT_ID = "common"
```

**Frontend (.env.production):**
```bash
VITE_MICROSOFT_CLIENT_ID=xxx-xxx-xxx-xxx
VITE_API_URL=https://arttherapy-plus-api.julienh15.workers.dev/api
```

### CORS Configuration

**Update Worker CORS headers for production:**
```javascript
const allowedOrigins = [
  'https://arttherapy-plus.pages.dev',
  'http://localhost:5173'  // Development only
];

function getCORSHeaders(origin) {
  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };
  }
  return {};
}
```

### Deployment Commands

```bash
# Frontend
cd frontend
npm run build
# Deploy to Cloudflare Pages (automatic via GitHub)

# Worker
cd cloudflare-worker
wrangler deploy

# Verify deployment
curl https://arttherapy-plus-api.julienh15.workers.dev/api/health
```

### Post-Deployment Verification

- [ ] Health check returns 200 OK
- [ ] OAuth redirect works in production
- [ ] JWT tokens generate correctly
- [ ] D1 database queries execute
- [ ] Frontend can authenticate
- [ ] Gallery saves and loads data
- [ ] CORS allows production domain
- [ ] Error handling works correctly

---

## Future Enhancements

### Phase 4+: Optional Features (Post-MVP)

**Refresh Tokens:**
- Implement refresh token rotation
- Store refresh tokens in Cloudflare KV
- Extend session beyond 24 hours without re-login

**Rate Limiting:**
- Add rate limits to auth endpoints
- Prevent abuse of image generation endpoints
- Use Cloudflare rate limiting rules

**Settings Persistence:**
- Implement settings UI in Settings.jsx
- Save to `users.settings` JSON field
- Support accessibility preferences, language selection

**Email Notifications:**
- Welcome email on signup
- Weekly reflection reminders
- Send via Cloudflare Email Workers or SendGrid

**Social Features:**
- Share artwork publicly (optional)
- Community gallery (anonymized)
- Export artwork as PDF/image gallery

**Analytics:**
- Track user engagement (gallery size, frequency)
- Reflection completion rates
- Pain tracking over time (trends)

**Advanced Journal:**
- Rich text editor for notes
- Tag journal entries
- Search/filter journal by date/tags
- Export journal as PDF

**Multi-Device Sync:**
- Real-time sync via WebSockets (if needed)
- Conflict resolution for offline edits
- Push notifications for reminders

---

## Appendix

### File Locations Reference

**Frontend:**
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/contexts/AuthContext.jsx` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/components/auth/ProtectedRoute.jsx` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/services/api.js` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/pages/Registration.jsx` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/components/layout/Header.jsx` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/pages/Gallery.jsx` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/pages/Visualize.jsx` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/frontend/src/pages/Profile.jsx` - UPDATE

**Backend:**
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/index.js` - UPDATE
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/middleware/auth.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/handlers/auth.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/handlers/user.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/handlers/gallery.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/handlers/journal.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/db/schema.sql` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/utils/jwt.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/src/utils/oauth.js` - NEW
- `/Users/julien.hovan/Github/ArtTherapy-plus/cloudflare-worker/wrangler.toml` - UPDATE

**Configuration:**
- `/Users/julien.hovan/Github/ArtTherapy-plus/docs/plans/2025-10-20-authentication-database-design.md` - THIS FILE

### External Documentation

- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [React Context API](https://react.dev/reference/react/useContext)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**End of Design Document**
