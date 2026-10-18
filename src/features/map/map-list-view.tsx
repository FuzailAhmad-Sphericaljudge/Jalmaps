"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  ArrowUpDown,
} from "lucide-react";
import type { MapFeatureCollection, MapPointProperties } from "@/server/map/types";

export interface MapListViewProps {
  data: MapFeatureCollection;
  locale: string;
  unit?: "m" | "ft";
}

type SortField = "name" | "status" | "depth" | "updated";
type SortOrder = "asc" | "desc";

export function MapListView({ data, locale, unit = "m" }: MapListViewProps) {
  const t = useTranslations("wells.map");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Extract individual well features (ignoring cluster summaries if any)
  const items = useMemo(() => {
    const points: MapPointProperties[] = [];
    for (const feature of data.features) {
      if (!feature.properties.isCluster) {
        points.push(feature.properties as MapPointProperties);
      }
    }

    return points.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = (a.name || "").localeCompare(b.name || "");
      } else if (sortField === "status") {
        const order: Record<string, number> = {
          critical: 1,
          warning: 2,
          normal: 3,
          unknown: 4,
        };
        comparison = (order[a.status] || 5) - (order[b.status] || 5);
      } else if (sortField === "depth") {
        const dA = a.depthToWaterM ?? -1;
        const dB = b.depthToWaterM ?? -1;
        comparison = dA - dB;
      } else if (sortField === "updated") {
        const tA = a.lastReadingAt ? new Date(a.lastReadingAt).getTime() : 0;
        const tB = b.lastReadingAt ? new Date(b.lastReadingAt).getTime() : 0;
        comparison = tA - tB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data.features, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
            <AlertOctagon className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
            <span>{t("status.critical")}</span>
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>{t("status.warning")}</span>
          </span>
        );
      case "normal":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>{t("status.normal")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
            <HelpCircle className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            <span>{t("status.unknown")}</span>
          </span>
        );
    }
  };

  const formatDepth = (depthM: number | null | undefined) => {
    if (depthM === null || depthM === undefined) return t("noData");
    const val = unit === "ft" ? (depthM * 3.28084).toFixed(1) : depthM.toFixed(1);
    const unitLabel = unit === "ft" ? "ft" : "m";
    return `${val} ${unitLabel}`;
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-base font-medium text-gray-700">{t("wellsInView", { count: 0 })}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex min-h-[48px] items-center gap-1 hover:text-gray-900 focus:outline-none"
                >
                  <span>{t("nameHeader")}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <span>{t("villageHeader")}</span>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="flex min-h-[48px] items-center gap-1 hover:text-gray-900 focus:outline-none"
                >
                  <span>{t("statusHeader")}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("depth")}
                  className="flex min-h-[48px] items-center gap-1 hover:text-gray-900 focus:outline-none"
                >
                  <span>{t("depthHeader")}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("updated")}
                  className="flex min-h-[48px] items-center gap-1 hover:text-gray-900 focus:outline-none"
                >
                  <span>{t("updatedHeader")}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((well) => (
              <tr key={well.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/${locale}/wells/${well.id}`}
                    className="flex min-h-[48px] items-center rounded text-blue-600 hover:text-blue-800 hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <span>{well.name || "Well"}</span>
                    {well.isOwned && (
                      <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
                        {t("myWell")}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{well.villageName || "—"}</td>
                <td className="px-4 py-3">{getStatusBadge(well.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-medium text-gray-800">
                    <span>{formatDepth(well.depthToWaterM)}</span>
                    {well.trend7d !== null &&
                      well.trend7d !== undefined &&
                      (well.trend7d > 0.05 ? (
                        <ArrowDown className="h-4 w-4 text-red-500" aria-label={t("falling")} />
                      ) : well.trend7d < -0.05 ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500" aria-label={t("rising")} />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-400" aria-label={t("stable")} />
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {well.lastReadingAt
                    ? new Date(well.lastReadingAt).toLocaleDateString(locale)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
