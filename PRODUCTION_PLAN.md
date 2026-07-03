# HRMS — Production Plan of Action / Resume Doc

> Last updated 2026-07-03. Goal: **finish a sellable, multi-tenant, production-grade HRMS.**
> Status: single-company **~86%**, sellable multi-tenant SaaS **~77%**.
> A full code audit (5 parallel passes: security, payroll/leave, multi-tenancy, reliability,
> billing/deploy) was run 2026-07-03; its verified findings drive the LEFT-TO-DO list below.

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

## DONE (2026-07-03 — audit + launch-blocker fixes, on branch, NOT yet pushed)

Verified locally: `npm run typecheck` clean, `npm test` 12/12, `npm run build` compiles + 152 pages.

- **Payroll:**
  - **Divisor is a fixed `/30` (30-day-month convention) — NO month-length proration** (business rule confirmed by owner 2026-07-03). `salary/30 * presentDays` in both fixed + variable branches. (An earlier days-in-month change was reverted per owner.)
  - **Professional Tax no longer levied on a zero-gross month** (`payroll-calc.ts`) + **net floored at 0** (`payroll/route.ts`) — no more negative take-home. New unit test added.
  - **`SalaryConfig` now org-scoped** (`payroll/route.ts:97`, `orgWhere`) — each tenant uses its own PF/ESI/TDS/PT rates.
- **Leave balance race fixed:** `adjustUsed` is now atomic (`increment` + floor), and approval uses new **`tryConsume`** (atomic conditional `updateMany`: quota check + increment in one statement). `src/lib/leave-balance.ts`, `leaves/route.ts`. No more lost-update / over-quota via concurrent approvals.
- **Crons now actually run:** added `crons` to `vercel.json` → `/api/cron/daily-attendance` daily `0 2 * * *` (07:30 IST, processes the completed IST day). Vercel sends `Authorization: Bearer $CRON_SECRET`, which the route already checks. NOTE: `auto-heartbeat` is a POST + needs sub-daily frequency → NOT wired (Vercel cron is GET + hobby=daily); needs a GET alias or external scheduler if idle-tracking is wanted.
- **Secrets/credentials:** untracked `.env.development` from git (had a real DB URL + weak JWT secret) + added to `.gitignore`; scrubbed `.env.example` (empty `JWT_SECRET` w/ `openssl` hint, marked `OPENAI_API_KEY` legacy). Removed the **published demo credentials** (`admin/manager/employee : 12345678`) from the login page.
  - ⚠️ **Owner follow-up:** the old `.env.development` values are in git history — rotate the **Neon DB password** and confirm prod `JWT_SECRET` in Vercel differs from the committed placeholder. Demo creds also still live in `public/hrms_doc.html` + `SYSTEM_DOCUMENTATION.html` (docs) — scrub if those are served publicly.
- **Tenant-isolation sweep (closed most SaaS leaks):**
  - **New employees now get `organizationId`** on their User row (`employees/route.ts`) — was the root fail-open leak.
  - **Random one-time employee password** (was `12345678`), surfaced once to the admin UI (`employee-form-dialog.tsx`) to share out-of-band.
  - **Org-scoped 13 leaking routes:** `users` GET + `[id]` PUT/DELETE, `reports` (all 4 generators + overview), `employee-status`, `time-analytics`, `invoices/upload`, `payroll/[id]`, `employees/[id]/{banking,documents,toggle-active}`, `users/[id]/{permissions,messaging-permissions}`. No-org-column models (BankingDetails/EmployeeDocument/MessagingPermission) scoped via their parent employee/user (own org column = future schema follow-up).
  - **Per-org sequence numbering** for employee codes, leads, sales (was global).
- **Security hardening:** signup rate-limit (per-IP/email 15-min window, 429) — ⚠️ in-module Map, weak across serverless instances, revisit with a durable store; **SSRF allow-list** `src/lib/url-guard.ts` (https-only, blocks localhost/private/link-local/metadata/IPv6-mapped/raw-IP) wired into both integration connection routes; **`accounting/seed` now ADMIN-gated**.
- **Fabricated AI data no longer shown as real:** removed hardcoded `accuracyRate:89` + estimate stats (now null/"not tracked"), stripped `Math.random()` resume skill/experience + "Sample Candidate/Mentor" + random skill-gap + hardcoded team matrix (return honest "unavailable"), implemented real after-10AM late-arrivals (⚠️ uses server-local/UTC time — offset for IST), removed the fake messaging presence dot.
- **Ops:** `next build` added to CI (verified builds without a live DB — uses placeholder env); verbose payroll `console.log` gated behind `PAYROLL_DEBUG`.
- **Verified:** typecheck clean, `npm test` 12/12, `npm run build` compiles + 152 pages.

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
- **Multi-tenancy (HR CORE isolated; long tail NOT — see audit below):** `Organization` model + org-aware sessions; `organizationId` on 23 models (backfilled to `org_default`); `src/lib/tenant.ts` (orgWhere/withOrg); **28 of 99** route files scoped; **self-serve `/signup`** (org + admin); per-org composite unique constraints. ⚠️ Correction: earlier "isolation VERIFIED" was over-stated — accounting, RBAC, reports, and several by-id routes still leak across tenants (audit §M below).
- **Tests + CI:** Vitest (`npm test`, 11 tests: payroll-calc + tenant), GitHub Actions CI (typecheck + tests).

---

## LEFT TO DO (prioritized)

> **Two launch paths.** Most remaining blockers are *multi-tenant* leaks that stay dormant with a
> single company. **Single-company launch (Infiniti):** the 2026-07-03 fixes cleared the real
> blockers (payroll math, secrets, crons); what's left there is §0 items only. **Multi-tenant SaaS:**
> also needs §M (tenant leaks), §B (billing), §E (email/auth self-service) before selling.

### 0. Single-company launch — remaining (small)
- **Default new-employee password is `12345678`** (`employees/route.ts:117`), no forced reset. Needs: random temp password + force-change-on-first-login (blocked on password-reset flow, §E). Interim: change the constant / require admin to set one.
- **Fabricated data shown as real** (see §AI) — hide/label the worst before external eyes: hardcoded `accuracyRate:89` (`ai/stats/route.ts:91`, rendered `ai/page.tsx:306`), and the fake permanent-offline presence dot (`messages/contacts/route.ts:99`, `PopupMessenger.tsx:188`).
- **`next build` not in prod CI** (`.github/workflows/ci.yml` = typecheck+test only; build job is gated to the `R-and-D` branch). Add build (needs a DB secret) so a broken build can't merge.
- **Verbose payroll `console.log`** (~15 lines/employee/run, incl. salary breakdowns) → gate behind a debug flag / structured logger.

### M. Multi-tenant data-isolation leaks (BLOCKS selling as SaaS — verified 2026-07-03)
Root cause: `orgWhere()` **fails open** (returns `{}` when session has no org). **Fix first:** make it *throw* when a session lacks `organizationId` (fail-closed), so future misses can't silently leak.
- **New employees created WITHOUT `organizationId`** (`employees/route.ts:118`) → their session has no org → every scoped query returns all tenants. Highest-impact; fix with the fail-closed change.
- **Unscoped reads leaking cross-tenant PII:** `users` GET (`users/route.ts:93`), `users/[id]` update/delete, `reports/route.ts` (attendance+payroll), `payroll/[id]/route.ts:23`, `employees/[id]/banking` + `/documents` + `/toggle-active`, `employee-status/route.ts:29`, `time-analytics`, `ai/dashboard-analytics`, `invoices/upload/route.ts:56` (writes w/o org).
- **Whole accounting module has NO `organizationId`** (Ledger/Voucher/Party/etc.) + **globally-`@unique` doc numbers** (invoice/bill/order/receipt/payment) → cross-org number collisions fail inserts. Needs schema migration + convert to `@@unique([organizationId, …])`.
- **RBAC global:** `IAMRole`/`Permission`/`UserRole` have no org (`iam/**`). Integration secrets (Azure DevOps/Confluence PATs) reachable by-id cross-org (`integrations/**`).
- **Global sequence generators** for leads/sales/project numbers (`leads/route.ts:79`, `sales/route.ts:79`) — make per-org.
- Login-audit/activity models (`AuditLog`, `AuthEvent`, `ActivityLog`, `Session`, etc.) have no org — `audit-log`, `browser-activity`, `admin/suspicious-activity` mix tenants.

### S. Security hardening (remaining)
- **No rate limiting on `/api/signup`** (login IS lockout-protected now — plan's old "no login rate limit" note is outdated). Unauthenticated org-spam/DoS vector.
- **Authenticated SSRF** in integration connection-test (admin-supplied `organizationUrl`, `integrations/connections/test/route.ts:36,60`) — allow-list hosts.
- **`accounting/seed`** authed but no role check (any EMPLOYEE can trigger) — gate ADMIN.
- Cross-tenant admin writes on target `userId` in `users/[id]/permissions` + `messaging-permissions` (add org check). No CSRF tokens (sameSite=lax mitigates). `next.config` image `remotePatterns` host `'**'` (proxy-any-host).

### E. Self-service auth + email (BLOCKS SaaS; also unblocks §0 password reset)
No password-reset / forgot-password pages or routes, and **no mailer installed** (no nodemailer/resend/sendgrid). Add an email provider, then: forgot/reset password, signup email verification, first-login force-change. Add signup rate-limiting here too.

### B. Billing / Stripe (STARTED — `stripe` pkg installed, ZERO code — verified)
Build with graceful degradation (no keys ⇒ billing disabled, app unaffected):
- Schema: add to `Organization`: `plan String @default("free")`, `stripeCustomerId String? @unique`, `stripeSubscriptionId String?`, `subscriptionStatus String?`, `currentPeriodEnd DateTime?`. Migration additive.
- `src/lib/billing.ts`: plan definitions + limits, `getStripe()`, `isBillingConfigured()`.
- API: `POST /api/billing/checkout` (Stripe Checkout), `POST /api/billing/portal` (customer portal), `POST /api/webhooks/stripe` (verify signature, update Organization on subscription events — make route public + raw body).
- Admin billing page (current plan + upgrade/manage buttons).
- Optional plan gating (seat limits etc.).
- Env to add in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs (e.g. `STRIPE_PRICE_PRO`). Owner must create products/prices + webhook in Stripe dashboard.

### 2. Super-admin / org console
Cross-org platform view (list all orgs, counts, activate/deactivate, provision). Define a super-admin (e.g. users in `org_default` ADMIN, or add a flag). `GET/POST /api/organizations` + `/admin/organizations` page.

### AI. Synthetic/fake data shown as real (verified — depth)
Label or gate the synthetic fallback data so it's not shown as real when no LLM. Confirmed offenders:
`Math.random()` resume skill levels + fake work history (`ai/recruitment/route.ts:44,62`), "Sample Candidate"
matches (`:220`), random skill-gap levels (`ai/learning/route.ts:57`), hardcoded team-skill matrix (`:294`),
`accuracyRate:89` + estimate-based stats (`ai/stats/route.ts:91,96,100`), "Late Arrivals" metric that counts
all punch-ins (`ai/dashboard-analytics/route.ts:98`). NOTE: real DB-backed analytics + no-key 503 degradation
are genuinely fine — only the fallbacks fabricate. Update stale model IDs if any remain. (Chat works now.)

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
