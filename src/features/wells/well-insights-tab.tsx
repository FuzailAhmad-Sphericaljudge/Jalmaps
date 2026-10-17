"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { HealthScoreGauge } from "@/components/insights/health-score-gauge";
import { SeasonalDecompositionChart } from "@/components/insights/seasonal-decomposition-chart";
import { MonsoonRechargeCard } from "@/components/insights/monsoon-recharge-card";
import { PumpStressCard } from "@/components/insights/pump-stress-card";
import type { AquiferHealthBand } from "@/lib/insights/health-score";

export interface WellInsightsData {
  isSufficient: boolean;
  healthScore: number | null;
  healthBand: AquiferHealthBand | null;
  seasonal: {
    dailyMedians?: Array<{ date: string; depthM: number }>;
    residualStdDevM?: number;
  } | null;
  monsoon: {
    yearlyComparisons?: Array<{
      riseM: number;
      confidence: string;
    }>;
  } | null;
  recharge: {
    rechargeVolumeMCM?: number;
    specificYield?: number;
    confidence?: string;
  } | null;
  pumping: {
    stressLevel?: "low" | "moderate" | "high" | "severe";
    medianDrawdownM?: number;
    medianRecoveryTimeHours?: number;
    stressNoteKey?: string;
  } | null;
}

interface WellInsightsTabProps {
  insights: WellInsightsData | null;
}

export function WellInsightsTab({ insights }: WellInsightsTabProps) {
  const t = useTranslations("insights");

  if (!insights) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
        <h4 className="text-base font-semibold">{t("notEnoughData")}</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("notEnoughDataDesc", { months: 6, coverage: 70 })}
        </p>
      </div>
    );
  }

  const latestMonsoon =
    insights.monsoon?.yearlyComparisons && insights.monsoon.yearlyComparisons.length > 0
      ? insights.monsoon.yearlyComparisons[insights.monsoon.yearlyComparisons.length - 1]
      : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <HealthScoreGauge
            score={insights.healthScore}
            band={insights.healthBand}
            isSufficient={insights.isSufficient}
          />
        </div>
        <div className="space-y-6 md:col-span-2">
          <MonsoonRechargeCard
            riseM={latestMonsoon?.riseM ?? null}
            rechargeVolumeMCM={insights.recharge?.rechargeVolumeMCM ?? null}
            specificYield={insights.recharge?.specificYield ?? null}
            confidence={latestMonsoon?.confidence ?? null}
          />
          <PumpStressCard
            stressLevel={insights.pumping?.stressLevel ?? null}
            drawdownM={insights.pumping?.medianDrawdownM ?? null}
            recoveryHours={insights.pumping?.medianRecoveryTimeHours ?? null}
            stressNoteKey={insights.pumping?.stressNoteKey ?? null}
          />
        </div>
      </div>

      {insights.seasonal?.dailyMedians && insights.seasonal.dailyMedians.length > 0 && (
        <SeasonalDecompositionChart
          dailyMedians={insights.seasonal.dailyMedians}
          residualStdDevM={insights.seasonal.residualStdDevM}
        />
      )}
    </div>
  );
}
