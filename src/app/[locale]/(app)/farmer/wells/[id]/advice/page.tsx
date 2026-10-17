import { requireRole } from "@/server/auth";
import { isAppLocale } from "@/i18n/config";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell } from "@/server/db/wells";
import { getAdviceForWell } from "@/server/db/advice";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { getTranslations } from "next-intl/server";
import { AdviceCard } from "@/features/advisory/advice-card";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";

export default async function WellAdvicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const client = await createServerComponentClient();

  const [well, t] = await Promise.all([
    getWell(client, id).catch(() => null),
    getTranslations({ locale, namespace: "advisory" }),
  ]);

  if (!well || well.owner_id !== current.user.id) {
    notFound();
  }

  const { advice, facts } = await getAdviceForWell(client, id);

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={`${t("title")} - ${well.name}`} />
        <div className="mx-auto max-w-2xl py-6">
          <AdviceCard wellId={id} advice={advice} facts={facts} />
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}
