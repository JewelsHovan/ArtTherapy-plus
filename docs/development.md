# Development Guide

## Prerequisites

- Node.js LTS (18.x or 20.x)
- npm
- Cloudflare account (for wrangler CLI)
- OpenAI API key

## Quick Start

```bash
# Clone and install
git clone <repo>
cd ArtTherapy-plus

# Start both frontend and backend
./start.sh

# Or separately:
# Terminal 1 - Frontend
cd frontend && npm install && npm run dev

# Terminal 2 - Backend
cd cloudflare-worker && npm install && npx wrangler dev
```

## Development Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Wrangler) | 8787 | http://localhost:8787 |

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

For production, the API URL is set in the code:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arttherapy-plus-api.julienh15.workers.dev/api';
```

### Component Development

Use the Component Showcase route for isolated testing:
```
http://localhost:5173/componentshowcase
```

### Tailwind Theme Colors
```javascript
primary: '#3B82F6'      // Blue-500 (main brand)
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
cd cloudflare-worker
npm run dev     # Local development with wrangler
npm run deploy  # Deploy to Cloudflare
npm run tail    # View live logs
```

### Secrets Configuration
Set secrets using wrangler CLI:
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put MICROSOFT_CLIENT_SECRET
```

### Local D1 Database
Wrangler creates a local SQLite database for development. To initialize schema:
```bash
npx wrangler d1 execute arttherapy-plus-db --local --file=src/db/schema.sql
```

### Remote D1 Database
For production database operations:
```bash
# Execute schema
npx wrangler d1 execute arttherapy-plus-db --remote --file=src/db/schema.sql

# Run SQL command
npx wrangler d1 execute arttherapy-plus-db --remote --command "SELECT * FROM users LIMIT 5"
```

### Adding New API Endpoints

1. Create handler in `src/handlers/`:
```javascript
// src/handlers/example.js
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleExample(request, env, user, origin) {
  try {
    // Your logic here
    return jsonResponse({ data: 'result' }, 200, {}, origin);
  } catch (error) {
    console.error('Example error:', error);
    return errorResponse('Failed', 'ERROR_CODE', 500, origin);
  }
}
```

2. Add route in `src/index.js`:
```javascript
import { handleExample } from './handlers/example.js';

// In fetch handler, add to protected paths if needed:
const protectedPaths = [..., '/api/example'];

// Add route:
if (path === '/api/example' && request.method === 'POST') {
  return await handleExample(request, env, authenticatedUser, origin);
}
```

### CORS Configuration
CORS headers are managed in `utils/response.js`. Allowed origins:
```javascript
const allowedOrigins = [
  'https://arttherapy-plus.pages.dev',
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

### CORS Testing
Use included `test-cors.html` file:
```bash
# Open in browser and check console for CORS errors
open test-cors.html
```

## Deployment

### Frontend (Azure Static Web Apps)
Automatic deployment via GitHub Actions on push to main.

Manual deployment:
```bash
cd frontend
npm run build
# Upload dist/ to Azure SWA
```

### Backend (Cloudflare Workers)
```bash
cd cloudflare-worker
npm run deploy
```

### Database Migrations
```bash
# Always backup first
npx wrangler d1 execute arttherapy-plus-db --remote --command "SELECT * FROM users" > backup.json

# Apply migration
npx wrangler d1 execute arttherapy-plus-db --remote --file=migrations/001_new_feature.sql
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
```javascript
try {
  // Operation
  return jsonResponse({ success: true, data }, 200, {}, origin);
} catch (error) {
  console.error('Operation error:', error);
  return errorResponse('User-friendly message', 'ERROR_CODE', 500, origin);
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
- Verify origin is in allowed list

### "D1 database not found"
- Run schema initialization: `npx wrangler d1 execute ... --local --file=src/db/schema.sql`
- Check database binding in wrangler.toml

### "OpenAI rate limit"
- Check API key validity
- Monitor usage at platform.openai.com
- Implement retry with backoff (see `withRetry` in api.js)

### "Build fails"
- Run `npm run lint` to check for errors
- Clear node_modules and reinstall
- Check Node.js version compatibility

## Useful Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
