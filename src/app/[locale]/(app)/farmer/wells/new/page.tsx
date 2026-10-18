import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { WellWizard } from "@/features/wells/well-wizard";

export default async function NewWellPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");

  const t = await getTranslations({ locale, namespace: "wells" });

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("newWellTitle")} />
        <WellWizard
          locale={locale}
          defaultAdminAreaId={current.profile.admin_area_id ?? ""}
          ownerId={current.profile.id}
          unitPreference={current.profile.preferred_unit}
        />
      </PageContainer>
    </ProtectedAppShell>
  );
}
