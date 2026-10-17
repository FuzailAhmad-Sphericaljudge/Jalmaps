# JalMaps — Project Context

> **Any contributor or AI assistant working on this repo should read this file first.**
> It defines what JalMaps is, who it serves, the fixed stack, and the ground rules that
> every change must respect.

Status: Phase 5 (authentication and roles) — see [docs/phases/](phases/) for progress and
[docs/i18n.md](i18n.md) for the i18n architecture and add-a-locale recipe.

## What we are building

JalMaps is a groundwater monitoring platform for India. Sensor nodes (ESP32 +
submersible pressure sensor) report the water level of wells and borewells. Farmers get a
simple, voice-enabled, multilingual view of their well. Village admins, officials and
insurers get maps, alerts, forecasts and reports.

We are building the app and website first, using a **data simulator**. Real hardware
integration comes much later, so nothing in the product code may assume a specific
ingestion protocol yet.

## Users

| User           | Needs                                                      |
| -------------- | ---------------------------------------------------------- |
| Farmers        | Simple, voice-enabled, multilingual view of their well     |
| Village admins | Maps, alerts, basic administration                         |
| Officials      | Maps, alerts, forecasts, reports                           |
| Insurers       | Historical data, reports, evidence for parametric products |

Many farmers use **low-end Android phones on slow, unreliable networks**, may have **low
literacy**, and speak **many Indian languages**. Every design and engineering choice must
respect that.

## Fixed stack (do not substitute)

- **Next.js** (App Router) + **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`)
- **Tailwind CSS**, **shadcn/ui**, **lucide-react**
- **next-intl** for internationalisation
- **Supabase** (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Zod** for validation (including `src/lib/env.ts`)
- **TanStack Query** for data fetching, **Recharts** for charts, **MapLibre GL** for maps
- **Vitest** + Testing Library (unit), **Playwright** (e2e)
- **GitHub Actions**, **pnpm**

Prefer boring, well-supported defaults. Pin nothing exotic.

## Ground rules

1. **i18n for every string.** No hardcoded user-facing copy; all messages via next-intl.
2. **Farmer-first UI:** 48px minimum touch targets, icon + text, never colour alone to
   convey meaning. Optimise for low-end Android and slow networks.
3. **Units:** store metres, display m/ft by user preference.
4. **Commits:** small, atomic, Conventional Commits (enforced by commitlint).
5. **Branches:** one branch per phase (`phase/01-bootstrap`, `phase/02-...`).
6. **Secrets:** never commit real secrets; use `.env.local` (see `.env.example`).
7. **Env access:** only through `src/lib/env.ts` — never read `process.env` ad hoc.

## Repository map

```
src/app/        App Router routes (incl. /api/health)
src/components/ Shared UI components
src/features/   Feature modules (domain-organised)
src/server/     Server-only code
src/lib/        Shared utilities (env, clients)
src/i18n/       Messages and locale config
src/styles/     Global styles
docs/adr/       Architecture decision records
docs/phases/    Per-phase build notes
supabase/       Local Supabase config, migrations, seed data and SQL tests
e2e/            Playwright specs
```

## Phase scope notes

- **Phase 1 (bootstrap)** — tooling, CI, docs, health check, placeholder home page.
- **Phase 3 (i18n)** — next-intl foundation: `/en` + `/hi` locale-prefixed routes, typed
  messages, formatters, language switcher, pseudo-localisation, `check-i18n` CI gate,
  no-raw-JSX-text lint rule, i18n e2e. No database, auth, or product features yet.
- **Phase 4 (database)** — Supabase schema, seed fixtures, typed repositories, default-deny
  RLS and database CI.
- **Phase 5 (authentication and roles)** — phone OTP and email sign-in, onboarding,
  trusted profile roles, table policies, account data controls and automated RLS tests.
