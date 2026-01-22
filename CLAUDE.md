# ArtTherapy+

Art therapy web app for pain management through AI-powered creative expression.

## Quick Context
Full-stack SPA: React 19 frontend (Azure SWA) + Cloudflare Workers API (D1/R2). Uses OpenAI (DALL-E 3, GPT-4o-mini) for image generation and reflection. Microsoft OAuth (PKCE) + email/password auth.

## Tech Stack
Frontend: React 19, Vite 7, React Router 7, Tailwind CSS 3, Axios
Backend: Cloudflare Workers, D1 (SQLite), R2 (images), jose (JWT), OpenAI SDK

## Commands
| Task | Command |
|------|---------|
| Dev (both) | `./start.sh` |
| Frontend | `cd frontend && npm run dev` |
| Backend | `cd cloudflare-worker && npx wrangler dev` |
| Build | `cd frontend && npm run build` |
| Lint | `cd frontend && npm run lint` |
| Deploy API | `cd cloudflare-worker && npm run deploy` |
| D1 Query | `npx wrangler d1 execute arttherapy-plus-db --remote --command "SQL"` |

## Ports
Frontend: 5173 | Backend (wrangler): 8787

## Key Patterns

### Authentication
- Microsoft OAuth uses PKCE (frontend token exchange at `/oauth-callback.html`)
- JWT tokens stored in localStorage (`auth_token`), 7-day expiry
- AuthContext provides: `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`

### API Calls
- All calls via `painPlusAPI` object in `frontend/src/services/api.js`
- Bearer token auto-attached by axios interceptor
- 401 responses trigger redirect to `/register`

### Protected Routes
Wrap with `<ProtectedRoute />` in App.jsx, renders inside `<AppLayout />`

### Component Structure
- `components/common/` - Button, Logo, Skeleton, ErrorBoundary
- `components/forms/` - TextInput, PasswordInput
- `components/layout/` - AppLayout, Header
- `pages/` - Route components

## Theme Colors
Primary: `#3B82F6` (blue) | Secondary: `#F59E0B` (amber/orange)

## API Endpoints (Protected)
| Endpoint | Purpose |
|----------|---------|
| POST /api/generate/image | DALL-E 3 art from pain description |
| POST /api/edit/image | Vision analysis + style transfer |
| POST /api/reflect | GPT reflection questions |
| GET/POST /api/gallery | User artwork storage |
| GET/POST /api/journal | Reflection entries |
| GET/PUT /api/user/profile | Profile management |

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://arttherapy-plus-api.julienh15.workers.dev/api
VITE_MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a
```

### Backend Secrets (wrangler secret put)
```
OPENAI_API_KEY, JWT_SECRET, MICROSOFT_CLIENT_SECRET
```

## Critical Files
| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Routes, AuthProvider |
| `frontend/src/contexts/AuthContext.jsx` | Auth state |
| `frontend/src/services/api.js` | API client |
| `frontend/src/pages/Registration.jsx` | OAuth PKCE flow |
| `cloudflare-worker/src/index.js` | API router |
| `cloudflare-worker/src/handlers/auth.js` | Auth handlers |
| `cloudflare-worker/wrangler.toml` | D1/R2 config |

## Before Committing
1. `npm run lint` - No ESLint errors
2. `npm run build` - Build succeeds
3. Test auth flow (login/logout)
4. Check CORS if adding new origins

## Documentation
Index: `docs/KNOWLEDGE_BASE.md`
