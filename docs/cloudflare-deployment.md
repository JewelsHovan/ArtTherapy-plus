# Cloudflare Deployment Guide

This guide explains how to deploy the Art Therapy Plus application to Cloudflare using Workers (backend) and Pages (frontend).

## Prerequisites

1. Cloudflare account
2. Node.js 18+ installed
3. Wrangler CLI installed (`npm install -g wrangler`)

## Architecture Overview

- **Backend**: Cloudflare Workers (serverless JavaScript)
- **Frontend**: Cloudflare Pages (static site hosting)
- **API**: OpenAI integration for DALL-E 3 and GPT-4

## Backend Deployment (Cloudflare Workers)

### Setup

1. Navigate to the worker directory:
```bash
cd cloudflare-worker
```

2. Install dependencies:
```bash
npm install
```

3. Login to Cloudflare:
```bash
wrangler login
```

4. Add your OpenAI API key as a secret:
```bash
wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

### Local Development

Run the worker locally:
```bash
npm run dev
# Worker will be available at http://localhost:8787
```

### Deploy to Production

```bash
npm run deploy
# Your worker will be deployed to https://arttherapy-plus-api.{your-subdomain}.workers.dev
```

### Monitor Logs

```bash
npm run tail
```

## Frontend Deployment (Cloudflare Pages)

### Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Update the API endpoint in `src/services/api.js`:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://arttherapy-plus-api.{your-subdomain}.workers.dev'
  : 'http://localhost:8787';
```

3. Build the frontend:
```bash
npm run build
```

### Deploy to Cloudflare Pages

#### Option 1: Direct CLI Deployment

```bash
npx wrangler pages deploy dist --project-name=arttherapy-plus
```

#### Option 2: Git Integration (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Create a new project and connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

### Environment Variables

Set these in Cloudflare Pages dashboard:
- `NODE_ENV`: `production`
- `VITE_API_URL`: Your Worker URL

## CORS Configuration

The Worker is configured to accept requests from:
- `https://arttherapy-plus.pages.dev`
- `http://localhost:5173` (for local development)

Update the `corsHeaders` in `cloudflare-worker/src/index.js` if using a custom domain.

## Custom Domain Setup

### For Pages (Frontend)
1. Go to your Pages project settings
2. Navigate to Custom domains
3. Add your domain and follow DNS configuration

### For Workers (Backend)
1. Go to your Worker settings
2. Add a custom route or domain
3. Update CORS headers accordingly

## Deployment Workflow

### Development
```bash
# Terminal 1 - Backend
cd cloudflare-worker
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Deployment
```bash
# Deploy backend
cd cloudflare-worker
npm run deploy

# Deploy frontend
cd frontend
npm run build
npx wrangler pages deploy dist
```

## Monitoring & Debugging

### Workers Analytics
- View in Cloudflare Dashboard > Workers & Pages > Your Worker > Analytics

### Pages Analytics
- View in Cloudflare Dashboard > Pages > Your Project > Analytics

### Real-time Logs
```bash
# Worker logs
cd cloudflare-worker
wrangler tail

# Pages functions logs (if using)
wrangler pages deployment tail
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your frontend URL is in the Worker's CORS configuration
   - Check that OPTIONS requests are handled properly

2. **API Key Issues**
   - Verify the OPENAI_API_KEY secret is set correctly
   - Use `wrangler secret list` to check existing secrets

3. **Build Failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall dependencies

4. **404 Errors on Routes**
   - For SPAs, ensure Pages is configured for single-page applications
   - Add `_redirects` file in public folder:
   ```
   /*    /index.html   200
   ```

## Cost Considerations

- **Workers**: Free tier includes 100,000 requests/day
- **Pages**: Unlimited sites, 500 builds/month on free tier
- **OpenAI API**: Charged per API call (check OpenAI pricing)

## Security Best Practices

1. Never commit API keys to version control
2. Use Wrangler secrets for sensitive data
3. Implement rate limiting if needed
4. Monitor usage to prevent abuse
5. Use environment-specific API endpoints

## Next Steps

1. Set up CI/CD with GitHub Actions
2. Implement error tracking (e.g., Sentry)
3. Add performance monitoring
4. Configure custom domains
5. Set up staging environment