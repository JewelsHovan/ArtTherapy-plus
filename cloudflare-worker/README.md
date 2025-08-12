# Art Therapy Plus API - Cloudflare Worker

This is the backend API for Art Therapy Plus, deployed as a Cloudflare Worker.

## Features

- AI-powered image generation using DALL-E 3
- Creative prompt generation using GPT-4
- Reflection questions for art therapy
- Inspirational prompts
- Serverless architecture with global edge deployment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Set your OpenAI API key:
```bash
wrangler secret put OPENAI_API_KEY
```

## Development

Run locally:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate/image` - Generate art from pain description
- `POST /api/generate/prompt` - Generate creative prompts
- `POST /api/reflect` - Generate reflection questions
- `GET /api/inspire` - Get inspirational prompts

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (set as a secret)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## Monitoring

View real-time logs:
```bash
npm run tail
```