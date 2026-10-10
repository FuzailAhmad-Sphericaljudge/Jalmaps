import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { HistoryChart } from "@/components/jalmaps/HistoryChart";
import { HistoryStats } from "@/components/jalmaps/HistoryStats";
import { requireRole } from "@/server/auth";
import { isAppLocale } from "@/i18n/config";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const t = await getTranslations("history");
  const supabase = await createServerComponentClient();

  const [wellRes, alertRulesRes] = await Promise.all([
    supabase.from("wells").select("name, id").eq("id", id).single(),
    supabase
      .from("alert_rules")
      .select("threshold, severity")
      .eq("well_id", id)
      .eq("metric", "depth_to_water_m")
      .eq("enabled", true),
  ]);

  const { data: well, error } = wellRes;
  const alertRules = alertRulesRes.data || [];

  if (error || !well) {
    notFound();
  }

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("title", { name: well.name })} />
        <div className="mt-6 flex flex-col gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <HistoryChart wellId={id} alertRules={alertRules as any} />
          <HistoryStats wellId={id} />
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}
