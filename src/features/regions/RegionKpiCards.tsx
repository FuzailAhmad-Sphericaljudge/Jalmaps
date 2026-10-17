"use client";

import React from "react";
import { Activity, AlertTriangle, Droplets, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegionStats } from "@/server/regions/privacy";

interface RegionKpiCardsProps {
  stats: RegionStats;
  isPrivacySuppressed: boolean;
}

export function RegionKpiCards({ stats, isPrivacySuppressed }: RegionKpiCardsProps) {
  const t = useTranslations("regions");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Wells */}
      <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t("metrics.wells")}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Droplets className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold tracking-tight">{stats.wells_count}</span>
        </div>
      </div>

      {/* Online Nodes */}
      <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("metrics.nodesOnline")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold tracking-tight">{stats.nodes_online}</span>
        </div>
      </div>

      {/* Average / Median Depth */}
      <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t("metrics.avgDepth")}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          {isPrivacySuppressed || stats.avg_depth_m === null ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              {t("units.unrecorded")}
            </span>
          ) : (
            <span className="text-3xl font-bold tracking-tight">
              {t("units.meters", { value: stats.avg_depth_m.toFixed(1) })}
            </span>
          )}
        </div>
      </div>

      {/* Critical Water Ratio */}
      <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("metrics.criticalPct")}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          {isPrivacySuppressed ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              {t("units.unrecorded")}
            </span>
          ) : (
            <span className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {t("units.percent", { value: (stats.pct_critical ?? 0).toFixed(1) })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
