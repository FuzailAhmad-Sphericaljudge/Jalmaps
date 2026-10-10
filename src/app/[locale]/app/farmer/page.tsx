import { getTranslations, getFormatter } from "next-intl/server";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getFarmerWells, getTrend } from "@/server/db/wells";
import { classifyWellStatus } from "@/lib/status";
import { WaterGauge } from "@/components/jalmaps/WaterGauge";
import { WellTank } from "@/components/jalmaps/WellTank";
import { Sparkline } from "@/components/jalmaps/Sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ArrowRight, Battery, Wifi, Clock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function FarmerDashboard({ params }: { params: { locale: string } }) {
  const t = await getTranslations("home.dashboard");
  const format = await getFormatter();
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const wells = await getFarmerWells(supabase, user.id);

  if (!wells || wells.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-700">{t("empty_state")}</h2>
        <p className="text-slate-500">{t("onboarding")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-20">
      <h1 className="text-3xl font-bold text-slate-800">{t("title")}</h1>

      {/* Horizontal scroll strip for mobile */}
      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {wells.map(async (well) => {
          const node = well.nodes?.[0];
          const latestReading = node?.latest_reading?.[0];
          const status = classifyWellStatus(node, latestReading);

          let trendPoints: number[] = [];
          let trendState = "stable";
          if (well.id) {
            const trendData = await getTrend(supabase, well.id, 24 * 7); // 7 days
            if (trendData && trendData.length > 0) {
              trendPoints = trendData.map((d: { depth_to_water_m: number }) => d.depth_to_water_m);
              const first = trendPoints[0];
              const last = trendPoints[trendPoints.length - 1];
              if (last !== undefined && first !== undefined) {
                if (last - first > 0.5) trendState = "down";
                else if (first - last > 0.5) trendState = "up";
              }
            }
          }

          const depth = latestReading?.depth_to_water_m ?? 0;
          const sensorRange = node?.range_m ?? 100;
          const fillPercent = Math.max(0, 100 - (depth / sensorRange) * 100);

          return (
            <Card key={well.id} className="min-w-[300px] shrink-0 snap-center">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="max-w-[200px] truncate text-lg">
                    {well.name || "My Well"}
                  </CardTitle>
                  <Badge
                    variant={
                      status === "online"
                        ? "default"
                        : status === "fault"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {t(`status.${status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold tracking-tight text-slate-900">
                      {depth.toFixed(1)}
                      <span className="text-xl font-normal text-slate-500">{t("depth_unit")}</span>
                    </div>
                    <div className="text-sm text-slate-500">{t("depth_label")}</div>
                  </div>
                  <WellTank fillPercent={fillPercent} />
                </div>

                <WaterGauge level={sensorRange - depth} max={sensorRange} />

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  {trendState === "up" ? (
                    <ArrowUp className="h-4 w-4 text-emerald-500" />
                  ) : trendState === "down" ? (
                    <ArrowDown className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="flex-1">{t("trend", { trend: trendState })}</span>
                  <div className="h-8 w-16 text-blue-500">
                    <Sparkline data={trendPoints} />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-xs text-slate-500">
                  <div
                    className="flex items-center gap-1"
                    title={t("last_updated", {
                      time: latestReading?.recorded_at
                        ? format.relativeTime(new Date(latestReading.recorded_at))
                        : "-",
                    })}
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {latestReading?.recorded_at
                        ? format.relativeTime(new Date(latestReading.recorded_at))
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-1"
                      title={t("battery", {
                        percent: latestReading?.battery_v
                          ? Math.round((latestReading.battery_v / 4.2) * 100)
                          : 0,
                      })}
                    >
                      <Battery className="h-3 w-3" />
                      <span>
                        {t("battery", {
                          percent: latestReading?.battery_v
                            ? Math.round((latestReading.battery_v / 4.2) * 100)
                            : 0,
                        })}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      title={t("signal", { dbm: latestReading?.rssi ?? 0 })}
                    >
                      <Wifi className="h-3 w-3" />
                      <span>{t("signal", { dbm: latestReading?.rssi ?? 0 })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
