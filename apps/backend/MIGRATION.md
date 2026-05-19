# Backend split migration notes

This file lives in `apps/backend/` and tracks the in-progress split of the HRMS monorepo into two Vercel projects.

## Phase 1 — backend extracted ✅

`apps/backend/` is a standalone Next.js project containing all API routes (`src/app/api/*`), the Prisma schema, and the backend `src/lib/*` (auth, db, ip, ai, integrations, permissions, attendance utils).

The original code at the repo root has **not** been touched, so the existing Vercel project (which builds from the repo root) keeps working unchanged.

## Phase 2a — frontend skeleton ✅

`apps/frontend/` exists as a standalone Next.js project containing:

- Configs: `package.json` (UI deps only, no Prisma/AI), `next.config.ts`, `tsconfig.json`, `vercel.json`, ESLint, Tailwind/PostCSS.
- `src/components/`, `src/hooks/`, `src/types/` — copied wholesale.
- `src/lib/auth.ts` — verify-only (drops `setSession`, `hashPassword`, `verifyAuth`, `bcryptjs`). Backend stays the source of truth for token issuing.
- `src/lib/api.ts` — `apiFetch()` / `apiJson()` wrapper that resolves paths against `NEXT_PUBLIC_BACKEND_URL`, forwards the incoming `cookie` header on server-side calls, and uses `credentials: 'include'` everywhere.
- `src/middleware.ts` — page-level RBAC gate; verifies the session JWT locally with the shared `JWT_SECRET` (no round-trip).
- `src/app/{layout,page,error,not-found,global-error,globals.css}` — app shell.
- `src/app/(auth)/login/page.tsx` — uses `apiFetch`.
- `src/app/(employee)/employee/{layout,dashboard}` — uses `apiFetch`. Pulls dashboard data from the new bundled `/api/dashboard/employee` endpoint on the backend instead of running 5 Prisma queries inline.

Every `fetch('/api/...')` in the copied components tree (~95 sites across 57 files) was rewritten to `apiFetch('/api/...')` so components stay portable as additional route groups land.

The original code at the repo root is still untouched. The current Vercel deploy keeps working unchanged.

## Phase 2b — remaining route groups (not yet done)

Still to convert: `(admin)` (~35 pages), `(manager)` (~10 pages), `(dashboard)/ai`, `(employee)/{attendance, daily-updates, leaves, payslips, projects, tasks, time-analytics, work-items, ...}`. Each page that does `prisma.x.findMany()` server-side needs either:

- A bundled backend endpoint (preferred when a page makes ≥3 queries) — see `/api/dashboard/employee` as the pattern.
- Or, for thin pages, point straight at the existing `/api/<resource>` route.

## Phase 3 — deployment

1. In Vercel, add a second project pointing at this repo, **Root Directory** → `apps/frontend`.
2. Env vars: `NEXT_PUBLIC_BACKEND_URL=https://<backend-project>.vercel.app`, `JWT_SECRET=<same as backend>`.
3. On the backend Vercel project, set `FRONTEND_ORIGIN` to include the frontend URL so CORS allows it.
4. Cookies are `SameSite=None; Secure` in prod (already configured in backend `auth.ts`); browser will attach the session cookie on cross-origin `fetch` automatically.

## Local dev

```bash
# Terminal 1
cd apps/backend && npm run dev    # http://localhost:3001

# Terminal 2
cd apps/frontend && npm run dev   # http://localhost:3000
```

`apps/frontend/.env`: `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`, `JWT_SECRET=<match backend>`.
