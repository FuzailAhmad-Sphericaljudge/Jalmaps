import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/server/supabase/middleware";

/**
 * Locale negotiation proxy (Next.js 16's renamed middleware) provided by
 * next-intl. Runs on every non-asset request and:
 *
 * 1. Serves `/en/...` and `/hi/...` locale-prefixed routes.
 * 2. Redirects unprefixed URLs to the negotiated locale: saved `NEXT_LOCALE`
 *    cookie first, then the `Accept-Language` header, then the default (`en`).
 * 3. Persists an explicit language choice to the cookie (so a reload — and the
 *    next visit — keeps it).
 * 4. Honours the pseudo-localisation toggle: `?pseudo=1` sets a session
 *    cookie, `?pseudo=0` clears it (see src/i18n/request.ts). The query
 *    parameter itself is left in the URL — harmless, and simpler than
 *    rewriting.
 */
const intlMiddleware = createMiddleware(routing);

const PSEUDO_COOKIE = "jalmaps-pseudo";

export default async function proxy(request: NextRequest) {
  const refreshedResponse = await refreshSupabaseSession(request);
  const response = intlMiddleware(request);

  for (const cookie of refreshedResponse.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }

  const pseudoParam = request.nextUrl.searchParams.get("pseudo");
  if (pseudoParam === "1") {
    response.cookies.set(PSEUDO_COOKIE, "1", { path: "/", sameSite: "lax" });
  } else if (pseudoParam === "0") {
    response.cookies.delete(PSEUDO_COOKIE);
  }

  return response;
}

export const config = {
  // Skip API routes, Next.js internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
