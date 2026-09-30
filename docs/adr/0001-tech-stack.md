# ADR 0001: Tech stack

- **Status:** Accepted
- **Date:** 2026-09-30
- **Phase:** 01 — Bootstrap

## Context

JalMaps is a groundwater monitoring platform for India. Farmers check their well's water
level from low-end Android phones on slow, unreliable networks, often with low literacy and
in many Indian languages. Village admins, officials and insurers need maps, alerts,
forecasts and reports. We are building the app and website first against a data simulator;
real hardware integration comes much later. The team is small and mostly full-stack; the
product must ship iteratively and stay cheap to host while usage is unpredictable.

## Decision

Adopt the following fixed stack:

- **Next.js (App Router) + TypeScript strict** — one framework for web app, website and
  API routes; server components reduce client JavaScript, which matters on low-end phones.
- **Tailwind CSS + shadcn/ui + lucide-react** — small, accessible components we own and
  can theme per locale; no heavyweight UI framework.
- **next-intl** — first-class App Router i18n; every user-facing string routes through it.
- **Supabase** (Postgres, Auth, Realtime, Storage, Edge Functions) — managed backend with
  row level security; realtime for live sensor readings without extra infrastructure.
- **Zod** — one validation library shared by env loading, API routes and forms.
- **TanStack Query** for client data fetching/caching, **Recharts** for charts,
  **MapLibre GL** (open-source, no API-key lock-in) for maps.
- **Vitest + Testing Library** (unit), **Playwright** (e2e), **GitHub Actions**, **pnpm**.

## Alternatives considered

- **Expo/React Native app first** — better offline/voice potential, but a second codebase
  and slower iteration; a well-tuned mobile web app reaches more farmers sooner. Revisit a
  thin native shell later if voice/offline demands it.
- **Firebase** — realtime and auth are strong, but Postgres (Supabase) fits relational
  sensor/time-series queries, insurance-grade reports, and SQL-based analytics better.
- **Self-hosted Django/Laravel + Postgres** — maximum control, but slower to ship auth,
  realtime and file storage for a small team; more ops burden.
- **Mapbox instead of MapLibre GL** — polished, but per-load pricing and vendor lock-in
  are wrong for village-scale deployments on unpredictable budgets.
- **Jest instead of Vitest** — Jest is battle-tested, but Vitest is faster, ESM-native and
  the current default for new Next.js projects.

## Consequences

- One deployable artefact (Vercel or any Node host); Supabase removes server ops for auth,
  realtime and storage. Small team can move fast.
- Server Components keep client bundles small — a real advantage on low-end Android.
- We own our UI components (shadcn/ui is copied in, not imported), so accessibility
  patterns (48px targets, icon + text, non-colour cues) can be enforced centrally.
- MapLibre GL requires choosing/hosting a tile source later; budget for it in a map phase.
- Supabase ties us to its auth model and RLS discipline; migrations must be treated as
  production assets from the first database phase.
- The data simulator must imitate whatever ingestion contract real hardware will use, so
  the hardware phase does not force product rewrites.
