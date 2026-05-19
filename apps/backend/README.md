# HRMS Backend

API-only Next.js project. Deploys as its own Vercel project.

## Local dev

```bash
cd apps/backend
npm install
cp .env.example .env
# fill in DATABASE_URL, JWT_SECRET, FRONTEND_ORIGIN
npm run dev   # serves on http://localhost:3001
```

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `JWT_SECRET` | HS256 secret used to sign session tokens. Must match the frontend's value if the frontend verifies tokens locally. |
| `FRONTEND_ORIGIN` | Comma-separated list of origins allowed by CORS, e.g. `https://hrms.infinititechpartners.com,http://localhost:3000` |
| `CRON_SECRET` | Used by Vercel Cron to call `/api/cron/*` routes |

## Deploying to Vercel

1. In the Vercel dashboard, **Add New Project** → import `Tatu1984/hrms`.
2. Set **Root Directory** to `apps/backend`.
3. Add the env vars above (production values).
4. Set **Production Branch** to `main` (or whatever you prefer); preview branches build automatically.
5. After the first deploy, copy the production URL (e.g. `https://hrms-backend.vercel.app`) and set it as `NEXT_PUBLIC_BACKEND_URL` on the frontend Vercel project.

## Session cookies across origins

The session cookie is `HttpOnly; Secure; SameSite=None` in production so that the frontend (on a different domain) can include it on `fetch` requests with `credentials: 'include'`. CORS in `src/middleware.ts` returns `Access-Control-Allow-Credentials: true` and echoes back any allowed origin from `FRONTEND_ORIGIN`.
