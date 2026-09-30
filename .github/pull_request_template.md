## What does this PR do?

<!-- One or two sentences: the why, not just the what. Link the phase plan or issue. -->

## Type of change

- [ ] `feat` — new capability
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `chore` / `ci` — tooling, config, CI
- [ ] `refactor` / `test` — no behaviour change

## How was it verified?

- [ ] `pnpm check` (lint + typecheck + unit tests) passes locally
- [ ] `pnpm build` passes
- [ ] `pnpm test:e2e` passes (if user-facing)
- [ ] Verified manually in the browser (describe below)

<!-- e.g. "Ran pnpm dev, visited /api/health, saw { status: ok }" -->

## Checklist

- [ ] Commits follow Conventional Commits (enforced by commitlint)
- [ ] No real secrets committed; `.env.local` only locally
- [ ] User-facing strings go through i18n (when UI work starts)
- [ ] Docs/ADRs updated where relevant
