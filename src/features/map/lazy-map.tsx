"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useTranslations } from "next-intl";
import type { MapContainerProps } from "./map-container";

export function MapSkeleton() {
  const t = useTranslations("wells.map");
  return (
    <div
      role="status"
      aria-label={t("title")}
      className="flex h-[calc(100vh-140px)] min-h-[500px] w-full items-center justify-center rounded-xl border border-gray-200 bg-slate-100"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <span className="text-sm font-medium text-gray-600">{t("title")}</span>
      </div>
    </div>
  );
}

export const LazyMap = dynamic<MapContainerProps>(
  () => import("./map-container").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);
