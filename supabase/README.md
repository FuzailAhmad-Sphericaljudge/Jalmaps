# Supabase

This directory holds the local Supabase project for JalMaps:

- `config.toml` — local Supabase CLI configuration
- `migrations/` — ordered, forward-only Postgres schema migrations
- `seed.sql` — development hierarchy, profile identities, wells and simulated nodes
- `tests/database/` — pgTAP checks run by `pnpm db:test`

Run `pnpm db:start`, `pnpm db:reset`, `pnpm db:test` and `pnpm db:stop` with Docker
Desktop running. See [the database guide](../docs/database.md) for schema and workflow.
