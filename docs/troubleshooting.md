# Troubleshooting Guide

## Common Issues

### Authentication

#### "Popup was blocked"
- Enable popups for the site in browser settings
- Ensure popup is triggered by user action (click event)
- Some browsers block popups opened from async code

#### "Token exchange failed"
- Verify PKCE code_verifier matches code_challenge
- Check redirect_uri matches Azure app registration exactly
- Ensure client_id is correct
- Clear sessionStorage and try again

#### "Invalid or expired token"
- Token has 7-day expiry
- User will be redirected to /register
- Previous location saved in sessionStorage for redirect after login

#### "This email uses Microsoft sign-in"
- User registered with Microsoft OAuth but trying email/password login
- Direct them to use Microsoft sign-in button
- Cannot mix auth providers for same email

#### 401 on API calls
- Check if token exists in localStorage (`auth_token`)
- Verify token hasn't expired (7 days)
- Check network tab for actual error response
- Try logging out and back in

### CORS Issues

#### "CORS error" in browser console
**Development:**
- Ensure backend is running on port 8787
- Check `VITE_API_URL` points to `http://localhost:8787/api`
- Verify `http://localhost:5173` is in CORS allowed origins

**Production:**
- Check frontend URL is in backend's allowed origins
- Verify no trailing slashes in URLs
- Check Azure Container App CORS settings

#### Preflight (OPTIONS) request fails
- Backend must handle OPTIONS requests
- Check CORS middleware is applied before routes
- Verify allowed methods include the one you're using

### Database

#### "Database connection failed"
- Check DATABASE_URL format (SQL Server connection string)
- Verify database server is accessible
- Check firewall rules allow your IP/Azure services
- Test connection with Azure Data Studio or similar tool

#### "Query timeout"
- Check Azure SQL tier (Basic may be too slow)
- Look for missing indexes
- Optimize query or add pagination

#### "Deadlock detected"
- Check for concurrent writes to same rows
- Add proper transaction handling
- Consider retry logic for transient errors

### OpenAI API

#### "Rate limit exceeded"
- Check API key usage at platform.openai.com
- Implement exponential backoff retry
- Consider caching responses where appropriate

#### "Invalid API key"
- Verify OPENAI_API_KEY environment variable is set
- Check key hasn't been rotated/revoked
- Ensure no leading/trailing whitespace

#### "Image generation failed"
- Check DALL-E quota/limits
- Verify prompt doesn't violate content policy
- Check image size (must be 1024x1024, 512x512, or 256x256)

### Build Issues

#### Frontend build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for lint errors
npm run lint

# Verify Node version
node --version  # Should be 20.x
```

#### Backend build fails
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json dist
npm install

# Check TypeScript errors
npm run build

# Verify Node version
node --version  # Should be 20.x
```

#### Docker build fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check multi-stage build paths are correct
- Test build locally first: `docker build -t test .`

### Deployment Issues

#### GitHub Actions fails
- Check workflow logs in Actions tab
- Verify all secrets are set correctly
- Check path filters match changed files
- Try running commands locally first

#### Container won't start
- Check container logs in Azure Portal
- Verify environment variables are set
- Check PORT matches container config (8787)
- Verify health endpoint responds

#### Health check fails after deployment
- Wait 30-60 seconds for container to start
- Check /api/health endpoint manually
- Verify database connection from container
- Check CORS allows health check origin

### Frontend Runtime

#### Page stuck on loading
- Check browser console for errors
- Verify API URL is correct
- Check if user is authenticated (AuthContext)
- Try hard refresh (Ctrl+Shift+R)

#### Images not loading
- Check image URLs in network tab
- Verify Azure Blob Storage is accessible
- Check CORS on storage account
- Verify image exists in container

#### Toast notifications not showing
- Check Toaster component is in App.jsx
- Verify react-hot-toast is imported
- Check z-index isn't overlapped

### Backend Runtime

#### Request timeout
- Check handler isn't blocking
- Look for infinite loops
- Check external API calls (OpenAI, Microsoft)
- Verify database queries are optimized

#### Memory issues
- Check for memory leaks in handlers
- Verify streams are properly closed
- Monitor container memory usage
- Consider increasing container resources

## Debugging Tips

### Frontend
```javascript
// Add to api.js for request logging
api.interceptors.request.use(config => {
  console.log('Request:', config.method, config.url);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);
```

### Backend
```typescript
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers.authorization ? 'Bearer [token]' : 'none'
  });
  next();
});
```

### Database
```bash
# View query logs
# Set DEBUG=tedious* environment variable

# Database uses raw SQL via tedious driver
# Check connection in azure-backend/src/db/index.ts
```

## Getting Help

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Check Azure service health status
4. Review recent deployment logs
5. Ask in team chat with:
   - Error message
   - Steps to reproduce
   - Environment (local/production)
   - Recent changes made
