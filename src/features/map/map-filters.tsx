"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Filter, Layers, List, Map as MapIcon } from "lucide-react";
import type { WellStatus, WellType } from "@/server/map/types";

export interface MapFiltersProps {
  status: WellStatus | "all";
  onStatusChange: (status: WellStatus | "all") => void;
  type: WellType | "all";
  onTypeChange: (type: WellType | "all") => void;
  viewMode: "map" | "list";
  onViewModeToggle: () => void;
  wellsCount?: number;
}

export function MapFilters({
  status,
  onStatusChange,
  type,
  onTypeChange,
  viewMode,
  onViewModeToggle,
  wellsCount,
}: MapFiltersProps) {
  const tMap = useTranslations("wells.map");
  const tTypes = useTranslations("wells.wellTypes");

  return (
    <div
      role="region"
      aria-label="Map filters and controls"
      className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-white/95 p-2.5 shadow-md backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <label htmlFor="map-status-filter" className="sr-only">
            {tMap("filterStatus")}
          </label>
          <select
            id="map-status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as WellStatus | "all")}
            className="min-h-[48px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">{tMap("all")}</option>
            <option value="normal">{tMap("status.normal")}</option>
            <option value="warning">{tMap("status.warning")}</option>
            <option value="critical">{tMap("status.critical")}</option>
            <option value="unknown">{tMap("status.unknown")}</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <label htmlFor="map-type-filter" className="sr-only">
            {tMap("filterType")}
          </label>
          <select
            id="map-type-filter"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as WellType | "all")}
            className="min-h-[48px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">{tMap("all")}</option>
            <option value="open_well">{tTypes("open_well")}</option>
            <option value="borewell">{tTypes("borewell")}</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Wells Count Badge */}
        {wellsCount !== undefined && (
          <span className="hidden items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:inline-flex">
            {tMap("wellsInView", { count: wellsCount })}
          </span>
        )}

        {/* Map / List View Toggle */}
        <button
          type="button"
          onClick={onViewModeToggle}
          aria-label={viewMode === "map" ? tMap("viewList") : tMap("viewMap")}
          className="flex min-h-[48px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {viewMode === "map" ? (
            <>
              <List className="h-4 w-4 text-gray-600" aria-hidden="true" />
              <span>{tMap("viewList")}</span>
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4 text-gray-600" aria-hidden="true" />
              <span>{tMap("viewMap")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
