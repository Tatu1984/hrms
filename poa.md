# HRMS — Plan of Action (UI/UX Refresh)

> Resume point for **Tue 2026-06-30**. Last worked: 2026-06-28.
> Branch: `login-audit-prod`. **Nothing has been pushed — do not push without explicit OK.**

---

## Goal

Refresh the HRMS UI/UX to a **lean, light aesthetic matching the `hospital` project**
(`/Users/sudipto/Desktop/projects/hospital/frontend`) — white sidebar, slate palette,
small type, subtle borders, near-invisible shadows, flat surfaces. The "quiet" Notion/Linear feel.

### Locked decisions
- **Scope: UI/UX only** for now (no functional/security changes yet — see backlog at bottom).
- **Bigger visual refresh** (not just incremental), but **do not break existing behavior** — presentation only, nav/routing data shapes unchanged.
- **Palette = slate** (matches hospital's `index.css`), not the old neutral gray or the old hardcoded orange/dark sidebar.
- **Verify locally in the browser** before any push.
- **DB is PROD** (Neon, via `.env.development`). Keep everything **read-only** — UI work only renders data; logging in just writes a normal session/login-audit row.

---

## How to run & verify

```bash
cd /Users/sudipto/Desktop/projects/hrms
npm run dev        # http://localhost:3000  (Next 16 + Turbopack)
```
- Login: `sudipto.mitra@infinititechpartners.com` / `Tatu@1984` (super admin → `/admin`)
- Main shell to eyeball: `/admin/dashboard`, `/admin/employees`
- Theme toggle: top-right (moon/sun). Sidebar collapse: panel icon top-left. Resize narrow → mobile drawer.

### ⚠️ Turbopack CSS-cache gotcha (important)
Editing `src/app/globals.css` tokens may **not** hot-reload — Turbopack caches the CSS chunk and
keeps serving old `:root` values. If palette changes don't appear:
```bash
lsof -ti:3000 | xargs kill -9 ; rm -rf .next ; npm run dev
```
Then hard-refresh the browser (Cmd+Shift+R). Re-login (restart clears the session cookie).
Component/layout class changes (Tailwind utilities) DO hot-reload fine; only token edits need this.

---

## DONE (2026-06-28) — App shell + design tokens

All presentation-only; verified compiling + rendering 200; served CSS confirmed to carry new slate tokens.

| File | Change |
|---|---|
| `src/app/globals.css` | `:root`/`.dark` tokens → **slate** HSL (matches hospital). primary slate-900, border slate-200, muted-fg slate-500, radius `0.75rem`. Dark = slate-dark + blue accent. |
| `src/app/layout.tsx` | Real metadata (was "Create Next App"); no-flash dark-mode `<script>`; `suppressHydrationWarning`; token-based body bg. |
| `src/components/shared/theme-toggle.tsx` | **NEW** — light/dark toggle, persists to `localStorage('theme')`. |
| `src/components/shared/app-shell.tsx` | **NEW** — responsive shell: desktop **240px** collapsible sidebar (`w-60`, persisted `localStorage('sidebar-collapsed')`), mobile drawer w/ overlay + scroll-lock, slate-50 content bg (`bg-muted/40`), 56px header. Takes optional `topBanner` slot. |
| `src/components/shared/sidebar.tsx` | Rewritten: design tokens (was hardcoded slate-900/orange), **subtle gray active state** (not dark pill), 13px labels, 16px icons, `py-1.5` density, auto-expands active section, icon-collapse w/ tooltips, closes drawer on mobile nav. |
| `src/components/shared/navbar.tsx` | Rewritten: tokens, mobile hamburger, desktop collapse toggle, theme toggle, avatar dropdown (Profile [disabled]/Log out), **dynamic page title from route** (was always "Dashboard"), 56px (`h-14`). |
| `src/app/(admin)/admin/layout.tsx` | Uses `AppShell` (SuspiciousLoginBanner passed as `topBanner`); trackers/messenger preserved. |
| `src/app/(manager)/manager/layout.tsx` | Uses `AppShell`. |
| `src/app/(employee)/employee/layout.tsx` | Uses `AppShell`. |

**Net effect:** every page now sits in a lean white/slate shell with working dark mode + responsive nav,
without touching any business logic.

---

## NEXT (start here Tuesday) — Page-body migration

The **shell** matches hospital; the **page bodies still use hardcoded colors** (`blue-100`, `gray-500`,
bold colored cards) and won't be fully "lean" until migrated to tokens + hospital component styles.

### Hospital reference styles to copy (exact values)
- **Card**: `rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]`, header `p-6 space-y-1.5`, title `text-lg font-bold`, desc `text-sm text-muted-foreground`.
- **Table**: `text-sm`; header `bg-muted/50 border-b-2`, header cell `h-12 px-4 font-bold text-muted-foreground`; cell `p-4`; row `hover:bg-muted/50 border-b`.
- **Badge**: `rounded-full px-2.5 py-0.5 text-xs font-bold` (status colors via tokens / semantic).
- **Stat/KPI tile**: `p-4 rounded-xl`, icon wrapper `size-10 rounded-xl` with pastel `*-50` bg + `*-600` text + `*-100` ring; hover `-translate-y-0.5 shadow-[0_4px_12px_rgb(0_0_0_/_0.05)]`.
- Page padding `p-6 lg:p-8`; section spacing `space-y-7`.
- Hospital files for reference: `…/hospital/frontend/src/components/ui/{card,button,table,badge,input}.tsx`, `…/pages/NewDashboard.tsx`, `…/components/MainLayout.tsx`.

### Order of attack
1. **Admin dashboard** (`src/app/(admin)/admin/dashboard/`) — make it the template: KPI tiles, cards, charts (recharts use `--chart-*` tokens). Get sign-off on this one page first.
2. **Employees list** (`src/app/(admin)/admin/employees/page.tsx`) — table style + **add pagination** (UI only; `src/components/ui/pagination.tsx` already exists). Empty/loading states (skeletons via existing `src/components/ui/skeleton.tsx`).
3. **Employee status / Login audit / Attendance** — heavy hardcoded-color pages.
4. Sweep remaining pages role-by-role (employee, manager) reusing the patterns.
5. **Polish pass**: empty states w/ actions, loading skeletons everywhere, aria-labels on icon-only buttons, focus states, contrast check.

### Find hardcoded colors to migrate
```bash
grep -rl -E "bg-(blue|green|orange|purple|gray|slate|red|yellow)-[0-9]" src/app src/components --include=*.tsx | sort
```
Map: `bg-white`→`bg-card`, `text-gray-500/600`→`text-muted-foreground`, `bg-gray-100`→`bg-muted`,
`border-gray-200`→`border-border`, ad-hoc brand → `bg-primary/text-primary`. Keep semantic status colors
(success/warn/destructive) but route through tokens where possible.

### Guardrails
- Verify each page renders 200 + visually after change; check dev log for errors.
- Don't change data fetching, props, or routing — styling/markup only.
- Commit per logical group; **ask before pushing.**

---

## BACKLOG (out of current UI scope — for later, from the initial assessment)

Functional gaps (deepest-impact first): leave **balances/accruals/policies** (currently none),
**payroll safety** (TDS/EPF/ESI hardcoded to 0 — unsafe for real payroll), performance/appraisals (missing),
real ATS (only AI resume parsing), benefits & LMS (missing), onboarding/offboarding workflows.

Production red flags: **single-tenant** (hardcoded "Infiniti Tech Partners" — blocks SaaS),
**no tests**, no rate limiting on login, fallback JWT secret in code, default password `12345678` for new
employees, Zod imported but validation thin, no pagination on list endpoints.

> These are NOT part of the UI refresh. Revisit after UI sign-off; tackle security quick-wins + leave balances next.
