import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { isAppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

export default async function ForbiddenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center"
    >
      <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
        <ShieldAlert aria-hidden="true" className="size-12 text-primary" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t("forbiddenCode")}
        </p>
        <h1 className="text-3xl font-semibold">{t("forbiddenTitle")}</h1>
        <p className="text-muted-foreground">{t("forbiddenDescription")}</p>
        <Button asChild size="touch" className="mt-2">
          <Link href="/" locale={locale}>
            {t("goHome")}
          </Link>
        </Button>
      </section>
    </main>
  );
}
