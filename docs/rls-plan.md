# Row-level security plan (Phase 5)

## Phase 4 baseline

RLS is enabled on every application table. No policies are defined, so requests made
with `anon` or `authenticated` roles cannot read or mutate rows. The local
`service_role` bypass is server-only and must never be exposed to clients. A pgTAP test
checks both that every public table has RLS enabled and that no policy currently widens
access.

## Intended policy matrix

Policies must be based on verified `auth.uid()` and trusted database state, not client
claims supplied in request payloads. Scope inheritance should be implemented with
reviewed helper functions to avoid duplicating hierarchy traversal.

| Role          | Intended access (subject to Phase 5 design review)                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Farmer        | Read own profile, wells they own, their nodes/readings, alerts for those wells and their notification preferences. Update only safe profile preferences and permitted well fields.           |
| Village admin | Read wells and alert summaries within assigned village scope; acknowledge/resolution actions only within that scope. No access to credentials or unrestricted audit records.                 |
| Official      | Read aggregated wells/readings/alerts within explicitly assigned administrative scope; no access to API-key hashes or private contact destinations.                                          |
| Insurer       | Read only authorized coverage and historical observation data; no profile contact details, node credentials or audit internals. Scoped API keys are enforced server-side in addition to RLS. |
| Admin         | Explicit operational access through trusted server-side paths. Do not grant browser clients broad administrative access merely because a profile says `admin`.                               |

## Phase 5 checklist

- Specify per-table `SELECT`, `INSERT`, `UPDATE` and `DELETE` policies independently.
- Prevent users from changing their own role or administrative area through a profile update.
- Test cross-village and cross-district isolation with authenticated JWTs and negative
  cases for every role.
- Keep `api_keys` and `audit_log` inaccessible through ordinary browser clients unless
  a concrete use case and least-privilege policy are approved.
- Re-test `latest_reading` under invoker security after policies are introduced.
