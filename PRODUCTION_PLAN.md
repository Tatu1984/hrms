# HRMS — Production Plan of Action / Resume Doc

> Last updated **2026-07-06**. Goal: **a sellable, multi-tenant, production-grade HRMS.**
> Status: single-company **launch-ready**; multi-tenant SaaS **isolation + security hardening complete**.
> What remains is **depth/polish only** — no known launch blockers. See "LEFT TO DO".

---

## How to resume (operational facts)

- **Repo / deploy:** working branch `login-audit-prod`. Remote **`prod`** = `Tatu1984/hrms` → its `main` branch **auto-deploys to Vercel** (project `hrms`). `origin` = `Tatu1984/hrmsdemo` (demo, ignore). Deploy = `git push prod HEAD:main`.
- **Databases (Neon, eastus2):**
  - PROD: `ep-falling-math-a82t3qs3` (pooler for app; drop `-pooler` for the direct URL used by migrations).
  - DEV branch (safe copy): `ep-mute-wave-a8bk3gzm`. Local dev uses it via **gitignored `.env.development.local`** (DATABASE_URL pooler + DIRECT_URL direct + ENCRYPTION_KEY). `.env.development` holds the PROD pooler URL.
- **Migrations pipeline:** proper Prisma migrations under `prisma/migrations/<ts>_name/migration.sql` (+ backfill). Apply with `DIRECT_URL="<direct>" DATABASE_URL="<pooler>" npx prisma migrate deploy`. The Vercel build also runs `scripts/migrate-deploy.mjs` — but it **skips silently if `DIRECT_URL` isn't set in Vercel**, so for any schema change **apply it manually to prod-direct BEFORE pushing** (done this way 2026-07-06; verified additive, no data loss). Additive nullable columns + backfill to `org_default` is the established pattern; old code tolerates new nullable columns, so migrate-then-deploy is safe in either order.
- **Verify before every push (LEARNED THE HARD WAY):** the committed tree must build. `npm run typecheck` (0 errors), `npm test` (all green), and for schema/build-risky changes `rm -rf .next && DATABASE_URL="<dev-pooler>" ENCRYPTION_KEY="<key>" npm run build`. Never push without a green committed tree. Pre-push sanity: confirm a clean fast-forward (`git merge-base --is-ancestor prod/main HEAD`) and whether the push adds any `prisma/migrations/` (if so, migrate prod first).
- **Verify prod after push:** Vercel MCP — `list_deployments` (latest READY?) + `get_runtime_errors` (project `prj_s0BnE9mIenAH0Xn6Vh1ErbLr7D5K`, team `team_JLez4p6WrUVtodxcbh9MzJse`).
- **Vercel env vars — ALL SET by owner:** JWT_SECRET, CRON_SECRET, ENCRYPTION_KEY, DIRECT_URL, BLOB_READ_WRITE_TOKEN, AI_API_KEY, AI_BASE_URL, AI_MODEL. (Optional/unset: STRIPE_*, RESEND_API_KEY — features degrade gracefully when absent.) Do NOT re-nag about these.
- **Gotchas:** middleware must stay edge-safe (no `node:crypto` — keep JWT in `src/lib/jwt.ts`). Test files + `vitest.config.ts` are excluded from `tsconfig`. `git stash pop`/`git add -A` — always check `git diff --cached`.
- **Tenancy contract:** `src/lib/tenant.ts` `orgWhere/withOrg/orgId` are **fail-closed** — they THROW `TenantScopeError` if a session has no `organizationId`. Every tenant-owned query must use them; genuinely cross-org code (super-admin/cron/webhook) must NOT (it queries without an org filter by intent). Regression tests: `src/lib/tenant.test.ts` + the rolled-back 2-tenant check `scripts/test-tenant-isolation.mjs`.
- **Memory:** see `tenant-isolation-audit`, `production-grade-plan`, `which-db-is-prod`, `login-audit-geo` in the memory dir.

---

## SHIPPED (all on prod, verified, data-safe)

**Core HR / payroll / leave / accounting**
- Payroll: fixed `/30` divisor (no month-length proration), no P.Tax on zero-gross months, net floored at 0, org-scoped `SalaryConfig`, statutory PF/ESI/TDS/P.Tax toggles, editable penalties/advance. Verbose logging gated behind `PAYROLL_DEBUG`.
- Leave: per-org balances/quotas, atomic `tryConsume` (no over-quota via concurrent approvals), enforcement, manager approve/reject.
- Accounting: real ledgers/chart-of-accounts/parties/P&L/balance-sheet, CSV/PDF export, RBAC on writes, org-isolated (organizationId on all accounting models).
- Employee **delete** cascade fixed (was FK-failing on `LeaveBalance`) + 20s tx timeout (`ab7650a`).

**SaaS pillars**
- Billing (Stripe), graceful: `src/lib/billing.ts`, `/api/billing/{checkout,portal,status}`, `/api/webhooks/stripe`, `/admin/billing`. No keys ⇒ disabled.
- Email + self-service password reset, graceful: `src/lib/mailer.ts` (Resend), `/api/auth/{forgot,reset,change}-password` + pages, first-login forced change, random temp passwords. No `RESEND_API_KEY` ⇒ links logged.
- Super-admin console: `User.isSuperAdmin`, `/superadmin`, org provision/activate/deactivate; login denies deactivated orgs.

**Multi-tenant isolation + security (completed 2026-07-06)**
- **Full tenant-isolation audit (all 111 routes)** → closed ~23 cross-tenant leaks (`5e98879`): admin/attendance, AI, integrations, audit, RBAC. Migration `20260706120000_ai_audit_iam_org` added `organizationId` to AuthEvent/AuditLog/AI models + **per-org RBAC** (IAMRole system-vs-custom). Write-sites stamp org (login/logout/session, attendance audit, all AI creates — `e4b3587`).
- **`orgWhere`/`withOrg` are fail-closed** — throw on missing org (`4a9e0c7`), so no org-less session can widen a query to all tenants.
- **SSRF hardening** (`b376de4`): `src/lib/url-guard.ts` blocks localhost/private/link-local/metadata/IPv6-mapped/raw-IP, **plus a per-platform host allow-list** enforced at the client factories (covers the stored-URL sync path; defeats DNS rebinding). Integration PATs encrypted at rest + org-ownership-checked before decrypt.
- Signup rate-limit (per-IP/email), `accounting/seed` ADMIN-gated, per-org sequence numbering (employee/lead/sale), org-scoped reports/users/payroll/banking/time-analytics.
- Fabricated AI/presence data removed (honest "unavailable" instead of `Math.random()`/`accuracyRate:89`).

**Ops:** Prisma migration pipeline; Vercel Blob uploads; provider-agnostic AI (Groq live, graceful 503 without key); GPS-consent (ask once, re-prompt on IP change); Vitest + CI (typecheck + tests + build job). Current tests: 31 passing.

---

## LEFT TO DO (depth / polish — no launch blockers)

> The multi-tenant SaaS isolation and security work is **done**. Everything below is enhancement,
> not a blocker to launching or selling. Rough priority order.

### 1. Test coverage
Broaden beyond payroll/tenant/url-guard: leave enforcement, auth/RBAC flows, key API happy-paths. Add a Playwright smoke suite (login → attendance → payroll → leave → signup). No e2e today.

### 2. Production hardening / observability
No error monitoring (Sentry) or structured logging — replace remaining `console.log`/`console.error` with a logger + Sentry. Add empty/loading/error states on list pages; clean up N+1 in hot paths.

### 3. Integrations
Auto-sync is **manual only** — wire a Vercel cron → `POST /api/integrations/sync` (only `/api/cron/daily-attendance` is scheduled today). Note: Vercel hobby crons are GET + daily; a POST/sub-daily sync needs a GET alias or external scheduler.

### 4. Messaging
Currently poll-on-open with no real presence. Add real-time (SSE/polling) + real presence by reusing the activity-heartbeat.

### 5. Accounting depth
Voucher reversal/cancel + concurrency-safe numbering; deeper financial reports; resolve the legacy `Account` vs double-entry `Voucher` duality (pick one); inventory create/edit UI. Doc-number `@unique` is still global — convert to `@@unique([organizationId, …])` when a 2nd tenant actually uses accounting.

### 6. Later / optional
- Signup email verification; `/login`→`/signup` link polish.
- Harden the signup rate-limiter (in-module `Map` is weak across serverless instances → durable store).
- `next.config` image `remotePatterns` host is `'**'` (proxy-any-host) — tighten.
- Prisma 6→7 major upgrade (isolated, needs its own testing).

### Owner follow-ups (not code)
- The old `.env.development` values are in git history — **rotate the Neon DB password** and confirm prod `JWT_SECRET` differs from any committed placeholder.
- Demo creds may still live in `public/hrms_doc.html` / `SYSTEM_DOCUMENTATION.html` — scrub if served publicly.
- To enable billing/email: create Stripe products + webhook and set `STRIPE_*`; set `RESEND_API_KEY` + `EMAIL_FROM`.

---

## Recommended order
Test coverage → observability (Sentry/logging) → integrations auto-sync → messaging realtime → accounting depth.
Everything ships in verified, data-safe increments; never push without a green committed-tree build, and migrate prod-direct before pushing any schema change.
