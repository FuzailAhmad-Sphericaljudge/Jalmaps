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
cp .env.example .env.local   # fill in Supabase credentials
pnpm dev                     # http://localhost:3000
```

Environment variables are documented in [.env.example](.env.example) and validated at
runtime by `src/lib/env.ts` — the app fails fast with a readable error if anything is missing.

To run end-to-end tests locally, install the Playwright browser once:

```bash
pnpm exec playwright install chromium
```

## Scripts

| Command           | What it does                     |
| ----------------- | -------------------------------- |
| `pnpm dev`        | Start the dev server             |
| `pnpm build`      | Production build                 |
| `pnpm start`      | Serve the production build       |
| `pnpm lint`       | ESLint                           |
| `pnpm lint:fix`   | ESLint with auto-fix             |
| `pnpm format`     | Prettier (write)                 |
| `pnpm typecheck`  | Next.js typegen + `tsc --noEmit` |
| `pnpm test`       | Vitest unit tests (single run)   |
| `pnpm test:watch` | Vitest in watch mode             |
| `pnpm test:e2e`   | Playwright end-to-end tests      |
| `pnpm check`      | lint + typecheck + unit tests    |

## Project structure

```
src/
  app/        # App Router routes (incl. /api/health)
  components/ # Shared UI components
  features/   # Feature modules (domain-organised)
  server/     # Server-only code
  lib/        # Shared utilities (env, clients)
  i18n/       # Messages and locale config (next-intl)
  styles/     # Global styles
docs/
  adr/        # Architecture decision records
  phases/     # Per-phase build notes
supabase/     # Migrations, Edge Functions (later phases)
e2e/          # Playwright specs
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Branching is one branch per phase
(e.g. `phase/01-bootstrap`); commits follow
[Conventional Commits](https://www.conventionalcommits.org/) and are enforced by commitlint.

## Roadmap

Phase plans and progress live in [docs/phases/](docs/phases/). Project context, users and
ground rules: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## License

[MIT](LICENSE)
