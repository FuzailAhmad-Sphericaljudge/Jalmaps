import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isAppLocale } from "./config";
import { loadMessages } from "./messages/registry";
import { pseudoMessages } from "./pseudo";
import { routing } from "./routing";

/** Cookie set by the proxy when a user visits with `?pseudo=1`. */
export const PSEUDO_COOKIE = "jalmaps-pseudo";

/**
 * Per-request i18n configuration. The locale arrives from the URL segment
 * (`/en/...`, `/hi/...`) — the proxy/routing has already validated it against
 * the cookie → Accept-Language → default preference chain.
 *
 * Pseudo-localisation applies the accented ~40%-expanded transform to the
 * English messages when enabled (env flag app-wide, or `?pseudo=1` which sets
 * a session cookie), exposing clipped layouts and hard-coded strings.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : defaultLocale;
  let messages = await loadMessages(locale);

  const pseudo =
    process.env.NEXT_PUBLIC_PSEUDO_LOCALE === "1" ||
    (await cookies()).get(PSEUDO_COOKIE)?.value === "1";
  if (pseudo && locale === "en") {
    messages = pseudoMessages(messages);
  }

  return {
    locale,
    messages,
    timeZone: "Asia/Kolkata",
  };
});

// Re-exported for convenience so server components import from one module.
export { routing };
