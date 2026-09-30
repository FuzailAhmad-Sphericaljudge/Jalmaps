# Phase 01 — Bootstrap

- **Status:** Complete
- **Branch:** `phase/01-bootstrap`
- **Date:** 2026-09-30

## What was built

A clean, production-grade repository foundation — no product features:

- **Next.js app** (App Router, `src/` directory, TypeScript `strict` +
  `noUncheckedIndexedAccess`, Tailwind CSS, ESLint, `@/*` path alias) scaffolded with
  create-next-app and pnpm.
- **Tooling:** Prettier (with the Tailwind class-sorting plugin), `.editorconfig`,
  `.nvmrc` (Node 24), and npm scripts: `dev`, `build`, `start`, `lint`, `lint:fix`,
  `format`, `typecheck`, `test`, `test:watch`, `test:e2e`, `check`.
- **Git hooks:** Husky + lint-staged (format/lint staged files) and commitlint enforcing
  Conventional Commits.
- **Tests:** Vitest + Testing Library (jsdom) with tests for the env loader, home page and
  health route; Playwright with a home page smoke test (auto-starts the dev server).
- **Structure:** `src/{app,components,features,server,lib,i18n,styles}`, `docs/adr`,
  `docs/phases`, `scripts`, `supabase` (placeholder README; migrations/Edge Functions land
  in later phases).
- **API:** `GET /api/health` returns `{ status, version, time }`; unit-tested.
- **Home page:** minimal JalMaps placeholder (name + one-line description), Tailwind only.
- **Env:** `.env.example` with documented Supabase variables and a typed, fail-fast
  Zod loader in `src/lib/env.ts` (server and public schemas).
- **CI:** `ci.yml` (pnpm-cached install, lint, typecheck, unit tests, build on PRs and
  pushes to main) and `e2e.yml` (Playwright with browser install + report upload);
  Dependabot for npm and GitHub Actions.
- **Hygiene:** README, MIT LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, issue templates
  (bug/feature), pull request template, `docs/PROJECT_CONTEXT.md`, `CLAUDE.md`.

## Decisions

- **TS 5.9, ESLint 9 flat config** — what create-next-app pins today; boring and
  well-supported. (TypeScript 7 exists but is not what the toolchain expects yet.)
- **`typecheck` runs `next typegen && tsc --noEmit`** — Next 16 generates route types
  (e.g. `LayoutProps<"/">`) into `.next/types`; raw `tsc` fails on a clean checkout
  without it.
- **Vitest config as `.mts`** — avoids an ESM/CommonJS warning with `type: undefined`
  packages.
- **`turbopack.root` pinned to the repo** — a parent directory of the workspace contains a
  `package.json`, which made Next.js misdetect the workspace root on dev startup.
- **`@types/node` on 24** — matches Node 24 (`.nvmrc`) and satisfies Vitest's peer range.
- **`.env.example` force-added** — the default `.env*` gitignore rule needed a
  `!.env.example` exception.
- **Playwright webServer uses `pnpm dev`** — the smoke test runs against the real dev
  server locally and in CI; production-build e2e can come later if needed.

## Verification

- `pnpm check` (lint + typecheck + unit tests) and `pnpm build` pass locally.
- `pnpm test:e2e` passes (1 smoke test).
- Hooks verified: commitlint rejects non-conventional messages; lint-staged formats
  staged files.
- Acceptance: from a clean clone — `pnpm install && pnpm check && pnpm build` ✓.
