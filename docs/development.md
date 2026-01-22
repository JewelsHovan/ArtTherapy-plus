# Development Guide

## Prerequisites

- Node.js 20.x LTS
- npm
- Docker (for backend container builds)
- Azure CLI (for deployment)
- OpenAI API key

## Quick Start

```bash
# Clone and install
git clone <repo>
cd ArtTherapy-plus

# Start both frontend and backend
./scripts/start-dev.sh

# Or separately:
# Terminal 1 - Frontend
cd frontend && npm install && npm run dev

# Terminal 2 - Backend
cd azure-backend && npm install && npm run dev
```

## Development Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 8787 | http://localhost:8787 |

## Frontend Development

### Commands
```bash
cd frontend
npm run dev      # Development server with hot reload
npm run build    # Production build to dist/
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Environment Variables
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8787/api
VITE_MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a
```

### Component Development
Use the Component Showcase route for isolated testing:
```
http://localhost:5173/componentshowcase
```

### Tailwind Theme Colors
```javascript
primary: '#3B82F6'       // Blue-500 (main brand)
primary-hover: '#2563EB' // Blue-600
secondary: '#F59E0B'     // Amber-500 (accent)
secondary-hover: '#D97706' // Amber-600
```

### Adding New Pages
1. Create component in `src/pages/PageName.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/pagename" element={<PageName />} />
   ```
3. If protected, nest under `<ProtectedRoute />`

### Adding New Components
1. Create in appropriate directory:
   - `components/common/` - Reusable UI elements
   - `components/forms/` - Form inputs
   - `components/modals/` - Modal dialogs
   - `components/layout/` - Layout components
2. Export from component file
3. Add to Component Showcase for testing

## Backend Development

### Commands
```bash
cd azure-backend
npm run dev          # Local development with tsx watch
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled code
npm run lint         # ESLint check
# Note: drizzle-kit commands are in package.json but not actively used
# Database uses raw SQL via tedious driver instead
```

### Environment Variables
Create `azure-backend/.env`:
```
NODE_ENV=development
PORT=8787

# Database
DATABASE_URL=Server=localhost;Database=arttherapy;User Id=sa;Password=...;Encrypt=true;TrustServerCertificate=true;

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=arttherapyplus

# Auth
JWT_SECRET=your-development-secret-key
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# OpenAI
OPENAI_API_KEY=sk-...

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Adding New API Endpoints

1. Create handler in `src/handlers/`:
```typescript
// src/handlers/example.ts
import { Request, Response } from 'express';

export async function handleExample(req: Request, res: Response) {
  try {
    // Your logic here
    res.json({ success: true, data: 'result' });
  } catch (error) {
    console.error('Example error:', error);
    res.status(500).json({ error: 'Failed', code: 'ERROR_CODE' });
  }
}
```

2. Create route file in `src/routes/`:
```typescript
// src/routes/example.routes.ts
import { Router } from 'express';
import { handleExample } from '../handlers/example.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.post('/example', authMiddleware, handleExample);
export default router;
```

3. Register in `src/routes/index.ts`:
```typescript
import exampleRoutes from './example.routes.js';
router.use('/example', exampleRoutes);
```

### CORS Configuration
CORS is configured in `src/config/cors.ts`. Update allowed origins:
```typescript
const allowedOrigins = [
  'https://witty-glacier-01b4b7710.2.azurestaticapps.net',
  'http://localhost:5173'
];
```

## Testing

### Frontend Testing
```bash
# Lint check
npm run lint

# Build verification
npm run build

# Manual testing
npm run dev
# Test all routes, especially protected ones
```

### Backend Testing
```bash
# Local development
npm run dev

# Test endpoints with curl
curl http://localhost:8787/api/health

# Test with auth
curl -H "Authorization: Bearer <token>" http://localhost:8787/api/gallery
```

## Deployment

### Frontend (Azure Static Web Apps)
Automatic deployment via GitHub Actions on push to main.

Manual deployment:
```bash
./scripts/deploy-frontend.sh
```

### Backend (Azure Container Apps)
```bash
# Build container
./scripts/build-container.sh

# Deploy to Azure
./scripts/deploy-backend.sh
```

### Database Migrations
```bash
cd azure-backend

# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Or push schema directly (dev only)
npm run db:push
```

## Code Patterns

### API Integration (Frontend)
```jsx
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setIsLoading(true);
  setError('');
  try {
    const response = await painPlusAPI.someEndpoint();
    setData(response.data);
  } catch (err) {
    console.error('Load error:', err);
    setError('Failed to load. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Error Handling (Backend)
```typescript
try {
  // Operation
  res.json({ success: true, data });
} catch (error) {
  console.error('Operation error:', error);
  res.status(500).json({
    error: 'User-friendly message',
    code: 'ERROR_CODE'
  });
}
```

### Protected API Call (Frontend)
```javascript
// Token is automatically added by axios interceptor
const response = await painPlusAPI.gallery.getAll();
```

## Troubleshooting

### "CORS error in development"
- Ensure backend is running on port 8787
- Check `VITE_API_URL` points to local backend
- Verify origin is in allowed list in `cors.ts`

### "Database connection failed"
- Check DATABASE_URL format (SQL Server connection string)
- Verify database server is accessible
- Check firewall rules for Azure SQL

### "OpenAI rate limit"
- Check API key validity
- Monitor usage at platform.openai.com
- Implement retry with backoff

### "Build fails"
- Run `npm run lint` to check for errors
- Clear node_modules and reinstall
- Check Node.js version (requires 20.x)

### "Docker build fails"
- Ensure Dockerfile syntax is correct
- Check for missing dependencies in package.json
- Verify multi-stage build paths

## Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [Tedious (Azure SQL Driver)](https://tediousjs.github.io/tedious/)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
