"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import type { OfficialDashboardData } from "@/server/official/service";
import type { SavedViewRecord } from "@/server/official/saved-views";
import { OfficialScopePicker } from "./OfficialScopePicker";
import { OfficialSavedViews } from "./OfficialSavedViews";
import { OfficialCaveatsBanner } from "./OfficialCaveatsBanner";
import { OfficialKpiStripComponent } from "./OfficialKpiStripComponent";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { OfficialChoroplethPanel } from "./OfficialChoroplethPanel";
import { OfficialAlertFeed } from "./OfficialAlertFeed";
import { OfficialTrendPanel } from "./OfficialTrendPanel";
import { OfficialFollowUpNotes } from "./OfficialFollowUpNotes";

interface OfficialDashboardViewProps {
  data: OfficialDashboardData;
  savedViews: SavedViewRecord[];
  locale: string;
  userRole?: string;
}

export function OfficialDashboardView({
  data,
  savedViews,
  locale,
  userRole = "official",
}: OfficialDashboardViewProps) {
  const t = useTranslations("official");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preset, setPreset] = useState<"7d" | "30d" | "90d" | "1y">(
    (searchParams.get("preset") as "7d" | "30d" | "90d" | "1y") || "30d",
  );

  const handleSelectArea = (areaId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (areaId) {
      params.set("areaId", areaId);
    } else {
      params.delete("areaId");
    }
    router.push(`/${locale}/official?${params.toString()}`);
  };

  const handleSelectPreset = (newPreset: "7d" | "30d" | "90d" | "1y") => {
    setPreset(newPreset);
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", newPreset);
    router.push(`/${locale}/official?${params.toString()}`);
  };

  const handleApplySavedView = (view: SavedViewRecord) => {
    const filters = view.filters as { areaId?: string; preset?: "7d" | "30d" | "90d" | "1y" };
    const params = new URLSearchParams();
    if (filters.areaId) params.set("areaId", filters.areaId);
    if (filters.preset) params.set("preset", filters.preset);
    router.push(`/${locale}/official?${params.toString()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center print:border-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data.selectedArea ? data.selectedArea.name : t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <OfficialScopePicker
            allowedAreas={data.allowedAreas}
            selectedAreaId={data.selectedArea?.id}
            onSelectArea={handleSelectArea}
          />
          <OfficialSavedViews
            views={savedViews}
            currentAreaId={data.selectedArea?.id}
            currentPreset={preset}
            onApplyView={handleApplySavedView}
          />
          <button
            type="button"
            onClick={handlePrint}
            aria-label={t("print")}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/80 bg-background p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Caveats Banner */}
      <OfficialCaveatsBanner
        offlineSensorsPct={data.caveats.offlineSensorsPct}
        offlineSensorsCount={data.caveats.offlineSensorsCount}
        privacySuppressedCount={data.caveats.privacySuppressedCount}
      />

      {/* KPI Strip */}
      <OfficialKpiStripComponent kpis={data.kpis} locale={locale} />

      {/* Main Grid: Needs Attention + Choropleth Map */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-1 print:gap-4">
        <NeedsAttentionList villages={data.needsAttentionVillages} locale={locale} />
        <OfficialChoroplethPanel
          subRegions={data.subRegionsGeo}
          onSelectRegion={handleSelectArea}
        />
      </div>

      {/* Secondary Grid: Trend + Alert Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-1 print:gap-4">
        <OfficialTrendPanel
          trendHistory={data.trendHistory}
          selectedPreset={preset}
          onSelectPreset={handleSelectPreset}
        />
        <OfficialAlertFeed alerts={data.alerts} userRole={userRole} />
      </div>

      {/* Follow-up Action Tracker & Notes */}
      <div>
        <OfficialFollowUpNotes
          notes={data.notes}
          currentAreaId={data.selectedArea?.id}
          allowedAreas={data.allowedAreas}
        />
      </div>
    </div>
  );
}
