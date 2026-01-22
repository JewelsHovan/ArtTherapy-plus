# ArtTherapy+

Art therapy web app for pain management through AI-powered creative expression.

## Agent System
Global agents: ~/.claude/CLAUDE.md
Orchestrator-first routing

---

## Quick Context
React 19 SPA (Azure SWA) + Express.js/TypeScript API (Azure Container Apps). Azure SQL Server, Blob Storage, OpenAI (DALL-E 3, GPT-4o-mini). Microsoft OAuth (PKCE) + email/password auth.

## Tech Stack
Frontend: React 19, Vite 7, React Router 7, Tailwind CSS 3, Axios, react-hot-toast
Backend: Express.js, TypeScript, Drizzle ORM, Azure SQL Server, Azure Blob Storage, jose (JWT), OpenAI SDK

## Commands
| Task | Command |
|------|---------|
| Dev (both) | `./scripts/start-dev.sh` |
| Frontend | `cd frontend && npm run dev` |
| Backend | `cd azure-backend && npm run dev` |
| Build FE | `cd frontend && npm run build` |
| Lint | `cd frontend && npm run lint` |
| Build Container | `./scripts/build-container.sh` |
| Deploy API | `./scripts/deploy-backend.sh` |
| Deploy FE | `./scripts/deploy-frontend.sh` |

## Ports
Frontend: 5173 | Backend: 8787

## Key Patterns

### Authentication
- Microsoft OAuth PKCE (frontend token exchange at `/oauth-callback.html`)
- JWT tokens in localStorage (`auth_token`), 7-day expiry
- AuthContext: `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`

### API Calls
- All calls via `painPlusAPI` in `frontend/src/services/api.js`
- Bearer token auto-attached by axios interceptor
- 401 responses redirect to `/register`

### Protected Routes
Wrap with `<ProtectedRoute />` in App.jsx, renders inside `<AppLayout />`

### Component Structure
- `components/common/` - Button, Logo, Skeleton, ErrorBoundary, LoadingButton, ConfirmDialog, EmptyState, ErrorMessage, PageHeader
- `components/forms/` - TextInput, PasswordInput
- `components/layout/` - AppLayout, Header
- `components/modals/` - ImageModal, OnboardingModal
- `pages/` - Route components

## Theme Colors
Primary: `#3B82F6` (blue) | Secondary: `#F59E0B` (amber)

## Routes
| Route | Component | Auth |
|-------|-----------|------|
| `/` | Welcome | Public |
| `/register` | Registration | Public |
| `/mode` | ModeSelection | Protected |
| `/describe` | PainDescription | Protected |
| `/visualize` | Visualize | Protected |
| `/edit` | Edit | Protected |
| `/gallery` | Gallery | Protected |
| `/inspire` | Inspire | Protected |
| `/reflect` | Reflect | Protected |
| `/journal` | Journal | Protected |
| `/profile` | Profile | Protected |
| `/settings` | Settings | Protected |

## Environment Variables
Frontend: `VITE_API_URL`, `VITE_MICROSOFT_CLIENT_ID`
Backend: `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `OPENAI_API_KEY`, `JWT_SECRET`, `MICROSOFT_CLIENT_SECRET`

## Critical Files
| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Routes, AuthProvider, Toaster |
| `frontend/src/contexts/AuthContext.jsx` | Auth state |
| `frontend/src/services/api.js` | API client |
| `azure-backend/src/index.ts` | Express server |
| `azure-backend/src/routes/` | API route handlers |
| `azure-backend/Dockerfile` | Container config |

## Before Committing
1. `npm run lint` - No ESLint errors
2. `npm run build` - Build succeeds
3. Test auth flow (login/logout)

## Documentation
Index: `docs/KNOWLEDGE_BASE.md`
