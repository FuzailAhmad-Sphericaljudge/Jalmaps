# ADR 0002: Database model and local Supabase

- **Status:** Accepted
- **Date:** 2026-10-01
- **Phase:** 04 — Database

## Context

JalMaps needs a relational model for Indian administrative hierarchies, user-owned
wells, simulated sensor nodes, time-series readings, alerts, notification preferences,
external API credentials and audit events. Readings will grow over time, but the
current product has no ingestion load or retention requirement to justify partitioning.
Every table must be safe by default before role policy design begins.

## Decisions

- Use Supabase-managed Postgres with CLI migrations, a local seed and pgTAP tests.
- Store dimensions in metres, event times in `timestamptz`, localized administrative
  names as JSONB, and coordinates as latitude/longitude plus generated PostGIS geography.
- Use a bigint identity for append-only readings and audit events; use UUIDs for domain
  entities. Enforce unique `(node_id, recorded_at)` reading keys for retry-safe ingestion.
- Keep the `latest_reading` view security-invoker and add a B-tree index on
  `(node_id, recorded_at DESC)`, a GiST well-location index and focused ownership,
  area and alert-status indexes.
- Enable RLS on every table and define no policies in Phase 4. This is the required
  default-deny starting point, not the final application access policy.
- Persist only SHA-256 hashes for API keys; the schema rejects values that are not
  64-character lowercase hex digests.
- Leave readings unpartitioned. The unique key, ordering index and likely initial data
  volume do not yet establish a measurable need for partitioning. Revisit only after
  real row counts, query plans and retention requirements are available.

## Consequences

- Local database commands require Docker Desktop and the Supabase CLI dependency.
- The generated TS types are committed and checked against a clean local database in CI.
- The repository layer uses generated schema types plus Zod request validation.
- Deployed schema changes are forward-only; corrections should be new migrations.
- Phase 5 must define and test role-aware policies before user-facing database access.

## Rejected alternatives

- **Partition readings now:** adds uniqueness, migration and test complexity before there
  is evidence it improves the workload.
- **Store only latitude/longitude:** insufficient for efficient nearby-well operations;
  a generated geography point supports a spatial index without duplicating coordinates.
- **Add permissive placeholder RLS policies:** would create a temporary access surface
  that could be mistaken for production authorization.
