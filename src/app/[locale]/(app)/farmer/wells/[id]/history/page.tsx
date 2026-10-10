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

  const [wellRes, alertRulesRes, allWellsRes, alertsRes] = await Promise.all([
    supabase.from("wells").select("name, id").eq("id", id).single(),
    supabase
      .from("alert_rules")
      .select("threshold, severity")
      .eq("well_id", id)
      .eq("metric", "depth_to_water")
      .eq("enabled", true),
    supabase.from("wells").select("id, name").order("name"),
    supabase
      .from("alerts")
      .select("id, metric, severity, status, message_key, triggered_at")
      .eq("well_id", id)
      .eq("status", "resolved"),
  ]);

  const { data: well, error } = wellRes;
  const alertRules = alertRulesRes.data || [];
  const otherWells = (allWellsRes.data || []).filter((w) => w.id !== id);
  const events = (alertsRes.data || []).map((a) => ({
    type: "alert" as const,
    timestamp: a.triggered_at,
    severity: a.severity,
    message: a.message_key,
  }));

  if (error || !well) {
    notFound();
  }

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("title", { name: well.name })} />
        <div className="mt-6 flex flex-col gap-4">
          <HistoryChart
            wellId={id}
            alertRules={alertRules}
            otherWells={otherWells}
            events={events}
          />
          <HistoryStats wellId={id} />
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}
