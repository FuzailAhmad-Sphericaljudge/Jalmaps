# JalMaps contributor instructions

## Project

- JalMaps monitors groundwater wells in India using sensor nodes and a simulator.
- Farmers need simple multilingual access on low-end Android phones and slow networks.
- Village admins, officials and insurers need appropriately scoped groundwater data.

## Fixed stack

- Next.js App Router and strict TypeScript.
- Tailwind CSS, shadcn/ui and lucide-react.
- next-intl for all user-facing text and locale-aware routes.
- Supabase Postgres/Auth/Realtime/Storage/Edge Functions.
- Zod validation; read environment variables only through `src/lib/env.ts`.
- TanStack Query, Recharts, MapLibre GL.
- Vitest/Testing Library, Playwright, GitHub Actions and pnpm.

## Non-negotiable ground rules

- Route every user-visible string through next-intl; keep English and Hindi in sync.
- Farmer-first UI: 48px minimum touch targets, icon plus text, and never colour alone.
- Store all lengths in metres; display metres or feet by user preference.
- Keep secrets out of source control; service-role credentials are server-only.
- Use small, meaningful Conventional Commits; never create empty or fake commits.
- Use one branch per phase, following the active phase plan.
- Keep database access in typed server repositories, not route handlers or UI.
- Default-deny RLS; never trust client-supplied roles or authorization claims.

## Before completing work

- Read `docs/PROJECT_CONTEXT.md` and the active phase plan.
- Add tests and directly related documentation with each behavior change.
- Run `pnpm check` before every commit and push; run `pnpm build` for app changes.
- Keep the worktree clean and push only verified commits.
