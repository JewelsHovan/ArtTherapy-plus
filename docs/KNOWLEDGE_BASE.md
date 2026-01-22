# ArtTherapy+ Knowledge Base

Quick index to detailed documentation. For daily essentials, see `CLAUDE.md` in project root.

## Architecture
React 19 SPA + Express.js/TypeScript API on Azure. Azure SQL Server, Blob Storage, OpenAI integration.
-> `docs/architecture.md`

## Authentication
Microsoft OAuth 2.0 (PKCE) + email/password. JWT tokens (7-day expiry, configurable via `JWT_TTL_DAYS`), PBKDF2 password hashing.
-> `docs/authentication.md`

## Development
Local setup with Vite (5173) and Express (8787). Commands, environment variables, patterns.
-> `docs/development.md`

## API Reference
All endpoints: auth, image generation, gallery, journal, user profile. Request/response schemas.
-> `docs/api-reference.md`

## Deployment
Frontend: Azure Static Web Apps (GitHub Actions). Backend: Azure Container Apps (Docker).
-> `docs/deployment.md`

## Troubleshooting
Common errors, CORS issues, database connectivity, debugging tips.
-> `docs/troubleshooting.md`

## Database Schema
Azure SQL Server: users, gallery_items, journal_entries tables. Raw SQL via tedious.
-> `azure-backend/src/db/schema.ts`

## Frontend Structure

| Directory | Contents |
|-----------|----------|
| `frontend/src/pages/` | Route components (Welcome, Registration, ModeSelection, etc.) |
| `frontend/src/components/` | Reusable UI (common, forms, layout, modals) |
| `frontend/src/contexts/` | AuthContext (user state, token management) |
| `frontend/src/services/` | API client (painPlusAPI) |
| `frontend/src/utils/` | imageCompression, storage helpers |

## Backend Structure

| Directory | Contents |
|-----------|----------|
| `azure-backend/src/routes/` | Express route definitions |
| `azure-backend/src/handlers/` | Business logic (auth, gallery, generate, journal, user) |
| `azure-backend/src/middleware/` | Auth verification, error handling, rate limiting |
| `azure-backend/src/services/` | OpenAI, Azure Storage integrations |
| `azure-backend/src/db/` | Database connection pool, TypeScript types |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/start-dev.sh` | Start both frontend and backend |
| `scripts/build-container.sh` | Build Docker image for API |
| `scripts/deploy-backend.sh` | Deploy to Azure Container Apps |
| `scripts/deploy-frontend.sh` | Deploy to Azure Static Web Apps |

## CI/CD Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `azure-static-web-apps-*.yml` | Push to main (frontend/*) | Build + deploy frontend to Azure SWA |
| `deploy-azure.yml` | Push to main (azure-backend/*) | Build + deploy API to Azure Container Apps |

## External Resources
- Figma: `https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe`
- Azure Portal: Container Apps, Static Web Apps, SQL Server, Storage
- OpenAI Platform: API keys, usage monitoring
