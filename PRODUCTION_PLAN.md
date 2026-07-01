# HRMS — Production-Grade Plan of Action

> Created 2026-06-30. Supersedes the UI-only scope in `poa.md` (UI refresh is folded in as Phase 6).
> Branch: `login-audit-prod`. **Nothing pushed — do not push without explicit OK.**

## Locked decisions (from user, 2026-06-30)
- **Scope:** Everything — core HR, accounting, AND AI. AI features become real when an `OPENAI_API_KEY` is configured; otherwise they degrade gracefully (never 500).
- **Deploy target:** Vercel / serverless (Neon Postgres). Implies: no local-disk uploads, serverless-safe Prisma, Vercel cron for jobs.
- **Tenancy:** Single company (Infiniti Tech Partners) for now, but **architect toward multi-tenant SaaS**. Don't add new single-tenant debt; lay groundwork; full multi-tenancy is its own later phase.
- **Process:** Plan approved before code. Commit per logical group. Ask before pushing.

---

## ⚠️ Prerequisites before ANY code that touches data/schema

1. **Separate dev/staging database.** `.env.development` points at PROD Neon. Many fixes need migrations (LeaveBalance, Org, encrypted tokens, etc.). We must NOT run unverified migrations against prod. **Action:** create a Neon branch (Neon supports instant DB branching) for dev/test, point `.env.development` (or a new `.env.test`) at it. Confirm before we proceed past Phase 1.
2. **OpenAI key** (for Phase 4). Provide `OPENAI_API_KEY` when ready; until then AI features stay in graceful-fallback mode.
3. **Blob storage** (for Phase 5). Decide Vercel Blob vs S3/R2 for file uploads.

---

## Phase 0 — Foundation & cleanup  (~0.5 day)
Goal: clean tree, safety nets, no behavior change.
- Delete cruft: `apps/` (duplicate app tree), all `"<name> 2.*"` Finder-copies in `src/lib`, `.claude/settings.local 2.json`, and the **stray `prisma/migrations/.../migration 2.sql`** (verify it's identical/unneeded first).
- Add a structured logger (`src/lib/logger.ts`); plan to replace 79 `console.log`s (some leak session/employee data).
- Add Zod **env schema** validated at startup (`src/lib/env.ts`); remove `DATABASE_URL`/`JWT_SECRET` from `next.config` `env{}` block.
- Stand up test harness (Vitest) + first smoke test. (Tests expand every later phase.)
- **Do NOT yet flip** `ignoreBuildErrors`/`ignoreDuringBuilds` — there are 87 real TS errors; flip them off at the end of Phase 1 once green.

## Phase 1 — Critical security + build integrity  (P0, ~1.5–2 days)
Goal: close takeover vectors, stop crashes, make the build honest.
**Security**
- Shared `requireAuth()` / `requireRole()` helper; **audit all ~100 API routes** and apply consistently.
- Add auth+RBAC to currently-open routes: `users`, `users/[id]`, `company-bank-accounts`, `upload`, `departments`, `designations`; add role checks to `accounting/*` and `ai/*`.
- `users` GET must `select` away password hashes.
- Remove `'fallback-secret-key'` JWT default — fail fast if `JWT_SECRET` missing.
- Middleware: fix **fail-open** permission bug → default-deny for non-admins.
- `verifyAuth()` + middleware honor session revocation; revocation check **fails closed** on DB error.
- Zod validation + explicit field whitelists (no `...body` spread) on auth/users/employees/iam.
- Encrypt integration access tokens at rest (`src/lib/crypto.ts`, AES-GCM w/ key from env).
- Sanitize/randomize upload filenames; default employee password = random + forced reset on first login.
- CSV export: neutralize formula-injection (`= + - @`). Login lockout: fail closed.
**Build integrity**
- Fix all 87 `src/` TS errors (e.g. `admin/sales/page.tsx` missing imports = live crash; `ai/chat`, `messages`).
- Fix `db.ts` Prisma singleton (serverless-safe; currently a new client per query → pool exhaustion).
- Then flip `ignoreBuildErrors`/`ignoreDuringBuilds` **off**; achieve clean `next build`.

## Phase 2 — Core HR correctness  (P1, ~2–3 days)
- **Payroll:** read `SalaryConfig` (PF/ESI/TDS/professionalTax) into generation; correct month-length proration (not flat /30); working-days exclude weekends/holidays; endpoint to edit penalties/advance/otherDeductions; payroll-settings stops dropping HRA/conveyance/medical/special and rehydrates saved values.
- **Leave:** new `LeaveBalance`/accrual model + migration; enforce balance on apply; UNPAID leave no longer paid (fix `markLeaveAttendance` + payroll's LEAVE-as-present); wire manager approve/reject/hold buttons; real balances in UI; payslip leave count from real data.
- **Attendance:** one shared idle-calc util (reconcile 3-min vs 5-min, consistent break exclusion); configurable thresholds; require `CRON_SECRET`.
- **Employees:** soft-delete via `isActive`; wire Search & Export buttons.
- **Holidays:** auto-apply to attendance/payroll.

## Phase 3 — Accounting completion  (P1/P2, ~2–3 days)
- Wire mock pages to their (working) APIs: ledgers, chart-of-accounts, parties, accounting dashboard.
- Fix **P&L date filter** (currently ignored) and balance-sheet retained-earnings line.
- Fix **sales revenue double-count** (books gross AND net).
- Voucher reversal/cancel + concurrency-safe numbering (DB counter in txn).
- Decide legacy vs double-entry: route sales/purchases/tax through the voucher engine **or** formally retire the legacy `Account` system + shell pages.
- Inventory create/edit UI; resolve abandoned schema (implement or remove SalesOrder/Quotation/PO/Bill/Budget/Stock/TaxConfig/Currency).

## Phase 4 — AI + integrations + messaging  (P2, ~1.5–2 days)
- Shared `isOpenAIConfigured()` guard + fallback/503 for sentiment, documents, predictions, analytics, automation (no more 500s).
- Stop presenting fabricated output as real: gate/label `Math.random()` skill levels, hardcoded skill matrix, sample candidates, `accuracyRate:89`.
- Consolidate provider config; update stale model IDs; remove unused LangChain deps or use them; wire the dead `AI_*` flags.
- Integration auto-sync via Vercel cron (or relabel as manual). (Token encryption done in Phase 1.)
- Messaging: add polling/SSE + real presence (reuse activity-heartbeat infra) instead of `online:false`.

## Phase 5 — Serverless deploy hardening  (P2, ~1–1.5 days)
- File uploads → blob storage (invoices, KYC, employee docs, project-dialog stub).
- `vercel.json` cron for daily-attendance, auto-heartbeat, integration sync.
- Replace console.logs with logger; per-route-group `loading.tsx`; per-segment error boundaries.
- N+1 fixes in hot paths (recalculate-idle, auto-heartbeat, vouchers).
- Tighten security headers (add CSP).

## Phase 6 — UI/UX refresh  (from original `poa.md`, ~2–3 days)
- Page-body migration to slate tokens / hospital component styles; pagination, skeletons, empty states, a11y, contrast. (Shell already done 2026-06-28.)

## Phase 7 — Multi-tenant SaaS foundation  (larger, ~3–5+ days, AFTER single-company is solid)
- `Organization` model; `orgId` across tenant-scoped models; automatic tenant scoping (Prisma extension); tenant-scoped auth/session; org settings replace hardcoded company; signup/onboarding; org switcher / subdomain; billing later.
- **Groundwork pulled earlier:** Phase 1/2 centralize company config into a DB-backed settings/Org record (company-profile reads from DB, not the `'Infiniti Tech Partners'` hardcode), so this migration is incremental, not a rewrite.

## Phase 8 — Testing & CI  (continuous; harness in Phase 0)
- Vitest unit tests: payroll math, leave accrual, accounting double-entry, auth/RBAC.
- Integration tests on critical APIs; Playwright smoke for login/attendance/payroll/leave.
- GitHub Actions CI: typecheck + lint + test + build on every push.

---

## Rough effort
~15–25 focused days for Phases 0–6 (single-company, production-grade incl. AI). Phase 7 (true SaaS) adds ~1 week+. I'll work phase-by-phase, commit per logical group, verify each on the dev DB, and **never push without your OK**.

## Sequencing rationale
P0 security/crashes first (the app is currently exploitable and has crashing pages). Then core HR correctness (payroll/leave are unsafe). Then accounting, AI, deploy hardening, UI polish. Multi-tenancy last — it's the biggest change and benefits from everything else being stable, but we avoid adding single-tenant debt meanwhile.
