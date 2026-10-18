# Phase 05 — Authentication and roles

- **Status:** Implemented and locally verified
- **Branching:** Worked directly on `main` as required by this phase
- **Date:** 2026-10-01

## Delivered

- Added cookie-aware Supabase clients for browser, server components, route
  handlers and session refresh; the service-role client is server-only.
- Configured local phone test OTP, local email delivery, optional Google OAuth
  (off by default), and persistent HMAC-keyed OTP destination/IP limits.
- Added Auth-user profile creation, trusted role/area helpers, protected
  privileged profile fields and role-aware RLS policies for all ten tables.
- Added the five-role/table/operation pgTAP matrix, sensitive-column and
  negative-access tests, plus Auth seed-fixture assertions.
- Implemented locale-aware server guards, phone/email login, callback handling,
  the seven-step onboarding wizard and localized 403 page.
- Added profile editing, sign-out, private JSON export and confirmed account
  deletion with audit logging and owner-data cascades.
- Added Playwright flows for OTP/onboarding accessibility, account export and
  credential omission, profile update, sign-out and deletion.
- Documented the role model in [the RLS guide](../rls.md) and
  [ADR 0003](../adr/0003-role-authorization.md).

## Decisions and trade-offs

- Authorization reads trusted profile rows rather than JWT role claims; role
  changes therefore take effect without token refresh.
- Local Auth fixtures include the default Auth instance ID, non-null token
  strings and phone/email identities. Phone values follow local GoTrue's
  digit-only storage format while JalMaps profile phone values remain E.164.
- Account deletion uses the Auth admin API after recording an audit event; a
  migration cascades user-owned records and detaches the retained audit actor.
- Real SMS delivery, CAPTCHA configuration, insurer aggregate endpoints and
  admin user management remain out of scope.

## Local verification

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm check
pnpm build
pnpm test:e2e
```

Local seeded identities use OTP `123456`; see [the auth guide](../auth.md) for
phone numbers, credentials and hosted SMS-provider setup. The E2E workflow
starts and seeds Supabase automatically in CI. Do not use local OTP codes or
fixture identities in a hosted environment.

## Phase 6 / deployment follow-up

- Configure and manually deliver a real SMS provider in the hosted Supabase
  project; verify sender registration, regional delivery and abuse monitoring.
- Decide whether to enable CAPTCHA and establish production OTP/session limits.
- Review account-deletion retention and legal requirements before launch.
- Build insurer aggregates and admin account-management UI only in their
  planned later phases.
