# ADR 0003: Database-backed role authorization

- **Status:** Accepted
- **Date:** 2026-10-01
- **Phase:** 05 — Authentication and roles

## Context

JalMaps has five application roles with different access to user, well and
administrative-area data. JWT metadata may be stale and client-editable user
metadata is untrusted. Database policies must therefore make their decisions
from an authoritative source and remain correct even when requests bypass the
Next.js UI.

## Decision

- Store the trusted role and administrative assignment in `public.profiles`.
- Do not copy authorization roles into JWT claims or accept a role from the
  browser. Server guards read the authenticated user's profile; RLS helpers
  read the same database row.
- Derive area scope recursively from the user's assigned `admin_area_id`.
- Protect changes to `role`, `admin_area_id` and `deleted_at` with a database
  trigger. Only an administrator may change those fields through authenticated
  SQL; trusted service-role operations are server-only.
- Enforce table access with RLS plus least-privilege column grants. In
  particular, client roles cannot select node or API-key credential hashes.

## Consequences

- Role changes take effect on the next database request without waiting for a
  JWT refresh.
- Authorization rules are enforced for direct Supabase access as well as
  application routes; UI route guards are convenience, not the security
  boundary.
- Profile reads used by server guards are subject to RLS. Privileged service
  access is limited to operations that explicitly require it.
- The complete role/table/operation matrix is exercised by pgTAP; changes to
  policies must update both the matrix expectations and [the RLS guide](../rls.md).

## Rejected alternatives

- **Role claims in JWTs:** introduce stale authorization after role changes and
  duplicate the source of truth.
- **Client metadata for role:** users can modify it and it is not an
  authorization boundary.
- **Application-only route checks:** direct PostgREST requests would bypass
  them.
