import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Info, X } from "lucide-react";
import { getStatusColor, getStatusShape } from "./map-marker";
import type { WellStatusType } from "@/server/map/privacy";

interface MapLegendProps {
  className?: string;
}

const LEGEND_STATUSES: WellStatusType[] = ["critical", "warning", "normal", "unknown"];

export function MapLegend({ className = "" }: MapLegendProps) {
  const t = useTranslations("wells.map");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-md transition-all hover:bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none"
          aria-label={t("title")}
          title={t("title")}
        >
          <Info className="h-5 w-5 text-gray-700" />
        </button>
      ) : (
        <div
          role="complementary"
          aria-label={t("title")}
          className="w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg backdrop-blur-md"
        >
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              {t("filterStatus")}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {LEGEND_STATUSES.map((status) => {
              const color = getStatusColor(status);
              const shape = getStatusShape(status);
              const label = t(`status.${status}`);

              return (
                <div key={status} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center ${shape} border border-white shadow-xs`}
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
