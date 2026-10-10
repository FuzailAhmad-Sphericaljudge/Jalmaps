import { requireRole } from "@/server/auth";
import { isAppLocale } from "@/i18n/config";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell, listWellMembers } from "@/server/db/wells";
import { WellSettings } from "@/features/wells/well-settings";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { getTranslations } from "next-intl/server";

export default async function WellSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  const { user } = await requireRole(locale, "farmer");
  const client = await createServerComponentClient();

  const [well, members, t] = await Promise.all([
    getWell(client, id).catch(() => null),
    listWellMembers(client, id).catch(() => []),
    getTranslations({ locale, namespace: "wells" }),
  ]);

  if (!well || well.owner_id !== user.id) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader title={`${t("detail.settings")} - ${well.name}`} />
      <div className="py-6">
        <WellSettings well={well} members={members} />
      </div>
    </PageContainer>
  );
}
