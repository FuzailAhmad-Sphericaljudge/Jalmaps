import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { WellImporter } from "@/features/wells/well-importer";

export default async function VillageWellImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "village_admin", "official", "admin");
  const t = await getTranslations({ locale, namespace: "wells" });

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("import.title")} description={t("import.maxRows")} />
        <WellImporter locale={locale} />
      </PageContainer>
    </ProtectedAppShell>
  );
}
