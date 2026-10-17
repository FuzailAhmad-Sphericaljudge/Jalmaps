"use client";

import React, { useMemo, useState } from "react";
import Map, { Layer, Source, NavigationControl } from "react-map-gl/maplibre";
import { useTranslations } from "next-intl";
import { Layers, MapPin } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

interface SubRegionGeoItem {
  id: string;
  code: string;
  name: string;
  level: string;
  stats: {
    wells_count: number;
    nodes_online: number;
    pct_critical: number;
    pct_offline: number;
    avg_depth_m: number | null;
  };
  isPrivacySuppressed: boolean;
  simplified_geojson?: unknown;
}

interface OfficialChoroplethPanelProps {
  subRegions: SubRegionGeoItem[];
  onSelectRegion?: (id: string) => void;
}

const DEFAULT_STYLE = "https://demotiles.maplibre.org/style.json";

export function OfficialChoroplethPanel({
  subRegions,
  onSelectRegion,
}: OfficialChoroplethPanelProps) {
  const t = useTranslations("official");
  const [metric, setMetric] = useState<"critical" | "offline" | "depth">("critical");

  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: subRegions
        .filter((r) => r.simplified_geojson)
        .map((r) => ({
          type: "Feature" as const,
          id: r.id,
          properties: {
            id: r.id,
            name: r.name,
            critical: r.isPrivacySuppressed ? null : r.stats.pct_critical,
            offline: r.isPrivacySuppressed ? null : r.stats.pct_offline,
            depth: r.isPrivacySuppressed ? null : r.stats.avg_depth_m,
            wells: r.stats.wells_count,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geometry: r.simplified_geojson as any,
        })),
    };
  }, [subRegions]);

  const fillColorExpression = useMemo(() => {
    if (metric === "offline") {
      return [
        "case",
        ["==", ["get", "offline"], null],
        "#9ca3af",
        [">=", ["get", "offline"], 30],
        "#e11d48",
        [">=", ["get", "offline"], 15],
        "#f59e0b",
        "#10b981",
      ];
    }
    if (metric === "depth") {
      return [
        "case",
        ["==", ["get", "depth"], null],
        "#9ca3af",
        [">=", ["get", "depth"], 30],
        "#7c3aed",
        [">=", ["get", "depth"], 15],
        "#3b82f6",
        "#06b6d4",
      ];
    }
    // Default: critical wells percentage
    return [
      "case",
      ["==", ["get", "critical"], null],
      "#9ca3af",
      [">=", ["get", "critical"], 25],
      "#ef4444",
      [">=", ["get", "critical"], 10],
      "#f97316",
      "#22c55e",
    ];
  }, [metric]);

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("map.title")}</h2>
        </div>

        <div className="flex items-center gap-1.5 self-start rounded-xl bg-muted p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric("critical")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              metric === "critical"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("map.metricCritical")}
          </button>
          <button
            type="button"
            onClick={() => setMetric("offline")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              metric === "offline"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("map.metricOffline")}
          </button>
          <button
            type="button"
            onClick={() => setMetric("depth")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              metric === "depth"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("map.metricDepth")}
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label={t("map.title")}
        className="relative h-[380px] w-full overflow-hidden rounded-xl border border-border/50 bg-muted"
      >
        <Map
          initialViewState={{
            latitude: 30.9,
            longitude: 75.85,
            zoom: 7.5,
          }}
          mapStyle={process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE}
          interactiveLayerIds={["regions-fill"]}
          onClick={(e) => {
            const feature = e.features?.[0];
            if (feature?.properties?.id && onSelectRegion) {
              onSelectRegion(feature.properties.id as string);
            }
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />

          <Source id="regions-data" type="geojson" data={geojson}>
            <Layer
              id="regions-fill"
              type="fill"
              paint={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                "fill-color": fillColorExpression as any,
                "fill-opacity": 0.65,
              }}
            />
            <Layer
              id="regions-borders"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 1.5,
              }}
            />
          </Source>
        </Map>

        {subRegions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-xs">
            <div className="p-4 text-center">
              <MapPin className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-1 text-xs text-muted-foreground">{t("needsAttention.empty")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
