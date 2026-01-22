# ArtTherapy+ Knowledge Base

Quick index to project documentation. For daily essentials, see `CLAUDE.md` in project root.

## Architecture
Full-stack art therapy app: React 19 frontend on Azure SWA, Cloudflare Workers API with D1/R2 storage, OpenAI integration (DALL-E 3, GPT-4o-mini).
--> `docs/architecture.md`

## Authentication
Microsoft OAuth 2.0 with PKCE flow for SPA security, plus email/password auth. JWT tokens (7-day expiry), PBKDF2 password hashing.
--> `docs/authentication.md`

## Development
Local setup with Vite (port 5173) and Wrangler (port 8787). Commands, environment variables, code patterns.
--> `docs/development.md`

## API Reference
Complete endpoint documentation: auth, image generation, gallery, journal, user profile. Request/response schemas.
--> `docs/api-reference.md`

## Database Schema
D1 SQLite tables: users (auth + profile), gallery_items, journal_entries, rate_limits. JSON columns for arrays.
--> `cloudflare-worker/src/db/schema.sql`

## Implementation Plans
Detailed UX redesign roadmap: 4 phases, task breakdowns, code patterns, testing checklists.
--> `working-docs/implementation-plan.md`

## UI/UX Analysis
User flow analysis, feature inventory, pain points, component audit.
--> `working-docs/ux-pain-points.md`
--> `working-docs/ui-components-audit.md`

## Deployment
Frontend: Azure SWA (GitHub Actions auto-deploy)
Backend: Cloudflare Workers (`npx wrangler deploy`)
--> `docs/cloudflare-deployment.md`

## Key File Locations

### Frontend (React)
| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Route definitions, AuthProvider wrapper |
| `frontend/src/contexts/AuthContext.jsx` | User state, token management |
| `frontend/src/services/api.js` | painPlusAPI client, interceptors |
| `frontend/src/pages/Registration.jsx` | OAuth PKCE flow, email/password forms |
| `frontend/tailwind.config.js` | Theme colors, typography |

### Backend (Cloudflare Workers)
| File | Purpose |
|------|---------|
| `cloudflare-worker/src/index.js` | Main router, endpoint dispatch |
| `cloudflare-worker/src/handlers/auth.js` | OAuth callback, login/signup |
| `cloudflare-worker/src/handlers/gallery.js` | Gallery CRUD |
| `cloudflare-worker/src/handlers/user.js` | Profile management |
| `cloudflare-worker/wrangler.toml` | D1/R2 bindings, env vars |

## External Resources
- Figma Design: `https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe`
- Microsoft Entra App: `https://portal.azure.com` (App registrations)
- Cloudflare Dashboard: `https://dash.cloudflare.com` (Workers, D1, R2)
- OpenAI Platform: `https://platform.openai.com` (API keys, usage)
