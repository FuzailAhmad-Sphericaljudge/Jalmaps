import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell } from "@/server/db/wells";
import { AlertRuleList } from "@/features/alerts/alert-rule-list";

export default async function WellAlertsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: wellId } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const t = await getTranslations({ locale, namespace: "alerts" });
  const client = await createServerComponentClient();

  let well;
  try {
    well = await getWell(client, wellId);
  } catch {
    notFound();
  }

  // Fetch existing rules for this well
  const { data: rules } = await client
    .from("alert_rules")
    .select("*")
    .eq("well_id", wellId)
    .order("created_at", { ascending: false });

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={`${well.name} - ${t("rules.title")}`} />

        <div className="mt-6">
          <AlertRuleList wellId={wellId} rules={rules || []} unit={current.profile.preferred_unit} />
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}

