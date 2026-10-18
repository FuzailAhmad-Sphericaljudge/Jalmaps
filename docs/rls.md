# Row-level security

RLS is enabled on every application table. Policies derive identity from
`auth.uid()` and authorization from the trusted `profiles.role` and
`profiles.admin_area_id` columns. Role and area changes are rejected by a
database trigger unless performed by an administrator. Anonymous users have no
application-table grants.

## Access matrix

| Table                | Farmer                      | Village admin             | Official                           | Insurer          | Admin                  |
| -------------------- | --------------------------- | ------------------------- | ---------------------------------- | ---------------- | ---------------------- |
| `profiles`           | Own row                     | Own and scoped rows       | Own and scoped rows                | Own row          | All rows               |
| `admin_areas`        | Read                        | Read                      | Read                               | Read             | Read and write         |
| `wells`              | Owned wells                 | Read/update assigned area | Read assigned area and descendants | No direct rows   | All access             |
| `nodes`              | Nodes for owned wells       | Read assigned area        | Read assigned area and descendants | No direct rows   | Read, without key hash |
| `readings`           | Readings for owned wells    | Read assigned area        | Read assigned area and descendants | No direct rows   | Read                   |
| `alert_rules`        | Manage own well rules       | Read assigned area        | Read assigned area and descendants | No direct rows   | All access             |
| `alerts`             | Read/update own well alerts | Read assigned area        | Read assigned area and descendants | No direct rows   | All access             |
| `notification_prefs` | Own rows                    | Own rows                  | Own rows                           | Own rows         | All access             |
| `api_keys`           | Own metadata                | Own metadata              | Own metadata                       | Own metadata     | All access             |
| `audit_log`          | No direct access            | No direct access          | No direct access                   | No direct access | Read                   |

Area scope includes the user's assigned area and every descendant, obtained by
the recursive `user_area_ids()` helper. Insurers have no direct row access,
including when they own a seeded well; aggregated insurer access belongs in a
later server-side API and must not weaken these table policies.

## Enforcement details

- `auth_role()`, `is_admin()`, `user_area_ids()`, `can_read_well()` and
  `can_manage_well()` are stable, restricted SQL helpers. They read the database
  profile rather than client-editable metadata or role claims in a JWT.
- `profiles.role`, `admin_area_id` and `deleted_at` cannot be changed by a
  non-admin client. Authenticated profile updates are restricted to the
  self-service fields used by profile editing; `onboarding_completed_at` is
  writable only by trusted server operations after hierarchy validation.
- `nodes.api_key_hash` and `api_keys.key_hash` are not included in client
  `SELECT` grants. Server export projections also omit both hashes.
- Readings are read-only to authenticated users and are visible only through a
  readable parent well. Inserts and mutations use trusted server operations.
- Authenticated clients cannot insert audit events. Account deletion records its
  audit event through the server-only service role; deletion cascades owned data
  and leaves the audit event with a null actor.
- The service-role Supabase client is marked server-only and has an import guard
  test preventing client components from depending on it.

## Verification

Run `pnpm db:start`, `pnpm db:reset`, and `pnpm db:test`. The 232-assertion pgTAP
suite asserts the five-role × ten-table × four-operation matrix and explicit
negative cases for cross-owner access, role escalation, credential columns and
reading writes. The schema and OTP limiter suites add 33 assertions, for 265 in
total; repository integration tests run against the same local stack. Schema
tests assert that RLS is enabled on every public table. A
deliberately weakened wells policy was verified to fail the matrix; the database
was reset afterward to restore migration-defined policy state. The database job
in GitHub Actions runs these checks and compares generated TypeScript types.

The original intended boundaries are retained in [the Phase 5 policy plan](./rls-plan.md).
