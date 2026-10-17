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

  const [well, members, t, cropsRes, wellCropRes] = await Promise.all([
    getWell(client, id).catch(() => null),
    listWellMembers(client, id).catch(() => []),
    getTranslations({ locale, namespace: "wells" }),
    client.from("crop_profiles").select("id, name_en, name_hi"),
    client.from("well_crops").select("crop_id, sowing_date").eq("well_id", id).maybeSingle(),
  ]);

  if (!well || well.owner_id !== user.id) {
    notFound();
  }

  const availableCrops = cropsRes.data || [];
  const wellCrop = wellCropRes.data || null;

  return (
    <PageContainer>
      <PageHeader title={`${t("detail.settings")} - ${well.name}`} />
      <div className="py-6">
        <WellSettings
          well={well}
          members={members}
          availableCrops={availableCrops}
          wellCrop={wellCrop}
        />
      </div>
    </PageContainer>
  );
}
