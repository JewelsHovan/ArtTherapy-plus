# ArtTherapy+ Technical Stack Report

## Overview

ArtTherapy+ is a full-stack web application for art therapy focusing on pain management through creative expression. The application uses AI-powered image generation (DALL-E 3) and reflection tools (GPT-4o-mini) to help users explore and process their experiences with chronic pain.

**Architecture Summary:**
- **Frontend**: React 19 SPA hosted on Azure Static Web Apps
- **Backend**: Cloudflare Workers (JavaScript) with edge computing
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **AI Services**: OpenAI API (DALL-E 3, GPT-4o-mini)

---

## Frontend Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.x | Core UI library |
| react-dom | 19.x | React DOM rendering |
| react-router-dom | 7.x | Client-side routing and navigation |
| axios | latest | HTTP client for API communication |
| prop-types | latest | Runtime prop type validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vite | 7.x | Build tool and development server |
| @vitejs/plugin-react | latest | React Fast Refresh support |
| tailwindcss | 3.x | Utility-first CSS framework |
| postcss | latest | CSS processing pipeline |
| autoprefixer | latest | Automatic vendor prefixing |
| eslint | 9.x | Code linting (flat config) |

### Build Configuration

**Vite Settings:**
- Development server port: 5173
- Auto-open browser on start
- CORS enabled for development
- Direct API calls (no proxy configuration)

**Tailwind Theme:**
- Primary color palette: Blue (#3B82F6)
- Secondary color palette: Amber/Orange (#F59E0B)
- Custom semantic colors for UI states
- Custom shadows and border-radius tokens
- Font family: Inter

### NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | `vite` | Start development server |
| build | `vite build` | Create production build |
| lint | `eslint .` | Run ESLint checks |
| preview | `vite preview` | Preview production build locally |

---

## Backend Stack

### Runtime Environment

The backend runs as a **Cloudflare Worker** (JavaScript), providing edge computing capabilities with global distribution and low latency.

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| openai | ^4.58.0 | OpenAI SDK for DALL-E 3 and GPT models |
| jose | ^6.1.0 | JWT creation and verification (HS256) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| wrangler | ^4.29.0 | Cloudflare Workers CLI for local dev and deployment |

### API Endpoints

**Public Endpoints (No Authentication Required):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/health | GET | Health check and status |
| /api/auth/signup | POST | User registration |
| /api/auth/login | POST | User authentication |
| /api/auth/microsoft/callback | POST | Microsoft OAuth callback |
| /api/auth/verify | GET | Token verification |
| /api/auth/logout | POST | Session termination |

**Protected Endpoints (JWT Required):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/generate/image | POST | Generate art from pain descriptions |
| /api/generate/prompt | POST | Generate creative writing prompts |
| /api/reflect | POST | Generate reflection questions |
| /api/inspire | GET | Get inspirational prompts |
| /api/edit/image | POST | Transform/edit existing images |
| /api/gallery | GET/POST | User gallery management |
| /api/journal | GET/POST | Journal entry management |
| /api/user/profile | GET/PUT | User profile management |

### Authentication Architecture

- **Token Type**: JWT with HS256 signature
- **Token Expiry**: 24 hours
- **Password Hashing**: PBKDF2
- **Rate Limiting**:
  - Signup: 3 requests per hour per IP
  - Login: 5 requests per minute per IP

---

## Third-Party APIs

### OpenAI Integration

| Model | Use Case | Configuration |
|-------|----------|---------------|
| DALL-E 3 | Image generation | 1024x1024, standard quality |
| GPT-4o-mini | Creative prompts | Text generation for therapy prompts |
| GPT-4o-mini | Reflection questions | Generate introspective questions |
| GPT-4o-mini | Inspiration | Generate inspirational content |
| GPT-4o-mini (vision) | Style analysis | Analyze images for style transformation |

### Microsoft OAuth

- **Client ID**: 1068db0a-2e86-4094-aa91-b55bca8ac09a
- **Tenant ID**: common (multi-tenant)
- **Flow**: PKCE (Proof Key for Code Exchange) for SPA security

---

## Hosting Architecture

### Infrastructure Diagram

```
+---------------------------+       +----------------------------------+
|     Azure Static Web      |       |      Cloudflare Workers          |
|         Apps (SWA)        |       |           (Edge API)             |
|                           |       |                                  |
|  witty-glacier-01b4b7710  |  -->  |  arttherapy-plus-api            |
|  .2.azurestaticapps.net   |       |  .julienh15.workers.dev/api     |
|                           |       |                                  |
|  - React 19 SPA           |       |  - JWT Authentication           |
|  - Vite build output      |       |  - Rate Limiting                |
|  - SPA fallback routing   |       |  - CORS Handling                |
+---------------------------+       +----------------------------------+
                                                   |
                                                   v
                            +------------------------------------------+
                            |           Cloudflare Services            |
                            |                                          |
                            |  +----------------+  +----------------+  |
                            |  |      D1        |  |       R2       |  |
                            |  |   (Database)   |  |   (Storage)    |  |
                            |  |                |  |                |  |
                            |  | arttherapy-    |  | arttherapy-    |  |
                            |  | plus-db        |  | plus-images    |  |
                            |  | (SQLite@Edge)  |  | (Object Store) |  |
                            |  +----------------+  +----------------+  |
                            +------------------------------------------+
                                                   |
                                                   v
                            +------------------------------------------+
                            |              OpenAI API                  |
                            |                                          |
                            |  - DALL-E 3 (Image Generation)          |
                            |  - GPT-4o-mini (Text Generation)        |
                            +------------------------------------------+
```

### Frontend Hosting: Azure Static Web Apps

| Property | Value |
|----------|-------|
| App Name | witty-glacier-01b4b7710 |
| URL | https://witty-glacier-01b4b7710.2.azurestaticapps.net |
| Build Output | dist (Vite production build) |
| Routing | SPA fallback to /index.html |

### Backend Hosting: Cloudflare Workers

| Property | Value |
|----------|-------|
| Worker Name | arttherapy-plus-api |
| URL | https://arttherapy-plus-api.julienh15.workers.dev/api |
| Database | arttherapy-plus-db (D1 SQLite at edge) |
| Object Storage | arttherapy-plus-images (R2) |
| Public R2 URL | https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev |

### CORS Configuration

The following origins are whitelisted for cross-origin requests:

| Origin | Environment |
|--------|-------------|
| https://witty-glacier-01b4b7710.2.azurestaticapps.net | Production (Azure SWA) |
| https://arttherapy-plus.pages.dev | Production (Cloudflare Pages) |
| http://localhost:5173 | Local Development |

---

## CI/CD Pipeline

### GitHub Actions Workflows

**Frontend Deployment (Azure Static Web Apps):**
- **Trigger**: Push to main branch
- **Action**: Azure/static-web-apps-deploy
- **Build**: Vite production build
- **Output**: Deployed to Azure SWA

**Backend Deployment (Cloudflare Workers):**
- **Trigger**: Push to main branch (changes in `cloudflare-worker/**`)
- **Action**: cloudflare/wrangler-action
- **Deploy**: Publishes worker to Cloudflare edge network

### Deployment Flow

```
Push to main
     |
     +---> Frontend changes? ---> Azure SWA Deploy
     |
     +---> Backend changes? ---> Cloudflare Worker Deploy
```

---

## Local Development

### Prerequisites

- Node.js (LTS version recommended)
- npm
- Cloudflare account (for wrangler)
- OpenAI API key

### Running the Application

**Quick Start (Both Services):**
```bash
./start.sh
```

**Frontend Only:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend Only:**
```bash
cd cloudflare-worker
npm install
wrangler dev
# Runs on http://localhost:8787
```

### Development Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Wrangler) | 8787 | http://localhost:8787 |

---

## Environment Variables

### Backend Secrets (Cloudflare Worker)

These must be configured as Cloudflare Worker secrets:

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | OpenAI API authentication key | Yes |
| JWT_SECRET | Secret for signing JWT tokens | Yes |
| MICROSOFT_CLIENT_SECRET | Microsoft OAuth client secret | Yes |

### Backend Public Variables

These are configured in wrangler.toml:

| Variable | Value | Description |
|----------|-------|-------------|
| MICROSOFT_CLIENT_ID | 1068db0a-2e86-4094-aa91-b55bca8ac09a | Microsoft OAuth app ID |
| MICROSOFT_TENANT_ID | common | Multi-tenant configuration |
| R2_PUBLIC_URL | https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev | Public R2 bucket URL |

### Frontend Environment

The frontend uses environment variables prefixed with `VITE_` for client-side configuration:

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL (production) |

---

## Security Considerations

1. **API Keys**: Never commit API keys or secrets to version control
2. **JWT Tokens**: Stored client-side, transmitted via Authorization header
3. **CORS**: Strict origin validation prevents unauthorized cross-origin requests
4. **Rate Limiting**: Protects authentication endpoints from brute force attacks
5. **PKCE**: OAuth flow uses PKCE for secure token exchange in SPA context
6. **Password Storage**: PBKDF2 hashing ensures passwords are never stored in plain text

---

## Version History

| Date | Change |
|------|--------|
| 2024 | Initial release with Flask backend |
| 2024 | Migration to Cloudflare Workers |
| 2024 | Addition of Microsoft OAuth (PKCE flow) |
| 2024 | R2 storage integration for image persistence |
