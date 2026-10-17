"use client";

import React, { useState } from "react";
import { CloudRain, Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface MonsoonRechargeCardProps {
  riseM: number | null;
  rechargeVolumeMCM?: number | null;
  specificYield?: number | null;
  confidence?: string | null;
}

export function MonsoonRechargeCard({
  riseM,
  rechargeVolumeMCM,
  specificYield = 0.08,
  confidence = "high",
}: MonsoonRechargeCardProps) {
  const t = useTranslations("insights");
  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <CloudRain className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("monsoonCard.title")}</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground"
          aria-label={t("monsoonCard.assumptions")}
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {riseM !== null ? t("monsoonCard.riseM", { rise: riseM.toFixed(2) }) : "—"}
        </div>
        {rechargeVolumeMCM != null && (
          <p className="text-xs text-muted-foreground">
            {t("monsoonCard.waterVolume", { volume: rechargeVolumeMCM.toFixed(3) })}
          </p>
        )}
        <div className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t("monsoonCard.confidence", { level: confidence ?? "normal" })}
        </div>
      </div>

      {showAssumptions && (
        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{`${t("monsoonCard.assumptions")}: `}</span>
          {t("monsoonCard.assumptionsText", { sy: specificYield ?? 0.08 })}
        </div>
      )}
    </div>
  );
}
