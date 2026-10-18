"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Droplets, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface VillageHealthCardProps {
  wellsCount: number;
  isSufficient: boolean;
  avgHealthScore: number | null;
  worstHealthScore: number | null;
  dominantBand: string | null;
  avgDepletionRateMPerYear: number | null;
  totalRechargeVolumeMCM: number | null;
}

export function VillageHealthCard({
  wellsCount,
  isSufficient,
  avgHealthScore,
  worstHealthScore,
  dominantBand,
  avgDepletionRateMPerYear,
  totalRechargeVolumeMCM,
}: VillageHealthCardProps) {
  const t = useTranslations("insights");

  if (!isSufficient || avgHealthScore === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-6 text-center shadow-xs">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h4 className="mt-2 text-base font-semibold">{t("privacyMasked")}</h4>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {t("privacyMaskedDesc", { min: 3 })}
        </p>
      </div>
    );
  }

  const bandColors: Record<string, string> = {
    healthy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    watch: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    stressed: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    critical: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const currentBadge = (dominantBand && bandColors[dominantBand]) || bandColors.healthy;

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("villageCard.title")}</h3>
            <span className="text-xs text-muted-foreground">
              {t("villageCard.sampleSize", { count: wellsCount })}
            </span>
          </div>
        </div>

        {dominantBand && (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${currentBadge}`}
          >
            {dominantBand}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="rounded-xl bg-muted/40 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {t("villageCard.avgScore")}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-foreground">{avgHealthScore}</span>
            <span className="text-xs text-muted-foreground">{t("healthGauge.scoreOutOf")}</span>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {t("villageCard.worstScore")}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {worstHealthScore ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">{t("healthGauge.scoreOutOf")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
        {avgDepletionRateMPerYear !== null && (
          <div className="flex items-center gap-2 rounded-xl border bg-background p-3 text-xs">
            <TrendingDown className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>
              {t("villageCard.avgDepletion", { rate: avgDepletionRateMPerYear.toFixed(2) })}
            </span>
          </div>
        )}
        {totalRechargeVolumeMCM !== null && (
          <div className="flex items-center gap-2 rounded-xl border bg-background p-3 text-xs">
            <Droplets className="h-4 w-4 text-cyan-500" aria-hidden="true" />
            <span>
              {t("villageCard.totalRecharge", { volume: totalRechargeVolumeMCM.toFixed(3) })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
