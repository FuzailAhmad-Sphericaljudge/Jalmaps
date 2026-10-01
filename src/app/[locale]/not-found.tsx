import { redirect } from "@/i18n/navigation";
import { defaultLocale } from "@/i18n/config";

/**
 * Localized 404. Unknown paths under `/en/...` or `/hi/...` land here via the
 * `[locale]/[...rest]` catch-all; unprefixed unknowns are rewritten by the
 * proxy first. Redirecting to home keeps the user in their locale with a
 * friendly start page instead of a dead end.
 */
export default function LocaleNotFound() {
  // Preserve the active locale explicitly: not-found renders outside the
  // normal params flow, so pass the default as a safe fallback.
  redirect({ href: "/", locale: defaultLocale });
}
