# Row-level security plan (Phase 5)

This file records the intended Phase 5 access boundaries. They are implemented
and tested; see the current enforcement details and verification instructions in
[docs/rls.md](./rls.md).

RLS is enabled on every application table. Policies use `auth.uid()` plus the
trusted `profiles.role` and `profiles.admin_area_id` values; role and area changes
are rejected by a database trigger unless the request is an admin operation.
Anonymous users receive no application-table grants. The server-only service-role
client bypasses RLS and must never be imported by client code.

## Implemented access boundaries

| Table                | Farmer                             | Village admin              | Official                                   | Insurer                   | Admin                           |
| -------------------- | ---------------------------------- | -------------------------- | ------------------------------------------ | ------------------------- | ------------------------------- |
| `profiles`           | Own row                            | Own and scoped rows        | Own and scoped rows                        | Own row                   | All rows                        |
| `admin_areas`        | Read                               | Read                       | Read                                       | Read                      | Read and write                  |
| `wells`              | Owned wells                        | Read/update assigned area  | Read assigned area and descendants         | No direct access          | All access                      |
| `nodes`              | Nodes of owned wells               | Read assigned area         | Read assigned area and descendants         | No direct access          | Read, excluding credential hash |
| `readings`           | Readings for owned wells           | Read assigned area         | Read assigned area and descendants         | No direct access          | Read                            |
| `alert_rules`        | Manage rules for owned wells       | Read assigned area         | Read assigned area and descendants         | No direct access          | All access                      |
| `alerts`             | Read/update alerts for owned wells | Read only in assigned area | Read only in assigned area and descendants | No direct access          | All access                      |
| `notification_prefs` | Own rows                           | Own rows                   | Own rows                                   | Own rows                  | All access                      |
| `api_keys`           | Own key metadata and keys          | Own key metadata and keys  | Own key metadata and keys                  | Own key metadata and keys | All access                      |
| `audit_log`          | No direct access                   | No direct access           | No direct access                           | No direct access          | Read                            |

Node `api_key_hash` and API key `key_hash` are excluded from authenticated
`SELECT` grants. Reading insertion and mutation are restricted to trusted server
operations. Audit-log writes are not granted to authenticated clients.

Area scope includes the profile's assigned area and all descendant areas. Insurers
have no direct row access in this phase; scoped aggregate access is a later server
API concern and must not be implemented by weakening table policies.

## Verification

`pnpm db:reset` applies the policies and seeds local role fixtures.
`pnpm db:test` runs a 5-role x 10-table x 4-operation pgTAP matrix (200 assertions),
additional checks for RLS coverage, sensitive columns, privileged profile fields,
and forbidden reading writes, plus repository integration tests. A local-only
weakened wells policy was also tested and caused the matrix to fail; resetting the
database restored the migration-defined policies and the passing suite.
