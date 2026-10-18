import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings, Plus } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell } from "@/server/db/wells";
import { getAdviceForWell } from "@/server/db/advice";
import { getNodeConnectionState } from "@/lib/wells/status";
import { StatusPill } from "@/components/jalmaps/status-pill";
import { LiveLatestReading } from "@/features/wells/live-latest-reading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdviceCard } from "@/features/advisory/advice-card";
import { WellInsightsTab, type WellInsightsData } from "@/features/wells/well-insights-tab";
import { ReadAloud } from "@/components/jalmaps/read-aloud";
import { formatNumberForSpeech } from "@/lib/speech/formatters";

export default async function WellDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: wellId } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const t = await getTranslations({ locale, namespace: "wells" });
  const client = await createServerComponentClient();

  let well;
  try {
    well = await getWell(client, wellId);
  } catch {
    notFound();
  }

  // Find active node
  const nodes = (well.nodes || []) as Array<{
    id: string;
    status: string;
    last_seen_at: string | null;
    range_m: number | null;
    battery_v: number | null;
    signal_rssi: number | null;
    hang_depth_m: number | null;
  }>;
  const activeNode = nodes.find((n) => n.status !== "retired" && n.status !== "fault");

  let latestReading = null;
  if (activeNode) {
    const { data } = await client
      .from("latest_reading")
      .select("*")
      .eq("node_id", activeNode.id)
      .maybeSingle();
    latestReading = data;
  }

  const { advice, facts } = await getAdviceForWell(client, wellId);

  // Fetch aquifer insights
  const { data: wellInsightRow } = await client
    .from("well_insights")
    .select("*")
    .eq("well_id", wellId)
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  const connectionState = activeNode ? getNodeConnectionState(activeNode) : "no_node";
  const unit = current.profile.preferred_unit;

  const tSpeech = await getTranslations({ locale, namespace: "speech" });
  let speechText = "";
  if (latestReading && latestReading.depth_to_water_m !== null) {
    const depthVal =
      unit === "ft" ? latestReading.depth_to_water_m * 3.28084 : latestReading.depth_to_water_m;
    const spokenUnit = unit === "ft" ? "feet" : "metres"; // Basic translation handled by TTS engine or i18n
    const statusText = t(`nodeStatus.${connectionState}` as Parameters<typeof t>[0]);
    speechText += tSpeech("well_status", {
      depth: formatNumberForSpeech(depthVal, locale),
      unit: spokenUnit,
      status: statusText,
    });
  }

  // Find critical alert if any? The phase says "Speakable text... situation is ok".
  // Let's just add the top advice rule if it exists
  if (advice && advice.length > 0) {
    const topAdvice = advice[0];
    const tAdvisory = await getTranslations({ locale, namespace: "advisory" });
    const adviceString = topAdvice
      ? tAdvisory(`rules.${topAdvice.adviceKey}` as Parameters<typeof tAdvisory>[0])
      : "";
    if (adviceString) {
      speechText += " " + tSpeech("advice", { advice: adviceString });
    }
  }

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader
          title={well.name}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/app/farmer/wells/${well.id}/alerts`}>{t("alerts")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/app/farmer/wells/${well.id}/settings`}>
                  <Settings className="mr-2 h-5 w-5" />
                  {t("detail.settings")}
                </Link>
              </Button>
            </div>
          }
        />

        {speechText && (
          <div className="mt-4 mb-2">
            <ReadAloud text={speechText} locale={locale} />
          </div>
        )}

        <Tabs defaultValue="overview" className="mt-6 w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              {t("detail.overview", { fallback: "Overview" })}
            </TabsTrigger>
            <TabsTrigger value="insights">
              {t("detail.insights", { fallback: "Aquifer health" })}
            </TabsTrigger>
            <TabsTrigger value="details">
              {t("detail.moreDetails", { fallback: "More details" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <AdviceCard wellId={wellId} advice={advice} facts={facts} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <WellInsightsTab
              insights={
                wellInsightRow
                  ? ({
                      isSufficient: wellInsightRow.is_sufficient,
                      healthScore: wellInsightRow.health_score,
                      healthBand: wellInsightRow.health_band as WellInsightsData["healthBand"],
                      seasonal: wellInsightRow.seasonal as unknown as WellInsightsData["seasonal"],
                      monsoon: wellInsightRow.monsoon as unknown as WellInsightsData["monsoon"],
                      recharge: wellInsightRow.recharge as unknown as WellInsightsData["recharge"],
                      pumping: wellInsightRow.pumping as unknown as WellInsightsData["pumping"],
                    } as WellInsightsData)
                  : null
              }
            />
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Node Status */}
              <div className="flex flex-col items-center space-y-4 rounded-xl border bg-card p-6 text-center">
                <h3 className="text-lg font-semibold">{t("node.title")}</h3>

                {activeNode ? (
                  <>
                    <StatusPill
                      status={
                        connectionState === "online"
                          ? "good"
                          : connectionState === "offline"
                            ? "offline"
                            : "warning"
                      }
                      label={t(
                        `nodeStatus.${connectionState}` as "online" | "offline" | "never_reported",
                      )}
                    />

                    <div className="mt-4 grid w-full grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">{t("node.battery")}</div>
                        <div className="font-medium">
                          {activeNode.battery_v ? `${activeNode.battery_v} V` : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">{t("node.signal")}</div>
                        <div className="font-medium">
                          {activeNode.signal_rssi ? `${activeNode.signal_rssi} dBm` : "-"}
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="mt-2 w-full" asChild>
                      <Link href={`/app/farmer/wells/${well.id}/node`}>{t("detail.settings")}</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="my-4 text-muted-foreground">{t("node.noNode")}</div>
                    <Button className="w-full" asChild>
                      <Link href={`/app/farmer/wells/${well.id}/node/new`}>
                        <Plus className="mr-2 h-5 w-5" />
                        {t("node.attachNode")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Latest Reading */}
              <LiveLatestReading
                wellId={wellId}
                initialReading={latestReading}
                activeNode={activeNode}
                unit={unit}
              />
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </ProtectedAppShell>
  );
}
