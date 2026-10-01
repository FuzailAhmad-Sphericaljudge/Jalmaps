import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isAppLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

/**
 * Localized placeholder home page. All copy comes from the `home` namespace;
 * the ICU plural demonstrates number-aware wording per locale.
 */
export default async function HomePage({ params }: Props) {
  const { locale: requested } = await params;
  if (!isAppLocale(requested)) notFound();
  const locale = requested;

  setRequestLocale(locale);

  const t = await getTranslations("home");
  // ICU plural: wording adapts to the count per locale.
  const levels = t("welcome.levels", { count: 2 });

  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-lg text-foreground-muted">{t("description")}</p>
      <p className="max-w-md text-base text-foreground-muted">{t("welcome.body")}</p>
      <p className="text-sm font-medium text-foreground-muted" data-testid="wells-count">
        {levels}
      </p>
      <Link
        href="/dev/design-system"
        className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {t("welcome.cta")}
      </Link>
    </main>
  );
}
