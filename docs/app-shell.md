# Application shell

The signed-in shell lives in the `(app)` route group under
`src/app/[locale]/(app)/`. Its role landing paths are `/farmer`, `/village`,
`/official`, `/insurer`, and `/admin`; the shared preferences page is
`/app/settings`. Authentication, profile and onboarding routes remain outside
this shell. Each role has an explicit route folder and a shared server-rendered
placeholder component that checks the matching trusted profile role. Nested
navigation destinations use role-specific catch-all pages.

## Add a page

1. Add the page under `src/app/[locale]/(app)/` and keep it server-rendered
   unless it needs client interaction.
2. Use `PageContainer`, `PageHeader`, `Section`, and `Breadcrumbs` for consistent
   spacing, headings and route context.
3. Add loading and expected-error UI using the translated states in the shell.
   Do not fetch application data in a route handler or shell component.
4. Add English and Hindi messages in matching JSON namespace files and run
   `pnpm check`.

## Add a navigation destination

Add a `NavigationItem` to `src/features/navigation/nav-config.ts`: choose a
stable `id`, an existing or new translated `labelKey`, a Lucide icon, a locale-
independent `href`, allowed trusted roles and an `order`. Use order `0` through
`4` for the farmer's five mobile destinations; entries at `90` or higher are
desktop-only. Add the localized key to both `shell.json` files and extend the
navigation tests for affected roles.

## Preferences and shell behavior

Language and unit are saved to the user's `profiles` row. Text scale and theme
are also stored in that row for cross-device persistence, and mirrored to
first-party cookies for immediate application before the page paints on later
visits. Sidebar collapsed state is a device-local cookie. The system theme
follows `prefers-color-scheme`; reduced-motion users are not forced through
sidebar animations. Notification count remains zero until the notification
feature is implemented.

## Local verification

```bash
pnpm db:reset
pnpm db:test
pnpm check
pnpm build
pnpm test:e2e
```

Seeded local Auth users use OTP `123456`. Use only these fixture users and codes
with the local Supabase stack.

To regenerate the eight committed design previews after an intentional visual
change, start and reset local Supabase, then run in PowerShell:

```powershell
$env:JALMAPS_CAPTURE_PREVIEWS = "1"
pnpm exec playwright test e2e/app-shell-preview.spec.ts
```
