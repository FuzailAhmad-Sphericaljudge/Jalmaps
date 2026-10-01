import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isAppLocale } from "./config";
import { loadMessages } from "./messages/registry";
import { routing } from "./routing";

/**
 * Per-request i18n configuration. The locale arrives from the URL segment
 * (`/en/...`, `/hi/...`) — the proxy/routing has already validated it against
 * the cookie → Accept-Language → default preference chain.
 *
 * `requestLocale` is unvalidated input; fall back to the routing default for
 * anything unexpected. Unknown locale URLs are redirected by the proxy.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : defaultLocale;
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    // Formats defaults (numbers, dates) come from the routing locale;
    // formatting helpers refine with en-IN/hi-IN where relevant.
    timeZone: "Asia/Kolkata",
  };
});

// Re-exported for convenience so server components import from one module.
export { routing };
