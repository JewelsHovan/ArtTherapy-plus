# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Pain+ Art Therapy Web Application - A full-stack application for art therapy focusing on pain management through creative expression using AI-powered image generation (DALL-E 3) and reflection tools.

## Tech Stack & Architecture

### Backend (Flask API - Port 5000)
- **Framework**: Flask with Flask-CORS
- **AI Integration**: OpenAI API (GPT-4o-mini for prompts/reflection, DALL-E 3 for images)
- **API Endpoints**:
  - `/api/health` - Health check
  - `/api/generate/image` - Generate art from pain descriptions
  - `/api/generate/prompt` - Generate creative prompts
  - `/api/reflect` - Generate reflection questions
  - `/api/inspire` - Get inspirational prompts
- **Environment**: Requires `OPENAI_API_KEY` in `.env` file

### Frontend (React + Vite - Port 5173)
- **Build Tool**: Vite with React template
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom theme colors
- **HTTP Client**: Axios with proxy to backend
- **Component Structure**: Bottom-up approach with showcase route

## Essential Commands

### Development
```bash
# Run both servers simultaneously
./start.sh

# Or run separately:
# Backend
cd backend && python app.py

# Frontend  
cd frontend && npm run dev
```

### Frontend Commands
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run lint     # Run ESLint checks
npm run preview  # Preview production build
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create .env file with OPENAI_API_KEY
python app.py
```

## Key Development Patterns

### Frontend Component Architecture
- **Bottom-up Development**: Build atomic components first, then compose
- **Component Showcase**: `/componentshowcase` route for isolated testing
- **Folder Structure**:
  - `components/common/` - Reusable UI (Button, Logo, etc.)
  - `components/forms/` - Form components (TextInput, etc.)
  - `pages/` - Route-level components
  - `services/` - API integration layer

### API Communication
- Frontend proxy configured in `vite.config.js` to route `/api/*` to backend
- CORS configured for localhost:5173 and localhost:3000
- All API calls use `/api/` prefix for automatic proxying

### Routing Structure
```javascript
/ - Welcome page
/register - User registration
/mode - Mode selection (Create/Inspire)
/describe - Pain description input
/visualize - Art generation and display
/componentshowcase - Component development
/settings - User settings
/profile - User profile
```

### Figma Design References
- **Page Components**: https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe?node-id=1142-4103&m=dev
- **Component Library**: https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe?node-id=1104-1863&m=dev

## Critical Implementation Notes

### State Management Flow
1. User selects mode (Create/Inspire) → stored in component state
2. Pain description → sent to backend → generates image/prompts
3. Generated content → displayed with reflection questions
4. All API responses include original context for continuity

### Error Handling
- Backend returns structured JSON errors with status codes
- Frontend should handle loading states and API errors gracefully
- CORS preflight handled with OPTIONS endpoints

### Security Considerations
- Never commit `.env` file with API keys
- OPENAI_API_KEY required for backend functionality
- Proxy configuration prevents direct API exposure

## Testing & Quality Checks

Before any commit:
1. Ensure `npm run lint` passes (ESLint configured)
2. Verify `npm run build` succeeds
3. Test CORS with included `test-cors.html`
4. Check component showcase for visual regression
5. Verify API endpoints return expected responses

## MCP Server Integration
When using MCP servers for development:
- **Figma Dev Mode**: Extract designs and variables
- **Puppeteer**: Visual testing and screenshots
- **Context7**: React documentation lookup
- **Sequential Thinking**: Complex task planning