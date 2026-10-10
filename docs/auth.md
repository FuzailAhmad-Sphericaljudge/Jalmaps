# Authentication

Phone one-time passwords are the primary sign-in method. Email magic links are
available for users who prefer email; Supabase Auth delivers local email to Mailpit,
not a real inbox. Email links and optional Google sign-in return through the
server-only `/api/auth/callback` handler.
Google OAuth is off by default and requires both provider configuration and
`NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` before the login UI exposes it.

## Local development

1. Start Docker and run `pnpm db:start` followed by `pnpm db:reset`.
2. Copy `API_URL`, `PUBLISHABLE_KEY` and `SECRET_KEY` from
   `pnpm exec supabase status -o env` into `.env.local` as
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_SITE_URL` to the app origin
   (default `http://127.0.0.1:3000`); hosted environments must set their canonical
   HTTPS origin and allow its `/api/auth/callback` URL in Supabase Auth.
3. Open `http://127.0.0.1:54324` for the local email inbox.
4. For seeded phone identities, enter a listed phone number and the local test OTP
   `123456`. These fixed test codes exist only in `supabase/config.toml`, which configures
   the local Supabase stack; never copy them into a hosted or production Auth project.

Seeded development accounts:

| Role            | Phone           | Email                            |
| --------------- | --------------- | -------------------------------- |
| Farmer          | `+919000000001` | `farmer.one@jalmaps.test`        |
| Farmer          | `+919000000002` | `farmer.two@jalmaps.test`        |
| Village admin   | `+919000000003` | `village.admin@jalmaps.test`     |
| Official        | `+919000000004` | `district.official@jalmaps.test` |
| Insurer         | `+919000000005` | `insurer@jalmaps.test`           |
| Admin           | `+919000000006` | `platform.admin@jalmaps.test`    |
| Onboarding test | `+919000000007` | `onboarding@jalmaps.test`        |

Seeded users are local fixtures with no passwords. Do not use these identities or
test codes on a hosted project.

The local Auth fixtures include both email and phone identities and use GoTrue's
digit-only phone storage format. JalMaps profile phone numbers remain E.164. The
Auth seed also provides GoTrue's default instance ID and empty token fields so
local passwordless lookups resolve the intended fixture instead of creating a
second identity.

## Account controls

The localized account page is available after onboarding. Users can update their
name, language and preferred unit, sign out, or download `jalmaps-data.json`.
`GET /api/account/export` returns only the current user's profile and related
records; node and API-key hashes are never selected for export. Account deletion
requires the in-app confirmation dialog and `DELETE /api/account/delete` with
`{ "confirm": true }`. The server records an audit event, signs out the current
session and deletes only that Auth user; owned data is removed by database
cascades while the audit event is retained. Deletion is irreversible.

After phone OTP verification, the browser performs a full navigation so
cookie-backed server route guards evaluate the new session before choosing
onboarding or the home page.

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
is subject to Auth's own limits and the application's persistent limiter. `POST /api/auth/otp`
accepts exactly one `{ "phone": "..." }` or `{ "email": "..." }` JSON field. Phones are
parsed as Indian numbers by default and converted to E.164; email addresses are trimmed and
lowercased before validation. A successful request returns `202 { "status": "accepted" }`
for either destination type, without revealing whether an account exists.

The application limiter allows at most **5 requests per normalized phone/email destination
per fixed one-hour window** and **20 per client IP per fixed one-hour window**. Both counters
are updated atomically in Postgres before calling Supabase Auth; attempts remain counted if
Auth delivery fails. A denied request returns `429 { "error": "rate_limited" }`. Limiter or
Auth failures fail closed with `503 { "error": "unavailable" }`; neither response contains
provider details. The limiter table has RLS enabled and no API-role table grants. Only the
server-side service role can execute its atomic RPC. It stores HMAC-SHA-256 identifiers,
not raw phone numbers or IP addresses, and opportunistically removes counters older than
24 hours. HMAC keys use the Supabase service-role key, so rotating that key resets continuity
of the application counters.

Local Supabase Auth is configured for a 5-second SMS resend interval so OTP browser
tests can be rerun quickly; the app-side one-hour destination/IP limits still apply.
Use a longer provider cooldown (at least 60 seconds) for hosted Auth.

The API accepts a single, valid `X-Forwarded-For` IP address only. On the supported Vercel
deployment, Vercel overwrites that header with the connecting client's public IP, preventing
client-supplied spoofed values; comma-separated proxy chains are rejected. Any deployment
behind another proxy must sanitize and overwrite this header with one trusted client address.
If the trusted header is absent or invalid, the API fails closed rather than using a
client-controlled fallback. Do not log request destinations, forwarded IPs, or their hashes.
CAPTCHA can be enabled later in Supabase Auth and attached to the OTP request as an extension
point.
