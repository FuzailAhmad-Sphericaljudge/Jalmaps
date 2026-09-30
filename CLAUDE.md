# Guidance for AI assistants

**Read [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) first.** It defines the
product, the users (farmers on low-end Android phones, slow networks, many languages),
the fixed stack, and the non-negotiable ground rules. When instructions conflict,
`docs/PROJECT_CONTEXT.md` and the current phase plan in `docs/phases/` win.

## Commands

```bash
pnpm install        # install dependencies
pnpm dev            # dev server on http://localhost:3000
pnpm build          # production build
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier (write)
pnpm typecheck      # next typegen + tsc --noEmit
pnpm test           # Vitest unit tests
pnpm test:watch     # Vitest watch mode
pnpm test:e2e       # Playwright (pnpm exec playwright install chromium first)
pnpm check          # lint + typecheck + unit tests
```

Run `pnpm check && pnpm build` before you consider any change done.

## Conventions

- TypeScript strict + `noUncheckedIndexedAccess`; path alias `@/*` -> `src/*`.
- App Router with the `src/` directory. Server-only code under `src/server/`.
- Env vars only via `src/lib/env.ts` (Zod-validated). Never read `process.env` directly.
- Every user-facing string goes through next-intl (once i18n lands in a later phase).
- Farmer-first UI: 48px touch targets, icon + text, never colour alone; store metres,
  display m/ft by preference.
- Conventional Commits, enforced by commitlint; Husky runs lint-staged on staged files.
- One branch per phase: `phase/01-bootstrap`, `phase/02-...`.
- Tests live next to the code (`*.test.ts(x)`); e2e specs in `e2e/`.
- Keep the repo runnable at every commit. Prefer small atomic commits.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
