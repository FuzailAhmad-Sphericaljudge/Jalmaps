"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Download, Layers, MapPin, Table as TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { RegionBreadcrumbs } from "@/features/regions/RegionBreadcrumbs";
import { RegionKpiCards } from "@/features/regions/RegionKpiCards";
import { RegionPrivacyNotice } from "@/features/regions/RegionPrivacyNotice";
import { RegionHistoryChart } from "@/features/regions/RegionHistoryChart";
import { RegionRankingTable } from "@/features/regions/RegionRankingTable";
import { RegionCompareModal } from "@/features/regions/RegionCompareModal";
import { VillageHealthCard } from "@/components/insights/village-health-card";
import type { RegionDetail } from "@/server/regions/service";
import type { RankedRegionItem } from "@/server/regions/rollups";

const RegionChoroplethMap = dynamic(
  () => import("@/features/regions/RegionChoroplethMap").then((mod) => mod.RegionChoroplethMap),
  { ssr: false },
);

export interface RegionAreaInsight {
  wells_count: number;
  is_sufficient: boolean;
  avg_health_score: number | null;
  worst_health_score: number | null;
  dominant_health_band: string | null;
  avg_depletion_rate_m_per_year: number | null;
  total_recharge_volume_mcm: number | null;
}

interface RegionDetailViewProps {
  locale: string;
  region: RegionDetail;
  childRegions: RankedRegionItem[];
  areaInsight?: RegionAreaInsight | null;
}

export function RegionDetailView({
  locale,
  region,
  childRegions,
  areaInsight,
}: RegionDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("regions");
  const [viewMode, setViewMode] = useState<"table" | "choropleth">("table");
  const [selectedCompare, setSelectedCompare] = useState<RankedRegionItem[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const handleToggleCompare = (item: RankedRegionItem) => {
    setSelectedCompare((prev) => {
      if (prev.some((r) => r.id === item.id)) {
        return prev.filter((r) => r.id !== item.id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleExportCsv = () => {
    const a = document.createElement("a");
    a.href = `/api/v1/regions/export?parentId=${region.id}&locale=${locale}`;
    a.setAttribute("download", `region-${region.code}-export.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <RegionBreadcrumbs items={region.breadcrumbs} locale={locale} />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {region.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{region.code}</p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {childRegions.length > 0 && (
            <div className="inline-flex rounded-xl border bg-muted p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex min-h-[48px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={t("viewMode.table")}
              >
                <TableIcon className="h-4 w-4" aria-hidden="true" />
                <span>{t("viewMode.table")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("choropleth")}
                className={`flex min-h-[48px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                  viewMode === "choropleth"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={t("viewMode.choropleth")}
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>{t("viewMode.choropleth")}</span>
              </button>
            </div>
          )}

          {selectedCompare.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{t("actions.compare")}</span>
              <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">
                {selectedCompare.length}
              </span>
            </button>
          )}

          {childRegions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex min-h-[48px] items-center gap-2 rounded-xl border bg-card px-4 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{t("actions.exportCsv")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice when masked */}
      {region.isPrivacySuppressed && <RegionPrivacyNotice minSampleSize={region.minSampleSize} />}

      {/* Region KPI Cards */}
      <RegionKpiCards stats={region.stats} isPrivacySuppressed={region.isPrivacySuppressed} />

      {/* Aquifer Insights Summary for Area/Village */}
      {areaInsight && (
        <div className="pt-2">
          <VillageHealthCard
            wellsCount={areaInsight.wells_count}
            isSufficient={areaInsight.is_sufficient}
            avgHealthScore={areaInsight.avg_health_score}
            worstHealthScore={areaInsight.worst_health_score}
            dominantBand={areaInsight.dominant_health_band}
            avgDepletionRateMPerYear={areaInsight.avg_depletion_rate_m_per_year}
            totalRechargeVolumeMCM={areaInsight.total_recharge_volume_mcm}
          />
        </div>
      )}

      {/* 30-Day Trend Chart */}
      {!region.isPrivacySuppressed && region.dailyHistory.length > 0 && (
        <RegionHistoryChart data={region.dailyHistory} />
      )}

      {/* Sub-regions Ranking Table or Choropleth */}
      {childRegions.length > 0 && (
        <div className="space-y-4 pt-4">
          {viewMode === "table" ? (
            <RegionRankingTable
              regions={childRegions}
              locale={locale}
              onSelectCompare={handleToggleCompare}
              selectedCompareIds={selectedCompare.map((r) => r.id)}
            />
          ) : (
            <RegionChoroplethMap
              regions={childRegions}
              onSelectRegion={(id) => {
                router.push(`/${locale}/official/regions/${id}`);
              }}
            />
          )}
        </div>
      )}

      {/* Compare Modal */}
      <RegionCompareModal
        regions={selectedCompare}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onClear={() => {
          setSelectedCompare([]);
          setIsCompareOpen(false);
        }}
      />
    </div>
  );
}
