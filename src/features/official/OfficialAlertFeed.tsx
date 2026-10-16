"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, AlertTriangle, AlertCircle, Info, Check, Loader2 } from "lucide-react";
import type { OfficialAlertItem } from "@/server/official/service";
import { acknowledgeAlertAction } from "@/server/official/actions";

interface OfficialAlertFeedProps {
  alerts: OfficialAlertItem[];
  userRole?: string;
}

export function OfficialAlertFeed({
  alerts: initialAlerts,
  userRole = "official",
}: OfficialAlertFeedProps) {
  const t = useTranslations("official");
  const [alerts, setAlerts] = useState<OfficialAlertItem[]>(initialAlerts);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const canAcknowledge =
    userRole === "official" || userRole === "admin" || userRole === "village_admin";

  const handleAcknowledge = async (alertId: string) => {
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlertAction(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "acknowledged" } : a)),
      );
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.severity === filter;
  });

  const getSeverityIcon = (sev: "critical" | "warning" | "info") => {
    switch (sev) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border/50 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Bell className="h-5 w-5 text-rose-600" aria-hidden="true" />
            {t("alerts.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("alerts.subtitle")}</p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl bg-muted p-1 sm:self-auto">
          {(["all", "critical", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilter(sev)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                filter === sev
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {sev === "all"
                ? t("alerts.filterAll")
                : sev === "critical"
                  ? t("alerts.filterCritical")
                  : sev === "warning"
                    ? t("alerts.filterWarning")
                    : t("alerts.filterInfo")}
            </button>
          ))}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="py-8 text-center">
          <Check className="mx-auto h-7 w-7 text-emerald-600" aria-hidden="true" />
          <p className="mt-2 text-xs text-muted-foreground">{t("alerts.empty")}</p>
        </div>
      ) : (
        <div className="max-h-[380px] divide-y divide-border/40 overflow-y-auto pr-1">
          {filteredAlerts.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="mt-0.5 shrink-0">{getSeverityIcon(item.severity)}</div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {item.wellName}
                    </span>
                    <span className="text-xs text-muted-foreground">{`(${item.areaName})`}</span>
                  </div>
                  <p className="text-xs text-foreground/85">{item.messageKey}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("alerts.reportedAt", {
                      time: new Date(item.triggeredAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
                  </p>
                </div>
              </div>

              {canAcknowledge && (
                <div className="shrink-0 self-center">
                  {item.status === "acknowledged" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                      <Check className="h-3 w-3" />
                      {t("alerts.acknowledged")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={acknowledgingId === item.id}
                      onClick={() => handleAcknowledge(item.id)}
                      className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
                    >
                      {acknowledgingId === item.id && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>
                        {acknowledgingId === item.id
                          ? t("alerts.acknowledging")
                          : t("alerts.acknowledge")}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
