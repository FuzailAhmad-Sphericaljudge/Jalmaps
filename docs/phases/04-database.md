# Phase 04 — Database schema and Supabase

- **Status:** Implemented and locally verified
- **Branch:** `phase/04-database`
- **Date:** 2026-10-01

## Delivered

- Initialized the Supabase CLI project and configured the local Postgres 17 stack.
- Added grouped migrations for administrative areas/profiles, wells/nodes/readings,
  alerts/access/audit, helper functions, the latest-reading view and default-deny RLS.
- Added PostGIS-backed well locations, metre-based measurements, UTC timestamps,
  indexes for lookup paths, unique reading idempotency and updated-at triggers.
- Seeded two states, four districts, twelve blocks, thirty-six villages, six sample
  profiles and thirty wells with simulated nodes; no readings are seeded.
- Added typed browser/server/service-role clients, Zod validation schemas and repositories
  for wells, nodes and readings. Service-role code is isolated to the server.
- Added pgTAP checks for RLS, default-deny policy state, coordinate/hierarchy
  constraints, reading idempotency, the latest-reading view and depth calculation.
- Added generated-type write/check scripts and a CI job that starts Supabase, resets,
  tests and verifies generated types.
- Documented the entity model, policy roadmap, migration guidance and no-partitioning
  decision in `docs/database.md`, `docs/rls-plan.md` and ADR 0002.
- Phase 5 has since replaced the default-deny policy placeholder with the implemented
  role policies; see `docs/rls.md`.

## Decisions

- RLS is enabled without policies in this phase; data access remains deny-by-default.
- Readings are not partitioned until real volume, query plans and retention needs justify
  the added operational complexity.
- Seed Auth identities are fixture-only and have no usable password.

## Verification

Run `pnpm db:start`, `pnpm db:reset`, `pnpm db:test`, `pnpm db:types:check` and
`pnpm db:stop` with Docker running. These checks pass locally and CI repeats the
database tests on Ubuntu.
