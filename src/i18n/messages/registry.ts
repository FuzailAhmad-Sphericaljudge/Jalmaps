/**
 * Messages registry — the single place that knows which namespace files exist.
 *
 * `loadMessages` aggregates the per-namespace files under
 * `src/i18n/messages/{locale}/`; the inferred shape of the English branch
 * flows into `AppConfig` (see `src/i18n/types.d.ts`), which is what `t("…")`
 * is checked against at compile time. Adding a key to any file here
 * automatically extends the allowed keys; missing translations in other
 * locales fail the `scripts/check-i18n.ts` CI gate instead.
 *
 * Note: the `satisfies` clause (not an annotated return type) keeps the JSON
 * inference intact — annotating would collapse it to `Record<string, unknown>`
 * and turn every `t()` key into `never`.
 */
import type { AppLocale } from "../config";

const loaders = {
  en: async () => ({
    common: (await import("./en/common.json")).default,
    auth: (await import("./en/auth.json")).default,
    account: (await import("./en/account.json")).default,
    onboarding: (await import("./en/onboarding.json")).default,
    home: (await import("./en/home.json")).default,
    gallery: (await import("./en/gallery.json")).default,
    settings: (await import("./en/settings.json")).default,
    shell: (await import("./en/shell.json")).default,
    errors: (await import("./en/errors.json")).default,
  }),
  hi: async () => ({
    common: (await import("./hi/common.json")).default,
    auth: (await import("./hi/auth.json")).default,
    account: (await import("./hi/account.json")).default,
    onboarding: (await import("./hi/onboarding.json")).default,
    home: (await import("./hi/home.json")).default,
    gallery: (await import("./hi/gallery.json")).default,
    settings: (await import("./hi/settings.json")).default,
    shell: (await import("./hi/shell.json")).default,
    errors: (await import("./hi/errors.json")).default,
  }),
  // `satisfies` ensures every locale in `config.ts` has a loader while
  // preserving the inferred message types above.
} satisfies Record<AppLocale, () => Promise<unknown>>;

/** English message shape — the source of truth for translation key types. */
export type EnglishMessages = Awaited<ReturnType<(typeof loaders)["en"]>>;

/** Load all merged namespaces for a locale. Server-side only. */
export async function loadMessages(locale: AppLocale) {
  const loader = loaders[locale];
  if (!loader) {
    throw new Error(`No message loader registered for locale "${locale}".`);
  }
  return loader();
}
