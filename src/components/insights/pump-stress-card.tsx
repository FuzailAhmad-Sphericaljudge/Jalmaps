"use client";

import React from "react";
import { Gauge, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface PumpStressCardProps {
  stressLevel: "low" | "moderate" | "high" | "severe" | null;
  drawdownM: number | null;
  recoveryHours: number | null;
  stressNoteKey?: string | null;
}

export function PumpStressCard({
  stressLevel,
  drawdownM,
  recoveryHours,
  stressNoteKey = "moderate_drawdown",
}: PumpStressCardProps) {
  const t = useTranslations("insights");

  const levelColors: Record<string, string> = {
    low: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    moderate: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    high: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    severe: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const currentStyle = (stressLevel && levelColors[stressLevel]) || levelColors.moderate;

  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("pumpingCard.title")}</h3>
        </div>

        {stressLevel && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${currentStyle}`}
          >
            {stressLevel}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("pumpingCard.drawdown", { drawdown: "" }).split(":")[0]}
          </span>
          <div className="mt-1 text-lg font-bold text-foreground">
            {drawdownM !== null ? `${drawdownM.toFixed(2)} m` : "—"}
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{t("pumpingCard.recoveryTime", { hours: "" }).split(":")[0]}</span>
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {recoveryHours !== null ? `${recoveryHours.toFixed(1)} hrs` : "—"}
          </div>
        </div>
      </div>

      {stressNoteKey && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t(`pumpingCard.stressNotes.${stressNoteKey}` as Parameters<typeof t>[0])}
        </p>
      )}
    </div>
  );
}
