# Pain+ Art Therapy Web Application

A web application for art therapy focusing on pain management through creative expression. The app features AI-powered image generation and reflection tools.

## 🚀 Deployment Options

### Cloudflare (Recommended)
Deploy to Cloudflare's edge network for global performance:
```bash
./deploy.sh
```
See [Cloudflare Deployment Guide](docs/cloudflare-deployment.md) for detailed instructions.

### Local Development
Run both servers locally:
```bash
./start.sh
```

## Project Structure

```
.
├── backend/              # Flask backend API (local dev)
│   ├── app.py           # Main Flask application
│   └── requirements.txt
├── cloudflare-worker/    # Cloudflare Worker backend
│   ├── src/index.js     # Worker API implementation
│   └── wrangler.toml    # Cloudflare configuration
├── frontend/            # React frontend with Vite
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── services/    # API integration
│   └── package.json
├── docs/                # Documentation
├── deploy.sh           # Cloudflare deployment script
└── start.sh           # Local development script
```

## Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

### Run Both Servers
```bash
./start.sh
```

## Available Routes

- `/` - Welcome page
- `/mode` - Mode selection (Create Original Work / Inspire Me)
- `/describe` - Pain description input
- `/componentshowcase` - Component showcase for development

## Technology Stack

### Backend
- Flask
- Flask-CORS

### Frontend
- React (Vite)
- React Router
- Tailwind CSS
- Axios

## Development

View the component showcase at http://localhost:5173/componentshowcase to see all available components.