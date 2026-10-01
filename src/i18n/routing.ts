import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./config";

/**
 * Routing contract for next-intl:
 * - Every route lives under a locale prefix: `/en/...`, `/hi/...`.
 * - `NEXT_LOCALE` cookie is the saved user preference; the proxy persists a
 *   user's explicit choice to it automatically.
 * - Unknown-locale requests fall back to cookie → `Accept-Language` → default.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // `/` redirects to `/en` (or the detected locale) so URLs are always prefixed.
  localePrefix: "always",
});
