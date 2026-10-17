"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Droplet, Wifi, AlertTriangle, ArrowRight, TrendingDown, Info } from "lucide-react";
import type { VillageDashboardData } from "@/server/official/village-service";
import { OfficialAlertFeed } from "./OfficialAlertFeed";
import { OfficialFollowUpNotes } from "./OfficialFollowUpNotes";

interface VillageDashboardViewProps {
  data: VillageDashboardData;
  locale: string;
}

export function VillageDashboardView({ data, locale }: VillageDashboardViewProps) {
  const t = useTranslations("official");

  const formattedAlerts = data.alerts.map((a) => ({
    ...a,
    areaId: data.areaId,
    areaName: data.villageName,
    status: a.status as "open" | "acknowledged" | "resolved",
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("village.title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("village.subtitle", { village: data.villageName })}
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpis.wellsMonitored")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Droplet className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">{data.stats.wellsCount}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpis.nodesOnline")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Wifi className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {`${data.stats.nodesOnline} / ${data.stats.wellsCount}`}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpis.villagesCritical")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {`${data.stats.pctCritical}%`}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpis.avgChange30d")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {data.stats.avgChange30dM !== null
              ? `${data.stats.avgChange30dM > 0 ? "+" : ""}${data.stats.avgChange30dM.toFixed(2)} m`
              : "-"}
          </div>
        </div>
      </div>

      {/* Community Announcement Shortcut (Phase 27 Reserved) */}
      <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-900 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <span>{t("village.announcementPlaceholder")}</span>
      </div>

      {/* Wells in this village */}
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t("village.wellsSummary")}
            </h2>
          </div>
        </div>

        {data.wells.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {t("needsAttention.empty")}
          </p>
        ) : (
          <div className="divide-y divide-border/40 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2.5 font-medium">{t("village.table.name")}</th>
                  <th className="py-2.5 font-medium">{t("village.table.type")}</th>
                  <th className="py-2.5 font-medium">{t("village.table.status")}</th>
                  <th className="py-2.5 font-medium">{t("village.table.depth")}</th>
                  <th className="py-2.5 font-medium">{t("village.table.node")}</th>
                  <th className="py-2.5 text-right font-medium">{t("village.table.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.wells.map((well) => (
                  <tr key={well.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 font-semibold text-foreground">{well.name}</td>
                    <td className="py-3 text-muted-foreground capitalize">{well.wellType}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {well.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-foreground">
                      {well.depthToWaterM !== null ? `${well.depthToWaterM.toFixed(2)} m` : "-"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          well.nodeStatus === "active"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {well.nodeStatus || t("village.table.none")}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/${locale}/farmer/wells/${well.id}`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <span>{t("village.table.view")}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Alert Feed & Notes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OfficialAlertFeed alerts={formattedAlerts} userRole="village_admin" />
        <OfficialFollowUpNotes
          notes={data.notes}
          currentAreaId={data.areaId}
          allowedAreas={[{ id: data.areaId, name: data.villageName }]}
        />
      </div>
    </div>
  );
}
