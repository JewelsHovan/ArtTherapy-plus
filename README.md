# Pain+ Art Therapy Web Application

A web application for art therapy focusing on pain management through creative expression. The app features AI-powered image generation and reflection tools.

## Project Structure

```
.
├── backend/           # Flask backend API
│   ├── app.py        # Main Flask application
│   └── requirements.txt
├── frontend/         # React frontend with Vite
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── ...
│   └── package.json
└── start.sh         # Script to run both servers
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