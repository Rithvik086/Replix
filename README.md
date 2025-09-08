# Replix

A small WhatsApp automation / bot project with a React (Vite) frontend and a Node + TypeScript backend using whatsapp-web.js, MongoDB and Socket.IO for realtime chat.

## Table of Contents

- About
- Local setup
- Environment variables
- API endpoints
- Deployment notes
- Troubleshooting
- Contributing & License

## Quick plan

- Project intro and features
- Local setup (backend + frontend)
- Environment variables
- Deployment notes (AWS backend + Vercel frontend)
- Troubleshooting & debugging tips

## Features

- Real-time chat view using Socket.IO
- Messages log stored in MongoDB
- WhatsApp integration via whatsapp-web.js (LocalAuth)
- Settings, persona/rules engine and manual send feature

## Local setup (recommended)

Prereqs

- Node.js (16+ recommended)
- npm or pnpm
- MongoDB (local or Atlas)

1. Clone and install

```bash
# clone the repo
git clone https://github.com/Rithvik086/Replix.git
cd Replix

# install backend deps
cd backend
npm install

# install frontend deps
cd ../frontend
npm install
```

2. Configure env files

- Copy examples to local `.env` files and edit values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env and frontend/.env to match your local ports/keys
```

Key backend envs (see `backend/.env.example`):

- PORT (default 5000)
- MONGODB_URI
- JWT_SECRET
- FRONTEND_URL (frontend origin for CORS)
- WWEBJS_AUTH_PATH (default `.wwebjs_auth`) — set absolute path in production
- ENABLE_DEBUG (true/false)

3. Run services

Backend (dev):

```bash
cd backend
npm run dev
```

Frontend (dev):

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` (or the port Vite reports).

## Features

- Real-time messaging via Socket.IO (instant updates in the dashboard)
- Persistent message log stored in MongoDB
- WhatsApp integration using whatsapp-web.js with LocalAuth
- Rules engine for conditional automated replies, with optional LLM fallback
- Dashboard for QR scanning, status monitoring, manual sending, and settings

## Example .env files

Copy these examples into `backend/.env` and `frontend/.env` (or set equivalent environment variables in your hosting platform).

Backend (`backend/.env.example`):

```bash
# Backend Environment Variables
PORT=5000
NODE_ENV=development

# WhatsApp auth/session path (make sure to mount persistent disk here in production)
WWEBJS_AUTH_PATH=.wwebjs_auth

# Enable debug endpoints (set to true only for debugging)
ENABLE_DEBUG=false

# Database (local dev example)
MONGODB_URI=mongodb://localhost:27017/replix

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5174

# Message retention in days (used for TTL index)
MESSAGE_TTL_DAYS=30

# External APIs (optional)
# GEMINI_API_KEY=your-google-gemini-key
# OPENAI_API_KEY=your-openai-api-key
```

Frontend (`frontend/.env.example`):

```bash
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:5000

# Optional: analytics / error monitoring
# VITE_SENTRY_DSN=
```
