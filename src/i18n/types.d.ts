import type { EnglishMessages } from "./messages/registry";

/**
 * Compile-time message-key safety.
 *
 * Augmenting use-intl's `AppConfig` (which next-intl re-exports) with the
 * *inferred* shape of the English messages makes every `t("key")` across the
 * app type-checked against the real files in `src/i18n/messages/en/`: add a
 * key there and it becomes legal everywhere; remove or rename one and every
 * use fails compilation.
 */
declare module "use-intl" {
  interface AppConfig {
    Locale: (typeof import("./config").locales)[number];
    Messages: EnglishMessages;
  }
}

export {};
