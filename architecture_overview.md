# ArtTherapy+ Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│                     React 19 + Vite + Tailwind CSS                          │
│                    Hosted on Cloudflare Pages                                │
│                  https://arttherapy-plus.pages.dev                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE WORKER                                  │
│                         (Edge Computing API)                                 │
│              https://arttherapy-plus-api.julienh15.workers.dev              │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Auth     │  │   Gallery   │  │   OpenAI    │  │   Storage   │        │
│  │  Handlers   │  │  Handlers   │  │  Handlers   │  │   Utils     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                │                ▼
┌─────────────────┐ ┌─────────────────┐    │    ┌─────────────────┐
│  Cloudflare D1  │ │  Cloudflare D1  │    │    │  Cloudflare R2  │
│   (SQLite DB)   │ │   (SQLite DB)   │    │    │ (Object Storage)│
│                 │ │                 │    │    │                 │
│  - users        │ │  - gallery_items│    │    │  - generated/   │
│  - rate_limits  │ │  - journal_entries   │    │  - edited/      │
└─────────────────┘ └─────────────────┘    │    └─────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │     OpenAI API      │
                              │                     │
                              │  - DALL-E 3         │
                              │  - GPT-4o-mini      │
                              └─────────────────────┘
                                           │
          ┌────────────────────────────────┘
          ▼
┌─────────────────────┐
│   Microsoft Entra   │
│   (Azure AD OAuth)  │
│                     │
│  - Authentication   │
│  - User Profile     │
└─────────────────────┘
```

---

## Technology Stack

### Frontend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 19 | UI components and state management |
| Build Tool | Vite | Fast development server and bundling |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Routing | React Router v7 | Client-side navigation |
| HTTP Client | Axios | API communication with interceptors |
| Hosting | Cloudflare Pages | Global CDN deployment |

### Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Cloudflare Workers | Edge computing (V8 isolates) |
| Database | Cloudflare D1 | SQLite at the edge |
| Storage | Cloudflare R2 | S3-compatible object storage |
| AI/ML | OpenAI API | Image generation (DALL-E 3) and text (GPT-4o-mini) |

### Authentication
| Method | Provider | Details |
|--------|----------|---------|
| OAuth 2.0 | Microsoft Entra ID | Social login with Microsoft accounts |
| Email/Password | Custom | PBKDF2 password hashing with timing-safe comparison |
| Session | JWT | Stateless tokens with 7-day expiry |

---

## Cloudflare Services

### D1 Database (SQLite)
- **Database Name:** `arttherapy-plus-db`
- **Database ID:** `87e9664f-3f72-4dce-aab9-b330c72b7471`

#### Tables
```sql
-- Users (authentication + profile)
users (
  id TEXT PRIMARY KEY,           -- UUID
  microsoft_id TEXT UNIQUE,      -- OAuth users
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  password_hash TEXT,            -- Email/password users
  password_salt TEXT,
  auth_provider TEXT DEFAULT 'email',  -- 'email' | 'microsoft'
  -- Profile fields
  age, sex, gender, symptoms, location, languages,
  occupation, relationship_status, prescriptions, activity_level,
  settings TEXT DEFAULT '{}',
  created_at, updated_at
)

-- Gallery items (user artwork)
gallery_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_used TEXT,
  mode TEXT,  -- 'create' | 'inspire' | 'edit'
  created_at
)

-- Journal/reflection entries
journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  gallery_item_id TEXT,
  reflection_questions TEXT,  -- JSON
  responses TEXT,             -- JSON
  notes TEXT,
  created_at, updated_at
)

-- Rate limiting
rate_limits (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  timestamp INTEGER NOT NULL
)
```

### R2 Object Storage
- **Bucket Name:** `arttherapy-plus-images`
- **Public URL:** `https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev`
- **Purpose:** Persistent image storage (DALL-E URLs expire after ~1 hour)

#### Storage Structure
```
arttherapy-plus-images/
├── generated/
│   └── {user_id}/
│       └── {timestamp}-{uuid}.png
└── edited/
    └── {user_id}/
        └── {timestamp}-{uuid}.png
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Email/password registration (rate limited) |
| POST | `/api/auth/login` | Public | Email/password login (rate limited) |
| POST | `/api/auth/microsoft/callback` | Public | Microsoft OAuth code exchange |
| POST | `/api/auth/verify` | Bearer | Verify JWT and get user data |
| POST | `/api/auth/logout` | Public | Client-side logout acknowledgment |

### Image Generation (Protected)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/generate/image` | Bearer | Generate art from pain description |
| POST | `/api/generate/prompt` | Bearer | Generate creative prompts |
| POST | `/api/edit/image` | Bearer | Transform existing image with new pain context |

### Reflection (Protected)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reflect` | Bearer | Generate reflection questions |
| GET | `/api/inspire` | Bearer | Get inspirational prompts |

### Utility
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Health check |

---

## Authentication Flow

### Microsoft OAuth Flow
```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Browser │     │   Frontend  │     │   Worker    │     │  Microsoft  │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │                   │
     │ Click Login     │                   │                   │
     │────────────────>│                   │                   │
     │                 │                   │                   │
     │   Open Popup    │                   │                   │
     │<────────────────│                   │                   │
     │                 │                   │                   │
     │ ─────────────────────────────────────────────────────> │
     │                      Authorization Request              │
     │                      (scope: openid email profile       │
     │                             User.Read)                  │
     │                   │                   │                   │
     │ <───────────────────────────────────────────────────── │
     │                      Redirect with code                 │
     │                   │                   │                   │
     │ oauth-callback.html                  │                   │
     │ postMessage(code)│                   │                   │
     │────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │ POST /auth/microsoft/callback         │
     │                 │ {code, redirect_uri}                  │
     │                 │──────────────────>│                   │
     │                 │                   │                   │
     │                 │                   │ Token Exchange    │
     │                 │                   │──────────────────>│
     │                 │                   │                   │
     │                 │                   │<──────────────────│
     │                 │                   │   access_token    │
     │                 │                   │                   │
     │                 │                   │ GET /v1.0/me      │
     │                 │                   │──────────────────>│
     │                 │                   │                   │
     │                 │                   │<──────────────────│
     │                 │                   │   User Profile    │
     │                 │                   │                   │
     │                 │                   │ Create/Find User  │
     │                 │                   │ Generate JWT      │
     │                 │                   │                   │
     │                 │<──────────────────│                   │
     │                 │   {token, user}   │                   │
     │                 │                   │                   │
     │ Store token     │                   │                   │
     │ Redirect /mode  │                   │                   │
     │<────────────────│                   │                   │
```

### Email/Password Flow
```
1. User submits email + password
2. Frontend calls POST /api/auth/signup or /api/auth/login
3. Worker validates input, checks rate limits
4. For signup: hash password with PBKDF2, create user in D1
5. For login: verify password with timing-safe comparison
6. Generate JWT with userId and email
7. Return {token, user} to frontend
8. Frontend stores token in localStorage
9. Axios interceptor adds Bearer token to all requests
```

---

## Security Measures

### Authentication Security
- **Password Hashing:** PBKDF2 with 100,000 iterations
- **Timing-Safe Comparison:** XOR-based comparison to prevent timing attacks
- **JWT Expiry:** 7 days with HS256 signing

### Rate Limiting
- **Login:** 5 attempts per minute per IP
- **Signup:** 3 attempts per hour per IP
- **Storage:** D1 database with cleanup of old entries

### CORS Policy
- **Allowed Origins:**
  - `https://arttherapy-plus.pages.dev`
  - `http://localhost:5173`
- **Rejected Origins:** Return null CORS headers (browser blocks)

---

## Environment Configuration

### Worker Environment Variables (wrangler.toml)
```toml
[vars]
MICROSOFT_CLIENT_ID = "1068db0a-2e86-4094-aa91-b55bca8ac09a"
MICROSOFT_TENANT_ID = "common"
R2_PUBLIC_URL = "https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev"
```

### Worker Secrets (wrangler secret put)
```
MICROSOFT_CLIENT_SECRET  # Azure App Registration secret
JWT_SECRET               # Random string for JWT signing
OPENAI_API_KEY           # OpenAI API key
```

### Frontend Environment (.env)
```
VITE_API_URL=https://arttherapy-plus-api.julienh15.workers.dev/api
VITE_MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a
```

---

## Deployment

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build
# Deploy via Cloudflare Pages dashboard or wrangler pages
```

### Backend (Cloudflare Workers)
```bash
cd cloudflare-worker
npx wrangler deploy
```

### Database Migrations
```bash
# Apply schema
npx wrangler d1 execute arttherapy-plus-db --remote --file=src/db/schema.sql

# Or run individual commands
npx wrangler d1 execute arttherapy-plus-db --remote --command "SQL HERE"
```

---

## External Service Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| OpenAI API | Image generation, prompts, reflection | Core features unavailable |
| Microsoft Entra | OAuth login | OAuth login unavailable (email/password still works) |
| Cloudflare D1 | User data, gallery | All authenticated features unavailable |
| Cloudflare R2 | Image storage | Images fallback to DALL-E URLs (expire in ~1 hour) |

---

## Future Considerations

### Phase 4: Data Persistence
- Gallery API endpoints (save, list, delete)
- Migrate from localStorage to D1
- Link images to user accounts

### Phase 5: New Features
- `/reflect` page with reflection questions
- `/inspire` page with inspirational prompts

### Phase 6: Polish
- Remove debug logging
- Add proper error boundaries
- Implement loading skeletons
- Create 404 page
