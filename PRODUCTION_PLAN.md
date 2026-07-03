# HRMS — Production Plan of Action / Resume Doc

> Last updated 2026-07-03. Goal: **finish a sellable, multi-tenant, production-grade HRMS.**
> Status: single-company **~82%**, sellable multi-tenant SaaS **~76%**.

---

## How to resume (operational facts)

- **Repo / deploy:** working branch `login-audit-prod`. Remote **`prod`** = `Tatu1984/hrms` → its `main` branch **auto-deploys to Vercel** (project `hrms`). `origin` = `Tatu1984/hrmsdemo` (demo, ignore). Deploy = `git push prod login-audit-prod:main`.
- **Databases (Neon, eastus2):**
  - PROD: `ep-falling-math-a82t3qs3` (pooler for app, drop `-pooler` for direct).
  - DEV branch (safe copy): `ep-mute-wave-a8bk3gzm`. Local dev uses it via **gitignored `.env.development.local`** (DATABASE_URL pooler + DIRECT_URL direct + ENCRYPTION_KEY).
- **Migrations pipeline:** proper Prisma migrations. To add one: edit `schema.prisma`, then generate SQL via
  `npx prisma migrate diff --from-url "<PROD_DIRECT>" --to-schema-datamodel prisma/schema.prisma --script`,
  add a folder under `prisma/migrations/<ts>_name/migration.sql` (+ any backfill), then apply:
  `DIRECT_URL="<dev-direct>" npx prisma migrate deploy` (dev) then with prod-direct (prod).
  The Vercel build also runs `scripts/migrate-deploy.mjs` (uses `DIRECT_URL`, set in Vercel) so pushes auto-migrate.
- **Verify before every push (LEARNED THE HARD WAY):** the committed tree must build, not just the working tree.
  `rm -rf .next && DATABASE_URL="<dev-pooler>" ENCRYPTION_KEY="<key>" npm run build`. Check "Compiled successfully",
  "Running TypeScript" passes, and NO `node:crypto`/`Edge` or `Module not found`. Also `npm run typecheck` and `npm test`.
- **Verify prod after push:** Vercel MCP — `list_deployments` (latest state READY?) and `get_runtime_errors` (project `prj_s0BnE9mIenAH0Xn6Vh1ErbLr7D5K`, team `team_JLez4p6WrUVtodxcbh9MzJse`).
- **Vercel env vars — ALL SET by owner:** JWT_SECRET, CRON_SECRET, ENCRYPTION_KEY, DIRECT_URL, BLOB_READ_WRITE_TOKEN, AI_API_KEY, AI_BASE_URL, AI_MODEL (Groq: base `https://api.groq.com/openai/v1`, model e.g. `llama-3.3-70b-versatile`). Do NOT re-nag about these.
- **Gotchas:** middleware must not import `node:crypto` (edge) — keep edge-safe JWT in `src/lib/jwt.ts`. Test tooling (`*.test.ts`, `vitest.config.ts`) is excluded from `tsconfig`. `git stash pop` stages files — always `git add <explicit>` + check `git diff --cached`.
- **Memory:** see `production-grade-plan`, `gps-consent-behavior`, `which-db-is-prod`, `login-audit-geo` in the memory dir.

---

## DONE (all shipped to prod, verified, data-safe)

- **Security:** closed unauthenticated routes (users/departments/designations/company-bank/upload), removed JWT fallback secret, session revocation enforced + fail-closed, `src/lib/api-auth.ts` guards, middleware default-deny, cron-secret hardening, CSV-injection fix, integration **token encryption at rest** (`src/lib/crypto.ts`).
- **Build honesty:** fixed all 94 hidden TS errors, `ignoreBuildErrors` OFF, `db.ts` Prisma singleton fixed, edge/jwt split.
- **GPS consent:** ask **once**, re-prompt **only on IP change**, **mandatory** modal. AI chat role bug fixed.
- **UI:** slate app-shell + dark mode; sidebar grouped into labeled sections (all 3 roles).
- **Migrations pipeline** + baselined the drift → created the ~40 accounting tables that never existed in prod.
- **Payroll:** toggleable statutory deductions PF/ESI/TDS/P.Tax (`src/lib/payroll-calc.ts`), editable penalties/advance/other, payslip PF/ESI. **Leave:** balances/quotas (`src/lib/leave-balance.ts`, LeavePolicy/LeaveBalance, seeded 12/12/12), enforcement, UNPAID=LEAVE_UNPAID (unpaid), manager approve/reject wired. Settings UIs for both.
- **Accounting:** mock pages (ledgers/chart-of-accounts/parties) wired to real APIs; P&L date filter fixed; sales revenue double-count fixed; RBAC on accounting writes.
- **Files:** serverless-safe uploads via Vercel Blob (`src/lib/storage.ts`).
- **AI:** provider-agnostic (`AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`), graceful 503 without key; Groq live.
- **Multi-tenancy (isolation VERIFIED with a 2nd test org):** `Organization` model + org-aware sessions; `organizationId` on 23 models (backfilled to `org_default`); `src/lib/tenant.ts` (orgWhere/withOrg); ~30 API routes scoped; **self-serve `/signup`** (org + admin); per-org composite unique constraints.
- **Tests + CI:** Vitest (`npm test`, 11 tests: payroll-calc + tenant), GitHub Actions CI (typecheck + tests).

---

## LEFT TO DO (prioritized)

### 1. Billing / Stripe (STARTED — `stripe` pkg installed, nothing else yet)
Build with graceful degradation (no keys ⇒ billing disabled, app unaffected):
- Schema: add to `Organization`: `plan String @default("free")`, `stripeCustomerId String? @unique`, `stripeSubscriptionId String?`, `subscriptionStatus String?`, `currentPeriodEnd DateTime?`. Migration additive.
- `src/lib/billing.ts`: plan definitions + limits, `getStripe()`, `isBillingConfigured()`.
- API: `POST /api/billing/checkout` (Stripe Checkout), `POST /api/billing/portal` (customer portal), `POST /api/webhooks/stripe` (verify signature, update Organization on subscription events — make route public + raw body).
- Admin billing page (current plan + upgrade/manage buttons).
- Optional plan gating (seat limits etc.).
- Env to add in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs (e.g. `STRIPE_PRICE_PRO`). Owner must create products/prices + webhook in Stripe dashboard.

### 2. Super-admin / org console
Cross-org platform view (list all orgs, counts, activate/deactivate, provision). Define a super-admin (e.g. users in `org_default` ADMIN, or add a flag). `GET/POST /api/organizations` + `/admin/organizations` page.

### 3. AI depth
Label or gate the synthetic fallback data (Math.random skill levels, hardcoded skill matrix, sample candidates, `accuracyRate:89`) so it's not shown as real when no LLM. Update stale model IDs if any remain. (Chat works now.)

### 4. Accounting depth
Voucher reversal/cancel + concurrency-safe numbering; deeper financial reports; resolve legacy `Account` vs double-entry `Voucher` duality (pick one); inventory create/edit UI.

### 5. Integrations
Wire auto-sync scheduler (Vercel cron → `POST /api/integrations/sync`) — currently manual only.

### 6. Messaging
Real-time (polling/SSE) + real presence (reuse activity-heartbeat), instead of poll-on-open + fake online status.

### 7. Multi-tenant polish
Per-org sequence numbering (invoice/sale/lead generators are still global-ordered); `/login`→`/signup` link; signup email verification + rate-limiting.

### 8. Production hardening
Replace remaining `console.log`s with structured logging + error monitoring (Sentry). Empty/loading/error states on list pages. N+1 cleanup in hot paths.

### 9. Test coverage
Expand beyond payroll/tenant: leave enforcement, auth/RBAC, key API flows; consider Playwright smoke for login/attendance/payroll/leave/signup. Add `next build` to CI (needs DB secret).

### 10. Later / optional
Prisma 6→7 major upgrade (needs its own testing). Retire stray `apps/`-style cruft if any reappears.

---

## Recommended order
Billing → super-admin console → AI/accounting depth → integrations/messaging → polish + test coverage.
Everything ships in verified, data-safe increments; never push without a green committed-tree build.
