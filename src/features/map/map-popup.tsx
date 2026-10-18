"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X, ArrowDown, ArrowUp, Minus, ExternalLink } from "lucide-react";
import type { MapPointProperties } from "@/server/map/types";

export interface MapPopupProps {
  properties: MapPointProperties;
  locale: string;
  unit?: "m" | "ft";
  onClose: () => void;
}

export function MapPopup({ properties, locale, unit = "m", onClose }: MapPopupProps) {
  const t = useTranslations("wells.map");
  const {
    id,
    name,
    status,
    isOwned,
    isJittered,
    depthToWaterM,
    trend7d,
    lastReadingAt,
    villageName,
  } = properties;

  // Unit conversion
  const depthValue =
    depthToWaterM !== null && depthToWaterM !== undefined
      ? unit === "ft"
        ? (depthToWaterM * 3.28084).toFixed(1)
        : depthToWaterM.toFixed(1)
      : null;

  const unitLabel = unit === "ft" ? "ft" : "m";

  const statusLabel =
    status === "critical"
      ? t("status.critical")
      : status === "warning"
        ? t("status.warning")
        : status === "normal"
          ? t("status.normal")
          : t("status.unknown");

  const statusColor =
    status === "critical"
      ? "bg-red-100 text-red-800 border-red-300"
      : status === "warning"
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : status === "normal"
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : "bg-slate-100 text-slate-800 border-slate-300";

  return (
    <div
      role="dialog"
      aria-labelledby="map-popup-title"
      className="relative z-20 w-72 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute top-2 right-2 flex h-8 min-h-[32px] w-8 min-w-[32px] items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="pr-6">
        <h3 id="map-popup-title" className="text-base leading-tight font-semibold text-gray-900">
          {name || "Well"}
        </h3>
        {villageName && <p className="mt-0.5 text-xs text-gray-500">{villageName}</p>}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
        {isOwned && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            {t("myWell")}
          </span>
        )}
        {isJittered && <span className="text-xs text-gray-400 italic">{t("approxLocation")}</span>}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">{t("depthToWater")}</span>
          <span className="font-medium text-gray-800">
            {depthValue !== null ? `${depthValue} ${unitLabel}` : t("noData")}
          </span>
        </div>

        {trend7d !== null && trend7d !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t("trend7d")}</span>
            <span className="inline-flex items-center gap-1 font-medium">
              {trend7d > 0.05 ? (
                <>
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">{t("falling")}</span>
                </>
              ) : trend7d < -0.05 ? (
                <>
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600">{t("rising")}</span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{t("stable")}</span>
                </>
              )}
            </span>
          </div>
        )}

        {lastReadingAt && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t("lastReading")}</span>
            <span>{new Date(lastReadingAt).toLocaleDateString(locale)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2">
        <Link
          href={`/${locale}/wells/${id}`}
          className="flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <span>{t("viewDetails")}</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
