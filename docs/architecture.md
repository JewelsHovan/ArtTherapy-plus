# Architecture

## System Overview

```
Frontend (React 19 + Vite)          Backend (Express.js + TypeScript)
        |                                       |
        v                                       v
Azure Static Web Apps              Azure Container Apps (Docker)
                                               |
                              +----------------+----------------+
                              |                |                |
                              v                v                v
                       Azure SQL Server   Azure Blob    OpenAI API +
                                          Storage       Microsoft OAuth
```

## Frontend Architecture

### Technology Stack
- React 19 with Vite 7.x build tool
- React Router v7 for client-side routing
- Tailwind CSS 3.x with custom theme
- Axios for HTTP with request/response interceptors
- react-hot-toast for notifications

### Project Structure
```
frontend/
  src/
    components/
      auth/           # ProtectedRoute
      common/         # Button, Logo, Skeleton, ErrorBoundary, LoadingButton,
                      # ConfirmDialog, EmptyState, ErrorMessage, PageHeader
      forms/          # TextInput, PasswordInput
      layout/         # AppLayout, Header
      modals/         # ImageModal, OnboardingModal
    contexts/         # AuthContext (user state, token management)
    pages/            # Route-level components
      archived/       # Deprecated pages (About.jsx)
    services/         # api.js (painPlusAPI client)
    utils/            # imageCompression, storage
    styles/           # CSS files
  public/
    assets/           # Static assets, logo variants
    oauth-callback.html  # Microsoft OAuth callback handler
```

### Route Structure
| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| / | Welcome | Public | Landing page |
| /register | Registration | Public | Sign up/login form |
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
| /componentshowcase | ComponentShowcase | Protected | Dev: Component testing |
| * | NotFound | Public | 404 page |

### State Management
- AuthContext: User authentication state (user, token, isAuthenticated, isLoading)
- Component-level state: React useState for local UI state
- localStorage: JWT token persistence (`auth_token`)
- sessionStorage: OAuth PKCE code verifier, redirect paths

## Backend Architecture (Azure Container Apps)

### Technology Stack
- Express.js 4.x with TypeScript
- Raw SQL queries via tedious driver
- Azure SQL Server (tedious driver)
- Azure Blob Storage (@azure/storage-blob)
- OpenAI SDK 4.x for AI integration
- jose 5.x for JWT handling
- express-rate-limit for brute force protection
- helmet for security headers

### Project Structure
```
azure-backend/
  src/
    index.ts          # Express server, middleware setup
    config/
      index.ts        # Environment configuration
      cors.ts         # CORS middleware with origin validation
    handlers/
      auth.ts         # Microsoft OAuth, email/password auth
      gallery.ts      # Save/fetch/delete gallery items
      generate.ts     # DALL-E 3 image generation, GPT prompts
      journal.ts      # Journal entry CRUD
      user.ts         # Profile management
    middleware/
      auth.ts         # JWT verification
      errorHandler.ts # Global error handling
      rateLimit.ts    # Rate limiting configuration
    routes/
      index.ts        # Route aggregator
      auth.routes.ts  # /api/auth/* endpoints
      gallery.routes.ts
      generate.routes.ts
      journal.routes.ts
      user.routes.ts
    services/
      openai.ts       # OpenAI API integration
      storage.ts      # Azure Blob Storage operations
    utils/
      jwt.ts          # Token generation/verification
      password.ts     # PBKDF2 hashing
    db/
      index.ts        # Database connection pool
      schema.ts       # TypeScript type definitions
  Dockerfile          # Multi-stage build for production
  tsconfig.json       # TypeScript configuration
```

### Database Schema (Azure SQL Server)
```sql
users (
  id VARCHAR(36) PRIMARY KEY,
  microsoft_id VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  password_hash VARCHAR(255),
  password_salt VARCHAR(255),
  auth_provider VARCHAR(20) DEFAULT 'email',
  -- Profile fields
  age INT,
  sex VARCHAR(50),
  gender VARCHAR(50),
  symptoms TEXT,           -- JSON array
  location VARCHAR(255),
  languages TEXT,          -- JSON array
  occupation VARCHAR(255),
  relationship_status VARCHAR(50),
  prescriptions TEXT,      -- JSON array
  activity_level VARCHAR(50),
  settings TEXT,           -- JSON object
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
)

gallery_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) FOREIGN KEY REFERENCES users(id),
  image_url TEXT NOT NULL,
  description TEXT,
  prompt_used TEXT,
  mode VARCHAR(50),        -- 'create' or 'edit'
  created_at DATETIME2 DEFAULT GETDATE()
)

journal_entries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) FOREIGN KEY REFERENCES users(id),
  gallery_item_id VARCHAR(36) FOREIGN KEY REFERENCES gallery_items(id),
  reflection_questions TEXT,  -- JSON array
  responses TEXT,             -- JSON array
  notes TEXT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
)
```

### Azure Blob Storage Structure
```
arttherapyplus/
  generated/{user_id}/{timestamp}-{uuid}.png
  edited/{user_id}/{timestamp}-{uuid}.png
```

## API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Email/password registration (3/hour rate limit) |
| POST | /api/auth/login | Email/password login (5/min rate limit) |
| POST | /api/auth/microsoft/callback | Exchange access_token for JWT |
| POST | /api/auth/verify | Verify JWT, return user data |
| POST | /api/auth/logout | Client-side logout stub |
| GET | /api/health | Health check endpoint |

### AI Generation (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/generate/image | DALL-E 3 art from pain description |
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
- General API: 100 requests/minute
- Stored in memory (express-rate-limit)

### CORS
Allowed origins:
- `https://witty-glacier-01b4b7710.2.azurestaticapps.net` (production)
- `http://localhost:5173` (development)

### Security Headers (Helmet)
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

## Deployment Architecture

### Frontend (Azure Static Web Apps)
- Automatic deployment via GitHub Actions on push to main
- Path filter: `frontend/**`
- Build: `npm run build` -> `dist/`
- Environment variables injected at build time

### Backend (Azure Container Apps)
- Docker multi-stage build
- Automatic deployment via GitHub Actions on push to main
- Path filter: `azure-backend/**`
- Azure Container Registry for image storage
- Environment variables via Azure secrets

### Infrastructure
- Resource Group: Contains all Azure resources
- Azure Container Registry: Docker image storage
- Azure Container Apps Environment: Serverless container hosting
- Azure SQL Server: Managed SQL database
- Azure Storage Account: Blob storage for images
