# Deployment Guide

## Overview

ArtTherapy+ uses Azure services for production deployment:
- **Frontend**: Azure Static Web Apps (automatic GitHub Actions deployment)
- **Backend**: Azure Container Apps (Docker containers via GitHub Actions)
- **Database**: Azure SQL Server
- **Storage**: Azure Blob Storage

## CI/CD Workflows

### Frontend Deployment

**Workflow**: `.github/workflows/azure-static-web-apps-witty-glacier-01b4b7710.yml`

**Triggers**:
- Push to `main` branch (paths: `frontend/**`)
- Pull requests to `main` (paths: `frontend/**`)

**Process**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run lint (`npm run lint`)
5. Build frontend (`npm run build`)
6. Deploy to Azure Static Web Apps

**Environment Variables (build time)**:
```
VITE_MICROSOFT_CLIENT_ID=1068db0a-2e86-4094-aa91-b55bca8ac09a
VITE_API_URL=https://arttherapy-plus-api.ambitioussand-bc135123.centralus.azurecontainerapps.io/api
```

**Required Secrets**:
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WITTY_GLACIER_01B4B7710`

### Backend Deployment

**Workflow**: `.github/workflows/deploy-azure.yml`

**Triggers**:
- Push to `main` branch (paths: `azure-backend/**`)
- Manual trigger (workflow_dispatch)

**Process**:
1. Checkout code
2. Setup Docker Buildx
3. Login to Azure Container Registry
4. Build and push Docker image
5. Login to Azure
6. Deploy to Azure Container Apps
7. Verify deployment (health check)

**Required Secrets**:
- `AZURE_CREDENTIALS` - Service principal JSON
- `ACR_LOGIN_SERVER` - ACR login server (e.g., myacr.azurecr.io)
- `ACR_USERNAME` - ACR username
- `ACR_PASSWORD` - ACR password
- `AZURE_RESOURCE_GROUP` - Resource group name
- `AZURE_CONTAINER_APP_NAME` - Container App name

## Manual Deployment

### Frontend

```bash
# Using deployment script
./scripts/deploy-frontend.sh

# Or manually
cd frontend
npm run build
# Upload dist/ contents to Azure SWA
```

### Backend

```bash
# Build container locally
./scripts/build-container.sh

# Deploy to Azure
./scripts/deploy-backend.sh
```

## Azure Resources

### Azure Static Web Apps
- **Name**: witty-glacier-01b4b7710
- **URL**: https://witty-glacier-01b4b7710.2.azurestaticapps.net
- **Build output**: `dist/`
- **App location**: `./frontend`

### Azure Container Apps
- **Name**: arttherapy-plus-api
- **URL**: https://arttherapy-plus-api.ambitioussand-bc135123.centralus.azurecontainerapps.io
- **Port**: 8787
- **Environment**: ambitioussand-bc135123

### Azure Container Registry
- Stores Docker images for backend
- Tags: `latest`, `sha-<commit>`

### Azure SQL Server
- Managed SQL database
- Connection string in environment variables
- Firewall rules for Azure services

### Azure Storage Account
- Blob container: `arttherapyplus`
- Stores generated/edited images
- Public read access for images

## Environment Variables (Production)

### Backend Container App

Set via Azure Portal or CLI:

```bash
az containerapp update \
  --name arttherapy-plus-api \
  --resource-group <resource-group> \
  --set-env-vars \
    NODE_ENV=production \
    PORT=8787 \
    DATABASE_URL="<connection-string>" \
    AZURE_STORAGE_CONNECTION_STRING="<storage-connection>" \
    AZURE_STORAGE_CONTAINER_NAME=arttherapyplus \
    JWT_SECRET="<secret>" \
    MICROSOFT_CLIENT_SECRET="<secret>" \
    OPENAI_API_KEY="<api-key>" \
    OPENROUTER_API_KEY="<api-key>" \
    ALLOWED_ORIGINS="https://witty-glacier-01b4b7710.2.azurestaticapps.net"

**Note**: `OPENROUTER_API_KEY` is optional. Without it, only DALL-E 3 is available for image generation. With it, users can choose between DALL-E 3, Flux Pro, and Gemini Flash via the model selector.
```

## Rollback

### Frontend
- Azure SWA maintains deployment history
- Rollback via Azure Portal or redeploy previous commit

### Backend
```bash
# Deploy specific image tag
az containerapp update \
  --name arttherapy-plus-api \
  --resource-group <resource-group> \
  --image <acr>.azurecr.io/arttherapy-plus-api:<previous-tag>
```

## Monitoring

### Health Check
```bash
curl https://arttherapy-plus-api.ambitioussand-bc135123.centralus.azurecontainerapps.io/api/health
```

### Logs
```bash
# View container logs
az containerapp logs show \
  --name arttherapy-plus-api \
  --resource-group <resource-group> \
  --follow

# View GitHub Actions logs
# GitHub > Actions > Select workflow run
```

### Azure Portal
- Container Apps > Metrics (requests, errors, latency)
- Application Insights (if configured)
- SQL Server > Query Performance Insights

## Troubleshooting Deployment

### Build Fails
- Check GitHub Actions logs
- Verify dependencies in package.json
- Run `npm run build` locally first

### Container Won't Start
- Check container logs in Azure Portal
- Verify environment variables are set
- Check database connectivity

### Health Check Fails
- Verify /api/health endpoint responds
- Check CORS configuration
- Verify PORT matches container config

### Database Connection Issues
- Check firewall rules (allow Azure services)
- Verify connection string format
- Test connection from local with same credentials
