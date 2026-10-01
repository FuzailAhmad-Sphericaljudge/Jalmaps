import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale negotiation proxy (Next.js 16's renamed middleware) provided by
 * next-intl. Runs on every non-asset request and:
 *
 * 1. Serves `/en/...` and `/hi/...` locale-prefixed routes.
 * 2. Redirects unprefixed URLs to the negotiated locale: saved `NEXT_LOCALE`
 *    cookie first, then the `Accept-Language` header, then the default (`en`).
 * 3. Persists an explicit language choice to the cookie (so a reload — and the
 *    next visit — keeps it).
 *
 * The proxy has no access to the Next.js module graph: import only
 * environment-independent, edge-safe code here (`@/i18n/*` config modules
 * qualify; `loadMessages` and node-only code do not).
 */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
