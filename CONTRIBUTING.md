# Contributing to JalMaps

Thanks for helping build JalMaps. This guide covers how we work.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase credentials
pnpm dev
```

## Branching

- One branch per phase: `phase/01-bootstrap`, `phase/02-...`.
- Within a phase, small topic branches are optional; keep work rebased on the phase branch.
- PRs target `main` (or the current phase integration branch when one exists).

## Commit style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add /api/health endpoint
fix: handle empty sensor readings
docs: expand CONTRIBUTING with e2e notes
chore: bump next to 16.3.7
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `style`,
`revert`. A scope is optional (`feat(alerts): ...`). commitlint enforces this on every
commit; squashed work should be rewritten (`git rebase -i`) before pushing shared branches.

## Running checks

Before pushing (the pre-commit hook covers staged files):

```bash
pnpm check        # lint + typecheck + unit tests
pnpm build        # production build
pnpm test:e2e     # Playwright (install browsers first: pnpm exec playwright install chromium)
pnpm format       # Prettier across the repo
```

CI runs lint, typecheck, unit tests and build on every PR and push to `main`, and a separate
workflow runs Playwright. Keep PRs green.

## Conventions that matter

- Every user-facing string goes through i18n (next-intl). No hardcoded copy.
- Farmer-first UI: 48px minimum touch targets, icon + text, never colour alone.
- Store measurements in metres; display m/ft by user preference.
- Small, atomic commits; run `pnpm check` before pushing.

## Issues and pull requests

Use the issue templates (bug / feature) and the pull request template. Keep PRs small and
describe the why, not just the what.
