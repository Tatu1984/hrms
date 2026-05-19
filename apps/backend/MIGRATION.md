# Backend split migration notes

This file lives in `apps/backend/` and tracks the in-progress split of the HRMS monorepo into two Vercel projects.

## Phase 1 — backend extracted (this commit)

`apps/backend/` is a standalone Next.js project containing all API routes (`src/app/api/*`), the Prisma schema, and the backend `src/lib/*` (auth, db, ip, ai, integrations, permissions, attendance utils).

The original code at the repo root has **not** been touched, so the existing Vercel project (which builds from the repo root) keeps working unchanged.

### What to do now

1. In Vercel, create a new project pointing at this repo and set **Root Directory** → `apps/backend`.
2. Copy env vars from production: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`. Add `FRONTEND_ORIGIN`.
3. Build & deploy. Once green, you get a URL like `hrms-backend.vercel.app`.
4. Test: `curl https://hrms-backend.vercel.app/api/auth/me -i` (should 401, not 500).

## Phase 2 — frontend extraction (not yet done)

Will create `apps/frontend/` with the pages, components, and an API client that calls `apps/backend/` instead of using Prisma directly. The frontend Vercel project's root directory will switch from the repo root to `apps/frontend/`.

## Phase 3 — auth wiring

Frontend middleware will verify the session JWT locally (using the shared `JWT_SECRET`) to avoid an extra round-trip on every request.
