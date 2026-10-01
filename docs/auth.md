# Authentication

Phone one-time passwords are the primary sign-in method. Email OTP is available for
users who prefer email; Supabase Auth delivers local email to Mailpit, not a real inbox.
Google OAuth is off by default and requires both provider configuration and
`NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` before the login UI exposes it.

## Local development

1. Start Docker and run `pnpm db:start` followed by `pnpm db:reset`.
2. Copy `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` from `pnpm exec supabase status`
   into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   and `SUPABASE_SERVICE_ROLE_KEY`.
3. Open `http://127.0.0.1:54324` for the local email inbox.
4. For seeded phone identities, enter a listed phone number and the local test OTP
   `123456`. These fixed test codes exist only in `supabase/config.toml`, which configures
   the local Supabase stack; never copy them into a hosted or production Auth project.

Seeded development accounts:

| Role          | Phone           | Email                            |
| ------------- | --------------- | -------------------------------- |
| Farmer        | `+919000000001` | `farmer.one@jalmaps.test`        |
| Farmer        | `+919000000002` | `farmer.two@jalmaps.test`        |
| Village admin | `+919000000003` | `village.admin@jalmaps.test`     |
| Official      | `+919000000004` | `district.official@jalmaps.test` |
| Insurer       | `+919000000005` | `insurer@jalmaps.test`           |
| Admin         | `+919000000006` | `platform.admin@jalmaps.test`    |

Seeded users are local fixtures with no passwords. Do not use these identities or
test codes on a hosted project.

## Real SMS provider (later deployment setup)

No production SMS provider or credential is included in the repository. Before enabling
phone sign-in on a hosted Supabase project, configure its Auth SMS provider (for example
Twilio Verify) in the Supabase dashboard or deployment secret manager; supply credentials
through protected environment secrets, set a localized OTP template, and configure sender
registration and delivery limits for the target region. Keep local `[auth.sms.test_otp]`
values out of production configuration. Test deliverability, resend limits, number
normalization, and abuse monitoring before launch.

## Session and abuse protections

Supabase Auth owns the session and rotates refreshed tokens in secure HTTP-only cookies;
application code must not place access tokens or role values in localStorage. OTP sending
is subject to Auth per-IP rate limits and the application phone/IP limiter. Error responses
are intentionally generic so sign-in does not disclose whether a phone or email exists.
CAPTCHA can be enabled later in Supabase Auth and attached to the OTP request as an
extension point.
