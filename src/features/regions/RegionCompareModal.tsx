"use client";

import React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RankedRegionItem } from "@/server/regions/rollups";

interface RegionCompareModalProps {
  regions: RankedRegionItem[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export function RegionCompareModal({ regions, isOpen, onClose, onClear }: RegionCompareModalProps) {
  const t = useTranslations("regions");

  if (!isOpen || regions.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 id="compare-dialog-title" className="text-xl font-bold text-foreground">
            {t("compareTitle")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="flex min-h-[48px] items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {t("actions.clearCompare")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("actions.close")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <div
              key={region.id}
              className="flex flex-col justify-between space-y-4 rounded-xl border bg-muted/20 p-5"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground">{region.name}</h3>
                <span className="text-xs text-muted-foreground">{region.code}</span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border bg-card p-3">
                  <dt className="text-muted-foreground">{t("metrics.wells")}</dt>
                  <dd className="mt-1 text-base font-bold text-foreground">
                    {region.stats.wells_count}
                  </dd>
                </div>

                <div className="rounded-lg border bg-card p-3">
                  <dt className="text-muted-foreground">{t("metrics.nodesOnline")}</dt>
                  <dd className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {region.stats.nodes_online}
                  </dd>
                </div>

                <div className="rounded-lg border bg-card p-3">
                  <dt className="text-muted-foreground">{t("metrics.avgDepth")}</dt>
                  <dd className="mt-1 text-base font-bold text-foreground">
                    {region.isPrivacySuppressed || region.stats.avg_depth_m === null
                      ? t("units.unrecorded")
                      : t("units.meters", { value: region.stats.avg_depth_m.toFixed(1) })}
                  </dd>
                </div>

                <div className="rounded-lg border bg-card p-3">
                  <dt className="text-muted-foreground">{t("metrics.criticalPct")}</dt>
                  <dd className="mt-1 text-base font-bold text-rose-600 dark:text-rose-400">
                    {region.isPrivacySuppressed
                      ? t("units.unrecorded")
                      : t("units.percent", { value: (region.stats.pct_critical ?? 0).toFixed(1) })}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
