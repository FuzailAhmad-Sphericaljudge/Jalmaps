"use client";

import { useQuery } from "@tanstack/react-query";
import { Droplets } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWellRealtime } from "@/lib/realtime/use-well-realtime";
import { WaterGauge } from "@/components/jalmaps/water-gauge";
import { LiveBadge } from "@/components/jalmaps/live-badge";
import { ValueHighlight } from "@/components/jalmaps/value-highlight";
import { StaleBanner } from "@/components/jalmaps/stale-banner";

export function LiveLatestReading({
  wellId,
  initialReading,
  activeNode,
  unit,
}: {
  wellId: string;
  initialReading: { recorded_at: string; depth_to_water_m: number | null } | null;
  activeNode: {
    last_seen_at?: string | null;
    reporting_interval_sec?: number | null;
    hang_depth_m?: number | null;
  } | null;
  unit: string;
}) {
  const t = useTranslations("wells");

  // Connect to realtime
  const { connectionState } = useWellRealtime(wellId);

  const { data: reading } = useQuery({
    queryKey: ["latest_reading", wellId],
    queryFn: () => initialReading, // Realtime updates will merge into this cache key
    initialData: initialReading,
    staleTime: Infinity, // never stale on its own, realtime manages it
  });

  return (
    <div className="relative flex flex-col items-center justify-center space-y-6 rounded-xl border bg-card p-6">
      <div className="absolute top-4 right-4">
        <LiveBadge state={connectionState} />
      </div>

      <h3 className="text-lg font-semibold">{t("detail.lastReading")}</h3>

      {activeNode && (
        <div className="w-full">
          <StaleBanner
            lastSeenAt={reading?.recorded_at || activeNode.last_seen_at}
            reportingIntervalSec={activeNode.reporting_interval_sec || 300}
          />
        </div>
      )}

      {reading ? (
        <>
          <WaterGauge
            value={reading.depth_to_water_m ?? 0}
            min={0}
            max={Number(activeNode?.hang_depth_m) || 100}
            name={t("detail.depth")}
            valueText={`${reading.depth_to_water_m}`}
            className="h-32 w-32"
          />
          <div className="text-center">
            <ValueHighlight value={reading.depth_to_water_m} className="rounded px-2">
              <div className="text-3xl font-bold">
                {reading.depth_to_water_m
                  ? (unit === "ft"
                      ? reading.depth_to_water_m * 3.28084
                      : reading.depth_to_water_m
                    ).toFixed(2)
                  : "-"}
              </div>
            </ValueHighlight>
            <div className="text-muted-foreground">
              {t("detail.depth")} {"("}
              {unit}
              {")"}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center text-muted-foreground">
          <Droplets className="mb-4 h-12 w-12 opacity-20" />
          {t("detail.noReadings")}
        </div>
      )}
    </div>
  );
}
