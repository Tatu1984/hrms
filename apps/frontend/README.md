# HRMS Frontend

Pages, components, and UI. Calls the backend (`apps/backend/`) over HTTP — no
direct Prisma / database access.

## Local dev

```bash
# Terminal 1 — backend on port 3001
cd apps/backend && npm run dev

# Terminal 2 — frontend on port 3000
cd apps/frontend
npm install
cp .env.example .env
# Set NEXT_PUBLIC_BACKEND_URL=http://localhost:3001 and JWT_SECRET to match backend
npm run dev
```

## Environment

| Variable | Where read | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Browser + server | Base URL for backend API calls |
| `JWT_SECRET` | Server (middleware) | HS256 secret for verifying the session cookie locally to gate page routes. Must match the backend's value. |

## Deploying to Vercel

1. Add a new Vercel project pointing at `Tatu1984/hrms`.
2. Set **Root Directory** to `apps/frontend`.
3. Add env vars (`NEXT_PUBLIC_BACKEND_URL` pointing at the backend project URL, `JWT_SECRET` matching backend).
4. After the backend project is up, add the frontend URL to the backend's `FRONTEND_ORIGIN`.
