import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { isAppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";

import { ProfileForm } from "../profile-form";

export default async function EditProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!isAppLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  const current = await requireUser(locale);
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-8">
      <Button asChild variant="outline" size="touch">
        <Link href="/account" locale={locale}>
          <ArrowLeft aria-hidden="true" />
          {t("title")}
        </Link>
      </Button>
      <header>
        <h1 className="text-3xl font-semibold">{t("profile")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profileDescription")}</p>
      </header>
      <section className="rounded-xl border bg-card p-5 sm:p-8">
        <ProfileForm
          locale={locale}
          initialName={current.profile.full_name}
          initialLocale={
            isAppLocale(current.profile.preferred_locale)
              ? current.profile.preferred_locale
              : locale
          }
          initialUnit={current.profile.preferred_unit}
        />
      </section>
    </main>
  );
}
