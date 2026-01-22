# Architecture

## System Overview

```
Frontend (React 19 + Vite)     -->    Cloudflare Workers (API)
    |                                        |
    v                                        v
Azure Static Web Apps              D1 (SQLite) + R2 (Object Storage)
                                             |
                                             v
                                    OpenAI API + Microsoft OAuth
```

## Frontend Architecture

### Technology Stack
- React 19 with Vite 7.x build tool
- React Router v7 for client-side routing
- Tailwind CSS 3.x with custom theme
- Axios for HTTP with request/response interceptors

### Project Structure
```
frontend/
  src/
    components/
      auth/           # ProtectedRoute
      common/         # Button, Logo, Skeleton, ErrorBoundary, LoadingButton
      forms/          # TextInput, PasswordInput
      layout/         # AppLayout, Header
      modals/         # ImageModal, OnboardingModal
    contexts/         # AuthContext (user state, token management)
    pages/            # Route-level components
    services/         # api.js (painPlusAPI client)
    utils/            # imageCompression, storage
    styles/           # CSS files
```

### Route Structure
| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| / | Welcome | Public | Landing page |
| /register | Registration | Public | Sign up/login form |
| /about | About | Public | Information page |
| /mode | ModeSelection | Protected | Create/Inspire selection |
| /describe | PainDescription | Protected | Pain input form |
| /visualize | Visualize | Protected | Generated art display |
| /edit | Edit | Protected | Image transformation |
| /gallery | Gallery | Protected | User's saved artwork |
| /reflect | Reflect | Protected | Reflection questions |
| /inspire | Inspire | Protected | Inspiration prompts |
| /journal | Journal | Protected | Reflection history |
| /profile | Profile | Protected | User profile settings |
| /settings | Settings | Protected | App preferences |

### State Management
- AuthContext: User authentication state (user, token, isAuthenticated, isLoading)
- Component-level state: React useState for local UI state
- localStorage: JWT token persistence (`auth_token`)
- sessionStorage: OAuth PKCE code verifier, redirect paths

## Backend Architecture (Cloudflare Workers)

### Technology Stack
- Cloudflare Workers (V8 isolates, edge computing)
- Cloudflare D1 (SQLite at edge)
- Cloudflare R2 (S3-compatible object storage)
- OpenAI SDK 4.x for AI integration
- jose 6.x for JWT handling

### Project Structure
```
cloudflare-worker/
  src/
    index.js          # Main router, request handling
    handlers/
      auth.js         # Microsoft OAuth, email/password auth
      gallery.js      # Save/fetch/delete gallery items
      journal.js      # Journal entry CRUD
      user.js         # Profile management
    middleware/
      auth.js         # JWT verification
      rateLimit.js    # Brute force protection
    utils/
      jwt.js          # Token generation/verification
      password.js     # PBKDF2 hashing
      response.js     # JSON response helpers, CORS
      storage.js      # R2 image storage
    db/
      schema.sql      # D1 database schema
```

### D1 Database Schema
```sql
users (
  id, microsoft_id, email, name, avatar_url,
  password_hash, password_salt, auth_provider,
  age, sex, gender, symptoms, location, languages,
  occupation, relationship_status, prescriptions, activity_level,
  settings, created_at, updated_at
)

gallery_items (
  id, user_id, image_url, description,
  prompt_used, mode, created_at
)

journal_entries (
  id, user_id, gallery_item_id,
  reflection_questions, responses, notes,
  created_at, updated_at
)

rate_limits (id, ip, endpoint, timestamp)
```

### R2 Storage Structure
```
arttherapy-plus-images/
  generated/{user_id}/{timestamp}-{uuid}.png
  edited/{user_id}/{timestamp}-{uuid}.png
```
Public URL: `https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev`

## API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Email/password registration (rate limited: 3/hour) |
| POST | /api/auth/login | Email/password login (rate limited: 5/min) |
| POST | /api/auth/microsoft/callback | Receives access_token, returns JWT |
| POST | /api/auth/verify | Verify JWT, return user data |
| POST | /api/auth/logout | Client-side logout stub |

### AI Generation (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/generate/image | DALL-E 3 art generation from pain description |
| POST | /api/generate/prompt | GPT-4o-mini creative prompts |
| POST | /api/edit/image | Vision analysis + DALL-E 3 style transfer |
| POST | /api/reflect | GPT-4o-mini reflection questions |
| GET | /api/inspire | GPT-4o-mini inspirational prompts |

### Data (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/gallery | List/save gallery items |
| DELETE | /api/gallery/:id | Delete gallery item |
| GET/POST | /api/journal | List/create journal entries |
| GET/PUT | /api/user/profile | Get/update user profile |

## External Services

### OpenAI API
- DALL-E 3: 1024x1024 standard quality images
- GPT-4o-mini: Text generation (prompts, reflection, inspiration)
- GPT-4o-mini Vision: Image style analysis for transformation

### Microsoft Entra ID (OAuth)
- Client ID: `1068db0a-2e86-4094-aa91-b55bca8ac09a`
- Tenant: `common` (multi-tenant)
- Scopes: `openid email profile User.Read`
- Flow: PKCE (frontend token exchange)

## Security Architecture

### Authentication
- JWT tokens: HS256, 7-day expiry
- Password hashing: PBKDF2 (100,000 iterations)
- Timing-safe comparison for password verification

### Rate Limiting
- Login: 5 attempts/minute/IP
- Signup: 3 attempts/hour/IP
- Stored in D1 with cleanup of old entries

### CORS
Allowed origins:
- `https://arttherapy-plus.pages.dev`
- `https://witty-glacier-01b4b7710.2.azurestaticapps.net`
- `http://localhost:5173`
