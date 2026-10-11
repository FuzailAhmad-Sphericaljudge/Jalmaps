"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import "maplibre-gl/dist/maplibre-gl.css";

import { MapMarker } from "./map-marker";
import { MapPopup } from "./map-popup";
import { MapFilters } from "./map-filters";
import { MapListView } from "./map-list-view";
import { LocateButton } from "./locate-button";
import { MapLegend } from "./map-legend";
import type {
  MapFeatureCollection,
  MapPointProperties,
  WellStatus,
  WellType,
} from "@/server/map/types";

export interface MapContainerProps {
  locale: string;
  unit?: "m" | "ft";
  styleUrl?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

const DEFAULT_LAT = 22.5;
const DEFAULT_LNG = 78.5;
const DEFAULT_ZOOM = 4.5;
const DEFAULT_STYLE = "https://demotiles.maplibre.org/style.json";

export function MapContainer({
  locale,
  unit = "m",
  styleUrl,
  initialLat,
  initialLng,
  initialZoom,
}: MapContainerProps) {
  const t = useTranslations("wells.map");
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef | null>(null);

  // Parse state from URL search params or props
  const paramLat = searchParams.get("lat")
    ? parseFloat(searchParams.get("lat")!)
    : (initialLat ?? DEFAULT_LAT);
  const paramLng = searchParams.get("lng")
    ? parseFloat(searchParams.get("lng")!)
    : (initialLng ?? DEFAULT_LNG);
  const paramZoom = searchParams.get("zoom")
    ? parseFloat(searchParams.get("zoom")!)
    : (initialZoom ?? DEFAULT_ZOOM);
  const paramStatus = (searchParams.get("status") as WellStatus | "all") || "all";
  const paramType = (searchParams.get("type") as WellType | "all") || "all";

  const [viewState, setViewState] = useState({
    latitude: isNaN(paramLat) ? DEFAULT_LAT : paramLat,
    longitude: isNaN(paramLng) ? DEFAULT_LNG : paramLng,
    zoom: isNaN(paramZoom) ? DEFAULT_ZOOM : paramZoom,
  });

  const [statusFilter, setStatusFilter] = useState<WellStatus | "all">(paramStatus);
  const [typeFilter, setTypeFilter] = useState<WellType | "all">(paramType);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedPoint, setSelectedPoint] = useState<MapPointProperties | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);

  const tileStyle = styleUrl || process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE;

  // Debounced URL state update (300ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const syncUrl = useCallback(
    (lat: number, lng: number, zoom: number, status: string, type: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        params.set("lat", lat.toFixed(4));
        params.set("lng", lng.toFixed(4));
        params.set("zoom", zoom.toFixed(1));
        if (status !== "all") params.set("status", status);
        else params.delete("status");
        if (type !== "all") params.set("type", type);
        else params.delete("type");

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
      }, 300);
    },
    [router],
  );

  // Compute active bounding box
  const activeBbox = useMemo(() => {
    if (bounds) return bounds.join(",");
    // Approximate bbox based on center and zoom
    const latDelta = 360 / Math.pow(2, viewState.zoom);
    const lngDelta = 360 / Math.pow(2, viewState.zoom);
    const minLng = Math.max(-180, viewState.longitude - lngDelta / 2);
    const maxLng = Math.min(180, viewState.longitude + lngDelta / 2);
    const minLat = Math.max(-85, viewState.latitude - latDelta / 2);
    const maxLat = Math.min(85, viewState.latitude + latDelta / 2);
    return `${minLng.toFixed(4)},${minLat.toFixed(4)},${maxLng.toFixed(4)},${maxLat.toFixed(4)}`;
  }, [bounds, viewState.latitude, viewState.longitude, viewState.zoom]);

  // Query wells data
  const { data: featureCollection } = useQuery<MapFeatureCollection>({
    queryKey: ["wells-map", activeBbox, Math.round(viewState.zoom), statusFilter, typeFilter],
    queryFn: async () => {
      const url = new URL("/api/v1/wells/map", window.location.origin);
      url.searchParams.set("bbox", activeBbox);
      url.searchParams.set("zoom", Math.round(viewState.zoom).toString());
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (typeFilter !== "all") url.searchParams.set("type", typeFilter);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error("Failed to load map data");
      }
      return (await res.json()) as MapFeatureCollection;
    },
    staleTime: 30_000,
  });

  const features = featureCollection?.features || [];

  const handleMove = (evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
    syncUrl(
      evt.viewState.latitude,
      evt.viewState.longitude,
      evt.viewState.zoom,
      statusFilter,
      typeFilter,
    );

    if (mapRef.current) {
      const b = mapRef.current.getBounds();
      if (b) {
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      }
    }
  };

  const handleStatusChange = (newStatus: WellStatus | "all") => {
    setStatusFilter(newStatus);
    syncUrl(viewState.latitude, viewState.longitude, viewState.zoom, newStatus, typeFilter);
  };

  const handleTypeChange = (newType: WellType | "all") => {
    setTypeFilter(newType);
    syncUrl(viewState.latitude, viewState.longitude, viewState.zoom, statusFilter, newType);
  };

  const handleLocateFound = (coords: { lat: number; lng: number }) => {
    setViewState((prev) => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      zoom: 14,
    }));
    mapRef.current?.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 14,
      duration: 1500,
    });
    syncUrl(coords.lat, coords.lng, 14, statusFilter, typeFilter);
  };

  const handleClusterClick = (lng: number, lat: number) => {
    const nextZoom = Math.min(18, viewState.zoom + 2);
    setViewState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: nextZoom,
    }));
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: nextZoom,
      duration: 800,
    });
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="relative flex h-[calc(100vh-140px)] min-h-[500px] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-sm"
    >
      {/* Top Floating Controls */}
      <div className="pointer-events-auto absolute top-3 right-3 left-3 z-10">
        <MapFilters
          status={statusFilter}
          onStatusChange={handleStatusChange}
          type={typeFilter}
          onTypeChange={handleTypeChange}
          viewMode={viewMode}
          onViewModeToggle={() => setViewMode((m) => (m === "map" ? "list" : "map"))}
          wellsCount={features.length}
        />
      </div>

      {viewMode === "list" ? (
        <div className="mt-20 flex-1 overflow-y-auto p-4">
          <MapListView
            data={
              featureCollection || {
                type: "FeatureCollection",
                features: [],
                metadata: { totalFeatures: 0, isClustered: false, zoom: viewState.zoom },
              }
            }
            locale={locale}
            unit={unit}
          />
        </div>
      ) : (
        <div className="relative h-full w-full">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={handleMove}
            mapStyle={tileStyle}
            style={{ width: "100%", height: "100%" }}
            maxZoom={18}
            minZoom={3}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {/* Offline Fallback Vector Outline */}
            <Source id="india-outline" type="geojson" data="/india-outline-simplified.geojson">
              <Layer
                id="india-outline-line"
                type="line"
                paint={{
                  "line-color": "#94a3b8",
                  "line-width": 1.5,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>

            {/* Render Markers */}
            {features.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties;
              return (
                <Marker key={props.id} longitude={lng} latitude={lat} anchor="center">
                  <MapMarker
                    status={props.status}
                    isCluster={props.isCluster}
                    count={props.count}
                    isOwned={props.isOwned}
                    name={props.name}
                    isSelected={selectedPoint?.id === props.id}
                    onClick={() => {
                      if (props.isCluster) {
                        handleClusterClick(lng, lat);
                      } else {
                        setSelectedPoint(props);
                      }
                    }}
                  />
                </Marker>
              );
            })}
          </Map>

          {/* Selected Well Popup */}
          {selectedPoint && (
            <div className="pointer-events-auto absolute bottom-6 left-6 z-20">
              <MapPopup
                properties={selectedPoint}
                locale={locale}
                unit={unit}
                onClose={() => setSelectedPoint(null)}
              />
            </div>
          )}

          {/* Controls: Legend & Locate Button */}
          <div className="pointer-events-auto absolute right-2.5 bottom-28 z-10 flex flex-col items-end gap-2">
            <MapLegend />
            <LocateButton onLocationFound={handleLocateFound} />
          </div>
        </div>
      )}
    </div>
  );
}
