# JalMaps

Groundwater monitoring for India. Sensor nodes (ESP32 + submersible pressure sensor) report
water levels from wells and borewells. Farmers get a simple, voice-enabled, multilingual view
of their well; village admins, officials and insurers get maps, alerts, forecasts and reports.

> The app and website are being built first against a data simulator. Real hardware
> integration arrives in a later phase.

<!-- Screenshot placeholder: add a screenshot of the home/dashboard here. -->

## Tech stack

| Concern         | Choice                                             |
| --------------- | -------------------------------------------------- |
| Framework       | Next.js (App Router) + TypeScript (strict)         |
| Styling / UI    | Tailwind CSS, shadcn/ui, lucide-react              |
| i18n            | next-intl                                          |
| Backend         | Supabase (Postgres, Auth, Realtime, Storage, Edge) |
| Validation      | Zod                                                |
| Data fetching   | TanStack Query                                     |
| Charts          | Recharts                                           |
| Maps            | MapLibre GL                                        |
| Testing         | Vitest + Testing Library (unit), Playwright (e2e)  |
| CI              | GitHub Actions, Dependabot                         |
| Package manager | pnpm                                               |

## Quick start

Prerequisites: **Node.js 24** (see `.nvmrc`) and **pnpm 10** (`corepack enable pnpm`).

```bash
pnpm install
pnpm db:start               # requires Docker Desktop
pnpm db:reset               # apply migrations and load development fixtures
cp .env.example .env.local   # fill in Supabase credentials
pnpm dev                     # http://localhost:3000
```

For local development, map `API_URL`, `PUBLISHABLE_KEY` and `SECRET_KEY` from
`pnpm exec supabase status -o env` to the corresponding variables in `.env.local`.
The service-role secret is server-only and bypasses RLS; never expose it in browser code.

Environment variables are documented in [.env.example](.env.example) and validated at
runtime by `src/lib/env.ts` — the app fails fast with a readable error if anything is missing.

To run end-to-end tests locally, install the Playwright browser once:

```bash
pnpm exec playwright install chromium
```

## Scripts

| Command               | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`            | Start the dev server                                                      |
| `pnpm build`          | Production build                                                          |
| `pnpm start`          | Serve the production build                                                |
| `pnpm lint`           | ESLint                                                                    |
| `pnpm lint:fix`       | ESLint with auto-fix                                                      |
| `pnpm format`         | Prettier (write)                                                          |
| `pnpm typecheck`      | Next.js typegen + `tsc --noEmit`                                          |
| `pnpm test`           | Vitest unit tests (single run)                                            |
| `pnpm test:watch`     | Vitest in watch mode                                                      |
| `pnpm test:e2e`       | Playwright end-to-end tests                                               |
| `pnpm check`          | lint + typecheck + unit tests                                             |
| `pnpm db:start`       | Start the local Supabase stack (Docker required)                          |
| `pnpm db:stop`        | Stop the local Supabase stack                                             |
| `pnpm db:reset`       | Recreate the local database, apply migrations and seed fixtures           |
| `pnpm db:types`       | Regenerate `src/lib/db/types.ts` from the local schema                    |
| `pnpm db:types:check` | Fail if generated database types are stale (requires the local stack)     |
| `pnpm db:test`        | Run SQL/pgTAP and repository integration tests (requires the local stack) |

## Project structure

```
src/
  app/        # App Router routes (incl. /api/health)
  components/ # Shared UI components
  features/   # Feature modules (domain-organised)
  server/     # Server-only code
  lib/        # Shared utilities, Zod schemas, and generated database types
  i18n/       # Messages and locale config (next-intl)
  styles/     # Global styles
docs/
  adr/        # Architecture decision records
  phases/     # Per-phase build notes
supabase/     # Local Supabase config, migrations, seed, SQL tests
e2e/          # Playwright specs
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Branching is one branch per phase
(e.g. `phase/01-bootstrap`); commits follow
[Conventional Commits](https://www.conventionalcommits.org/) and are enforced by commitlint.

Authentication and local test identities are described in [docs/auth.md](docs/auth.md);
the implemented database access boundaries are in [docs/rls.md](docs/rls.md).

## Roadmap

Phase plans and progress live in [docs/phases/](docs/phases/). Project context, users and
ground rules: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## License

[MIT](LICENSE)
