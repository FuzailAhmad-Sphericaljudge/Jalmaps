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
import { getNodeConnectionState } from "@/lib/wells/status";
import { StatusPill } from "@/components/jalmaps/status-pill";
import { LiveLatestReading } from "@/features/wells/live-latest-reading";
import { Button } from "@/components/ui/button";

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
  // The 'nodes' from getWell is an array
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

  const connectionState = activeNode ? getNodeConnectionState(activeNode) : "no_node";
  const unit = current.profile.preferred_unit;

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader
          title={well.name}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/app/farmer/wells/${well.id}/alerts`}>
                  {t("alerts")}
                </Link>
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

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </PageContainer>
    </ProtectedAppShell>
  );
}
