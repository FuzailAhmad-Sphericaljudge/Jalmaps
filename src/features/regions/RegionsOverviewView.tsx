"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Download, Layers, MapPin, Table as TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { RegionBreadcrumbs } from "@/features/regions/RegionBreadcrumbs";
import { RegionKpiCards } from "@/features/regions/RegionKpiCards";
import { RegionRankingTable } from "@/features/regions/RegionRankingTable";
import { RegionCompareModal } from "@/features/regions/RegionCompareModal";
import type { RankedRegionItem } from "@/server/regions/rollups";
import type { RegionStats } from "@/server/regions/privacy";

// Dynamically import MapLibre choropleth
const RegionChoroplethMap = dynamic(
  () => import("@/features/regions/RegionChoroplethMap").then((mod) => mod.RegionChoroplethMap),
  { ssr: false },
);

interface RegionsOverviewViewProps {
  locale: string;
  regions: RankedRegionItem[];
  overallStats: RegionStats;
}

export function RegionsOverviewView({ locale, regions, overallStats }: RegionsOverviewViewProps) {
  const t = useTranslations("regions");
  const [viewMode, setViewMode] = useState<"table" | "choropleth">("table");
  const [selectedCompare, setSelectedCompare] = useState<RankedRegionItem[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const handleToggleCompare = (region: RankedRegionItem) => {
    setSelectedCompare((prev) => {
      if (prev.some((r) => r.id === region.id)) {
        return prev.filter((r) => r.id !== region.id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, region];
    });
  };

  const handleExportCsv = () => {
    window.location.href = `/api/v1/regions/export?level=state&locale=${locale}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <RegionBreadcrumbs items={[]} locale={locale} />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
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

          {/* Compare Trigger */}
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

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex min-h-[48px] items-center gap-2 rounded-xl border bg-card px-4 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t("actions.exportCsv")}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <RegionKpiCards stats={overallStats} isPrivacySuppressed={false} />

      {/* Main Content: Table or Choropleth */}
      {viewMode === "table" ? (
        <RegionRankingTable
          regions={regions}
          locale={locale}
          onSelectCompare={handleToggleCompare}
          selectedCompareIds={selectedCompare.map((r) => r.id)}
        />
      ) : (
        <RegionChoroplethMap
          regions={regions}
          onSelectRegion={(id) => {
            window.location.href = `/${locale}/official/regions/${id}`;
          }}
        />
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
