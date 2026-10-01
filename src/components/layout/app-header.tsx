import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Wordmark } from "@/components/jalmaps/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Link } from "@/i18n/navigation";

/**
 * App header on every page: brand, language switcher and theme toggle.
 * Includes a skip-to-content link for keyboard users.
 */
export async function AppHeader() {
  const t = await getTranslations();

  return (
    <>
      <a
        href="#main"
        className="focus:z-toast sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        {t("common.skipToContent")}
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="inline-flex items-center rounded-md">
            <Wordmark text={t("common.appName")} />
          </Link>
          <span className="flex-1" />
          <LanguageSwitcher />
          <ThemeToggle lightLabel={t("common.theme.light")} darkLabel={t("common.theme.dark")} />
        </div>
      </header>
    </>
  );
}
