"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronRight, ShieldAlert } from "lucide-react";
import type { NeedsAttentionVillage } from "@/server/official/service";
import type { StressReasonChip } from "@/lib/official/stress-score";

interface NeedsAttentionListProps {
  villages: NeedsAttentionVillage[];
  locale: string;
}

export function NeedsAttentionList({ villages, locale }: NeedsAttentionListProps) {
  const t = useTranslations("official");

  const renderChip = (chip: StressReasonChip) => {
    switch (chip.id) {
      case "critical_wells":
        return t("needsAttention.chips.pctCritical", { pct: chip.params.pct ?? 0 });
      case "offline_sensors":
        return t("needsAttention.chips.pctOffline", { pct: chip.params.pct ?? 0 });
      case "critical_alerts":
        return t("needsAttention.chips.criticalAlerts", { count: Number(chip.params.count ?? 0) });
      case "rapid_depletion":
        return t("needsAttention.chips.depletingFast", { rate: chip.params.rate ?? 0 });
      case "aquifer_vulnerability":
        return t("needsAttention.chips.poorHealth", { score: chip.params.score ?? 0 });
      default:
        return "";
    }
  };

  const getSeverityBadge = (severity: "critical" | "warning" | "watch" | "low") => {
    switch (severity) {
      case "critical":
        return {
          label: t("needsAttention.severityHigh"),
          bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
        };
      case "warning":
        return {
          label: t("needsAttention.severityMedium"),
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        };
      case "watch":
        return {
          label: t("needsAttention.severityMedium"),
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
      default:
        return {
          label: t("needsAttention.severityLow"),
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <ShieldAlert className="h-5 w-5 text-rose-600" aria-hidden="true" />
            {t("needsAttention.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("needsAttention.subtitle")}</p>
        </div>
      </div>

      {villages.length === 0 ? (
        <div className="py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted-foreground">{t("needsAttention.empty")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40 overflow-hidden">
          {villages.slice(0, 10).map((v, idx) => {
            const badge = getSeverityBadge(v.severity);
            return (
              <div
                key={v.id}
                className="group flex flex-col justify-between gap-3 py-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {t("needsAttention.rank", { rank: idx + 1 })}
                    </span>
                    <span className="truncate font-medium text-foreground">{v.name}</span>
                    {v.parentName && (
                      <span className="text-xs text-muted-foreground">{`(${v.parentName})`}</span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-foreground/80">
                      {t("needsAttention.scoreLabel", { score: v.stressScore })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {v.reasonChips.map((chip, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-flex items-center rounded-md border border-border/40 bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      >
                        {renderChip(chip)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end sm:self-center">
                  <Link
                    href={`/${locale}/official/regions/${v.id}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <span>{t("needsAttention.viewVillage")}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
