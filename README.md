# ConvoSync Frontend

React + Vite web app for **ConvoSync** — unified customer conversations across WhatsApp, Instagram, Messenger, email, campaigns, journeys, and AI agents.

## Prerequisites

- Node.js 20+
- ConvoSync backend API running (see backend repo)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL and VITE_SOCKET_URL
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (include `/api`) |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_APP_URL` | Public frontend URL (SEO / OAuth redirects) |
| `VITE_META_*` | Meta / WhatsApp embedded signup |

See `.env.example` for the full list.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript check |

## Docker

```bash
docker build -t convosync-frontend .
docker run -p 8080:80 convosync-frontend
```

Build args: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_APP_URL`, and Meta OAuth variables (see `Dockerfile`).

## Repository

This frontend was split from the main ConvoSync monorepo. Backend lives in a separate repository.
