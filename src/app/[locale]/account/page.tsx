import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Download, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isAppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";

import { DeleteAccountButton } from "./delete-account-button";
import { signOut } from "./actions";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!isAppLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  await requireUser(locale);
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </header>

      <section className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold">{t("profile")}</h2>
        <p className="text-muted-foreground">{t("profileDescription")}</p>
        <Button asChild size="touch">
          <Link href="/account/profile" locale={locale}>
            <UserRound aria-hidden="true" />
            {t("profile")}
          </Link>
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold">{t("export")}</h2>
        <p className="text-muted-foreground">{t("exportDescription")}</p>
        <Button asChild size="touch" variant="outline">
          <a href="/api/account/export" download>
            <Download aria-hidden="true" />
            {t("exportButton")}
          </a>
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="text-xl font-semibold">{t("deleteAccount")}</h2>
        <p className="text-muted-foreground">{t("deleteDescription")}</p>
        <DeleteAccountButton />
      </section>

      <form action={signOut.bind(null, locale)}>
        <Button type="submit" size="touch" variant="outline" className="w-full">
          <LogOut aria-hidden="true" />
          {t("signOut")}
        </Button>
      </form>
    </main>
  );
}
