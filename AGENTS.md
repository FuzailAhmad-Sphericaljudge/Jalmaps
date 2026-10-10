<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# JalMaps Project Rules

See `docs/` for full details. Do not paste long documents here.

## Purpose

A groundwater monitoring platform for India (sensors -> DB -> Web UI).
Users: Farmers (phones), Village Admins, Officials, Insurers.

## Stack (Fixed - do not substitute)

- Next.js (App Router), TypeScript (strict)
- Tailwind CSS v4, shadcn/ui, lucide-react, next-intl
- Supabase (Postgres, Auth, RLS, Storage)
- Zod, TanStack Query, Recharts, MapLibre GL
- Vitest, Playwright, pnpm

## Ground Rules

1. **i18n for EVERY string.** No hardcoded UI text.
2. **Farmer-first UI:** 48px minimum touch targets, icon + text.
3. **Units:** Store in metres, display in local preference (m/ft).
4. **Commits:** Small, atomic, Conventional Commits.
5. **Git:** Work directly on `main`, run `pnpm check` before push, push frequently.
6. **Secrets:** `.env.local` only (no secrets in repo). `src/lib/env.ts` for parsing.
7. **Auth Phase (Current):** No UI for managing other users, OTP tested locally.

## Key Commands

- `pnpm dev`: Start Next.js
- `pnpm db:start` / `pnpm db:stop`: Manage local Supabase
- `pnpm db:reset`: Reset DB & seed
- `pnpm db:test`: Run pgTAP / DB tests
- `pnpm check`: Run lint, typecheck, unit tests, i18n checks (MUST RUN BEFORE PUSH)
- `pnpm test:e2e`: Playwright

## Roadmap Phases

<!--
  PITCH / SUMMARY OF PHASES:
  Phases 1-11: Built the core foundation. Farmers can log in (OTP), see their wells, check water levels on a dashboard, manage settings, and view maps.
  Phase 12: Realtime Updates. The dashboard now updates instantly via WebSockets when new sensor readings arrive.
  Phase 13: Alerts Engine. A smart system that constantly evaluates readings to detect issues like low water, fast depletion, or sensor faults.
  Phase 14: Notifications. The system now takes those alerts and reliably delivers them via SMS, WhatsApp, Web Push, etc., respecting quiet hours and user preferences.
-->

- **Phase 1-11**: Completed (Foundation, Auth, Navigation, Settings, Admin, Dashboard, Map, etc.)
- **Phase 12**: Completed (Realtime Updates - WebSockets & Broadcasting)
- **Phase 13**: Completed (Alerts Engine - Cron workers, Evaluators, State Machine)
- **Phase 14**: Completed (Notifications - Outbox pattern, SMS/Push Providers, Routing Logic)
