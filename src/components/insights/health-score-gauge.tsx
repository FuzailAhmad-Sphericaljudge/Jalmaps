"use client";

import React, { useState } from "react";
import { HelpCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AquiferHealthBand } from "@/lib/insights/health-score";

interface HealthScoreGaugeProps {
  score: number | null;
  band: AquiferHealthBand | null;
  isSufficient: boolean;
}

export function HealthScoreGauge({ score, band, isSufficient }: HealthScoreGaugeProps) {
  const t = useTranslations("insights");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isSufficient || score === null || band === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-6 text-center shadow-xs">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h4 className="mt-2 text-base font-semibold">{t("notEnoughData")}</h4>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {t("notEnoughDataDesc", { months: 6, coverage: 70 })}
        </p>
      </div>
    );
  }

  // Band styling
  const bandConfig: Record<
    AquiferHealthBand,
    { label: string; bg: string; text: string; stroke: string }
  > = {
    healthy: {
      label: t("healthGauge.bands.healthy"),
      bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      stroke: "#10b981",
    },
    watch: {
      label: t("healthGauge.bands.watch"),
      bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      stroke: "#3b82f6",
    },
    stressed: {
      label: t("healthGauge.bands.stressed"),
      bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      stroke: "#f59e0b",
    },
    critical: {
      label: t("healthGauge.bands.critical"),
      bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      text: "text-rose-600 dark:text-rose-400",
      stroke: "#f43f5e",
    },
  };

  const currentBand = bandConfig[band];
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <>
      <div className="flex flex-col items-center justify-between rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("healthGauge.title")}</h3>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-hidden"
            aria-label={t("healthGauge.howCalculated")}
          >
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Circular Gauge */}
        <div className="relative my-4 flex items-center justify-center">
          <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-muted/30"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={currentBand.stroke}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-4xl font-extrabold tracking-tight ${currentBand.text}`}>
              {Math.round(score)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t("healthGauge.scoreOutOf")}
            </span>
          </div>
        </div>

        <div
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentBand.bg}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{currentBand.label}</span>
        </div>
      </div>

      {/* Explanation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{t("healthGauge.dialog.title")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("healthGauge.dialog.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 text-sm">
            <h4 className="font-semibold text-foreground">
              {t("healthGauge.dialog.componentsTitle")}
            </h4>
            <div className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">
                {t("healthGauge.dialog.seasonalStability")}
              </p>
              <p className="mb-2 font-medium text-foreground">
                {t("healthGauge.dialog.depletionRate")}
              </p>
              <p className="mb-2 font-medium text-foreground">
                {t("healthGauge.dialog.monsoonRecharge")}
              </p>
              <p className="font-medium text-foreground">{t("healthGauge.dialog.pumpingStress")}</p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {t("healthGauge.dialog.confidenceNote")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
