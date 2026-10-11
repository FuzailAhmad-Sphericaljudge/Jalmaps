"use client";

import React, { useMemo } from "react";
import Map, { Layer, Source, NavigationControl } from "react-map-gl/maplibre";
import { useTranslations } from "next-intl";
import type { RankedRegionItem } from "@/server/regions/rollups";
import "maplibre-gl/dist/maplibre-gl.css";

interface RegionChoroplethMapProps {
  regions: RankedRegionItem[];
  onSelectRegion?: (id: string) => void;
}

const DEFAULT_STYLE = "https://demotiles.maplibre.org/style.json";

export function RegionChoroplethMap({ regions, onSelectRegion }: RegionChoroplethMapProps) {
  const t = useTranslations("regions");

  // Construct GeoJSON FeatureCollection from simplified boundaries
  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: regions
        .filter((r) => r.simplified_geojson)
        .map((r) => ({
          type: "Feature" as const,
          id: r.id,
          properties: {
            id: r.id,
            name: r.name,
            critical: r.isPrivacySuppressed ? null : r.stats.pct_critical,
            wells: r.stats.wells_count,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geometry: r.simplified_geojson as any,
        })),
    };
  }, [regions]);

  return (
    <div
      role="region"
      aria-label={t("viewMode.choropleth")}
      className="relative h-[450px] w-full overflow-hidden rounded-xl border bg-muted shadow-sm"
    >
      <Map
        initialViewState={{
          latitude: 22.5,
          longitude: 78.5,
          zoom: 4.2,
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
              "fill-color": [
                "case",
                ["==", ["get", "critical"], null],
                "#94a3b8", // muted gray for privacy masked
                [">=", ["get", "critical"], 30],
                "#e11d48", // rose critical
                [">=", ["get", "critical"], 15],
                "#f59e0b", // amber warning
                "#10b981", // emerald good
              ],
              "fill-opacity": 0.6,
            }}
          />
          <Layer
            id="regions-line"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 1.5,
            }}
          />
        </Source>
      </Map>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border bg-background/95 p-3 text-xs shadow-md backdrop-blur">
        <span className="font-semibold text-foreground">{t("metrics.criticalPct")}</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{t("legend.low")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
          <span>{t("legend.medium")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" aria-hidden="true" />
          <span>{t("legend.high")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" aria-hidden="true" />
          <span>{t("privacy.badge")}</span>
        </div>
      </div>
    </div>
  );
}
