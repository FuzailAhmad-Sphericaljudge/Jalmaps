"use client";

import { useTranslations } from "next-intl";
import { Droplet, Wifi, AlertTriangle, TrendingDown, Bell, Clock } from "lucide-react";
import type { OfficialKpiStrip } from "@/server/official/service";

interface OfficialKpiStripProps {
  kpis: OfficialKpiStrip;
  locale: string;
  onFilterClick?: (filterType: string) => void;
}

export function OfficialKpiStripComponent({ kpis, onFilterClick }: OfficialKpiStripProps) {
  const t = useTranslations("official");

  const cards = [
    {
      id: "wells",
      label: t("kpis.wellsMonitored"),
      value: kpis.wellsMonitored.toLocaleString(),
      tooltip: t("kpis.wellsMonitoredTooltip"),
      icon: Droplet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      id: "nodes",
      label: t("kpis.nodesOnline"),
      value: `${kpis.nodesOnlinePct}%`,
      tooltip: t("kpis.nodesOnlineTooltip"),
      icon: Wifi,
      color: kpis.nodesOnlinePct >= 80 ? "text-emerald-600" : "text-amber-600",
      bg: kpis.nodesOnlinePct >= 80 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
    {
      id: "critical",
      label: t("kpis.villagesCritical"),
      value: `${kpis.villagesCriticalPct}%`,
      tooltip: t("kpis.villagesCriticalTooltip"),
      icon: AlertTriangle,
      color: kpis.villagesCriticalPct > 20 ? "text-rose-600" : "text-emerald-600",
      bg: kpis.villagesCriticalPct > 20 ? "bg-rose-500/10" : "bg-emerald-500/10",
    },
    {
      id: "trend",
      label: t("kpis.avgChange30d"),
      value:
        kpis.avgChange30dM !== null
          ? `${kpis.avgChange30dM > 0 ? "+" : ""}${kpis.avgChange30dM.toFixed(2)} m`
          : "-",
      tooltip: t("kpis.avgChange30dTooltip"),
      icon: TrendingDown,
      color: kpis.avgChange30dM && kpis.avgChange30dM < 0 ? "text-rose-600" : "text-emerald-600",
      bg: "bg-blue-500/10",
    },
    {
      id: "alerts",
      label: t("kpis.openCriticalAlerts"),
      value: kpis.openCriticalAlerts.toLocaleString(),
      tooltip: t("kpis.openCriticalAlertsTooltip"),
      icon: Bell,
      color: kpis.openCriticalAlerts > 0 ? "text-rose-600" : "text-muted-foreground",
      bg: kpis.openCriticalAlerts > 0 ? "bg-rose-500/10" : "bg-muted/30",
    },
    {
      id: "freshness",
      label: t("kpis.freshness"),
      value: kpis.dataFreshness
        ? new Date(kpis.dataFreshness).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : t("kpis.freshnessNever"),
      tooltip: t("kpis.freshnessTooltip"),
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-3 print:gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            title={card.tooltip}
            onClick={() => onFilterClick?.(card.id)}
            className="flex min-h-[100px] flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none print:border-neutral-300 print:shadow-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.bg}`}
                aria-hidden="true"
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-foreground">
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}
