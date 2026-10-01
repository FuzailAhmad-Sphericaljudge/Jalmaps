/**
 * Supported locales — the single source of truth for JalMaps i18n.
 *
 * Adding a language is a config + message-file change only:
 *   1. Add the code here (e.g. `"ta"` for Tamil).
 *   2. Create `src/i18n/messages/{code}/` with the same namespaces as `en/`.
 *   3. Add a native label + Devanagari-style font mapping if a new script is
 *      needed (see `src/i18n/fonts.ts`).
 *
 * Everything else (routing, detection, switching, typing, checks) derives from
 * this list. Keep codes lowercase BCP-47 language tags.
 */
export const locales = ["en", "hi"] as const;

export type AppLocale = (typeof locales)[number];

/** Locale served at `/en` when no preference is known. */
export const defaultLocale: AppLocale = "en";

/**
 * Locale used for number/date formatting. Kept separate from the routing
 * locale so Hindi can format with `hi-IN` conventions while the URL prefix
 * stays `hi`.
 */
export const localeToFormatLocale: Record<AppLocale, string> = {
  en: "en-IN",
  hi: "hi-IN",
};

/** Native language names for switchers — never translated. */
export const localeNativeNames: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** Timezone all date/relative formatting defaults to (India Standard Time). */
export const defaultTimeZone = "Asia/Kolkata";

export function isAppLocale(candidate: unknown): candidate is AppLocale {
  return locales.includes(candidate as AppLocale);
}
